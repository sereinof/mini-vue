import { reactive, ReactiveEffect } from "@vue/reactivity";
import { hasOwn, isString, ShapeFlags } from "@vue/shared";
import { patchClass } from "packages/runtime-dom/src/modules/class"
import { initProps } from "./componentProps";
import { queueJob } from "./scheduler";
import { getSequence } from "./sequence";
import { createVnode, Fragment, isSameVnode, Text } from "./vnode";

export function createRenderer(renderOptions) {
    let {
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText,
        setText: hostSetText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        createElement: hostCreateElenment,
        createText: hostCreateText,
        patchProp: hostPatchprop,
    } = renderOptions;
    const normalize = (children, i) => {
        if (isString(children[i])) {
            let vnode = createVnode(Text, null, children[i]);
            children[i] = vnode;
        }
        return children[i];
    }

    const mountChildren = (children, container) => {
        for (let i = 0; i < children.length; i++) {
            let child = normalize(children, i);//处理后要进行替换，否则children中存放的依旧是那个字符串
            patch(null, child, container);
        }
    }

    function mountElement(vnode, container, anchor) {
        let { type, props, children, shapeFlag } = vnode;
        vnode.el = hostCreateElenment(type);//将真实元素挂在到这个虚拟节点上，后续用于复用节点
        let el = vnode.el;

        if (props) {
            for (let key in props) {
                hostPatchprop(el, key, null, props[key]);
            }
        }
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {//文本
            hostSetElementText(el, children)
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }
        hostInsert(el, container, anchor);
    }
    const processText = (n1, n2, container) => {
        if (n1 === null) {
            hostInsert((n2.el = hostCreateText(n2.children)), container)
        } else {//两个文本的内容可能变化了
            const el = n2.el = n1.el;
            if (n1.children !== n2.children) {
                hostSetText(el, n2.children)
            }

        }
    }
    const patchProps = (oladProps, newProps, el) => {
        for (let key in newProps) {//新的里面有，直接用新的盖掉即可
            hostPatchprop(el, key, oladProps[key], newProps[key]);
        }
        for (let key in oladProps) {
            if (newProps[key] == null) {//如果老的里面有新的里面咩有则是删除老值
                hostPatchprop(el, key, oladProps[key], undefined)
            }
        }


    }
    const unmountChildren = (children) => {
        for (let i = 0; i < children.length; i++) {
            unmount(children[i]);
        }
    }
    const patchKeyedChildren = (c1, c2, el) => {//比较两个儿子的差异

        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        //sync from start
        while (i <= e1 && i <= 2) {//有任何一方停止循环则直接退出
            const n1 = c1[i];
            const n2 = c2[i];
            //下面还是在特殊处理，处理掉一些能够少比较就少比较的情景
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el);//这样做的是比较两个节点的属性和子节点
            } else {
                break;
            }
            i++;
        }
        //sync from end
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break;
            }
            e1--;
            e2--;
        }
        //common sequence +mount
        //i要步e1大说明有新增的
        //i和e2之间是新增的部分
        if (i > e1) {
            if (i <= e2) {
                while (i <= e2) {
                    const nextPos = e2 + 1;
                    const anchor = nextPos < c2.length ? c2[nextPos].el : null;
                    patch(null, c2[i], el, anchor);//创建新节点扔到容器中
                    i++;
                }
            }
        } else if (i > e2) {
            if (i <= e1) {
                while (i <= e1) {
                    unmount(c1[i]);
                    i++
                }
            }
        }
        //common sequence +unmount
        //i要步e2大说明有卸载的
        //i和e1之间是要新增的部分


        //优化完毕*************
        //乱序对比
        let s1 = i;
        let s2 = i;
        const keyToNewIndexMap = new Map();
        for (let i = s2; i <= e2; i++) {
            keyToNewIndexMap.set(c2[i].key, i);
        }
        //循环老的元素，看一下新的里面有没有
        //如果有需要比较差异，如果没有要添加到列表中
        //老的有新的没有要删除
        const toBePatched = e2 - s2 + 1;//新元素的总个数 
        const newIndexToOldIndexMap = new Array(toBePatched).fill(0);//一个记录是否比对过的映射表
        //获取最长递增子序列】

        for (let i = s1; i <= e1; i++) {
            const oldChild = c1[i];//老的孩子
            let newIndex = keyToNewIndexMap.get(oldChild.key);
            //用老的孩子去新的里面找
            if (newIndex == undefined) {
                unmount(oldChild);
            } else {
                //新的位置对应的老的位置，如果数组里放的值大于零，说明已经patch过了
                newIndexToOldIndexMap[newIndex - s2] = i + 1;
                patch(oldChild, c2[newIndex], el);
            }
        }
        let increment = getSequence(newIndexToOldIndexMap);

        //需要移动位置
        let j = increment.length - 1;
        for (let i = toBePatched - 1; i >= 0; i--) {
            let index = i + s2;
            let current = c2[index];
            let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
            if (newIndexToOldIndexMap[i] === 0) {//创建
                patch(null, current, el, anchor);
            } else {//不是零， 说明是已经比对过属性和儿子的了
                if (i != increment[j]) {
                    hostInsert(current.el, el, anchor);
                } else {
                    j--;
                    console.log('不做插入')
                }



            }
        }
        //以上做法乱序中的元素都操作了一遍，这时候最长递增子序列就要登场了
        //这个地方是vue2没有的哦
    }


    const pathchChildren = (n1, n2, el) => {
        //刚刚说漏了，这里才是最精彩的部分
        const c1 = n1.children;
        const c2 = n2.children;
        const preShapeFlags = n1.shapeFlag;// 之前的
        const shapeFlag = n2.shapeFlag;//之后的
        //比较两个儿子列表的差异了
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (preShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
                //  之前是数组节点儿子，现在是文本节点儿子。需要将数组节点全部卸载
                unmountChildren(c1);
            }
            if (c1 !== c2) {
                //进到这里面说明两个儿子都是文本，且文本内容不一样、
                hostSetElementText(el, c2);
            }
        } else {
            //进到这里面说明不是数组就是空了，新的孩子
            if (preShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    //这里面数组和数组相比，典型的diff算法
                    patchKeyedChildren(c1, c2, el);//全量diff

                } else {
                    //现在不是数组，文本和空
                    unmountChildren(c1);
                }
            } else {
                if (preShapeFlags & ShapeFlags.TEXT_CHILDREN) {
                    hostSetElementText(el, '');
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(c2, el);
                }
            }

        }
    }

    const patchElement = (n1, n2, container) => {
        let el = n2.el = n1.el;//居然进来比对了 当然要复用节点
        let oladProps = n1.props || {};
        let newProps = n2.props || {};
        patchProps(oladProps, newProps, el);//这里不是container而是el，找了好久，幸亏找出了不想computed一样


        pathchChildren(n1, n2, el);
    }

    const processElement = (n1, n2, container, anchor) => {
        if (n1 === null) {
            mountElement(n2, container, anchor)
        } else {

            patchElement(n1, n2, container)//这里估计是重头戏里面的重头戏了，就是元素比对
        }
    }
    const processFragment = (n1, n2, container, anchor) => {
        if (n1 == null) {
            mountChildren(n2.children, container)
        } else {
            pathchChildren(n1, n2, container);//走了是两个数组情况的diff算法
        }
    }

    const publicPropertyMap = {
        $attrs: (i) => i.attrs
    }
    const mountComponent = (vnode, container, anchor) => {
        const { data = () => { }, render, props: propsOptions = {} } = vnode.type;
        const state = reactive(data());
        const instance = {//组件的实例
            state,
            vnode,
            subTree: null,
            isMounted: false,
            update: null,
            propsOptions,
            props: {},
            attrs: {},
            proxy: null,
        }
        // 实例 以及用户传入的props 
        initProps(instance, vnode.props);

        instance.proxy = new Proxy(instance, {
            get(target, key) {
                const { state, props } = target;
                if (state && hasOwn(state, key)) {//说明是自己data里的属性也就是所谓的状态
                    return state[key]

                } else if (props && hasOwn(props, key)) {//说明是props里的数据
                    return props[key];//注意啊 这里都没有使用那个代理对应的反射
                }
                let getter = publicPropertyMap[key];//这里对于访问属性加一层限制，就是只可以访问
                //访问这个映射表里面的属性
                //用户写的模版最终要变成render函数，而模版里的this恰恰就是这个代理对象
                if (getter) {
                    return getter(instance);

                }
            },
            set(target, key, value) {
                const { state, props } = target;
                if (state && hasOwn(state, key)) {//说明是自己data里的属性也就是所谓的状态
                     state[key] = value;
                     return true;

                } else if (props && hasOwn(props, key)) {//说明是props里的数据
    console.warn('attempting to mutate prop')
                }
            }
        })


        const componentUpdateFn = () => {//区分是初始化还是更新
            if (!instance.isMounted) {//初始化

                const subTree = render.call(instance.proxy);//不是bind而是call后续this会改？

                patch(null, subTree, container, anchor)

                instance.subTree = subTree;
                instance.isMounted = true;


            } else {//组件内部更新
                const subTree = render.call(instance.proxy);
                console.log("tmdsssss")
                patch(instance.subTree, subTree, container, anchor);
                instance.subTree = subTree;

            }
        }

        const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
        //调用effect.run可以让组件强制更新渲染
        //我们将组件强制更新的逻辑保存到了组件的实例上
        let update = instance.update = effect.run.bind(effect);
        update();
    }

    const processCommponent = (n1, n2, container, anchor) => {
        if (n1 == null) {
            mountComponent(n2, container, anchor)
        } else {//组件更新靠的是props

        }
    }

    const patch = (n1, n2, container, anchor = null) => {//核心的patch方法
        if (n1 === n2) { return };

        if (n1 && !isSameVnode(n1, n2)) {//判断两个vnode是否相同，不相同卸载再提交，

            unmount(n1);
            n1 = null;
        }

        const { type, shapeFlag } = n2;
        //初始化节点
        //后续还有组件的初次渲染，目前是元素的初始化渲染
        ;
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            case Fragment:
                processFragment(n1, n2, container, anchor);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor);
                } else if (shapeFlag & ShapeFlags.COMPONEBT) {
                    processCommponent(n1, n2, container, anchor)
                }
        }

    }
    const unmount = (vnode) => {
        hostRemove(vnode.el);
    }

    const render = (vnode, container) => {//渲染过程是用你传入的renderOptions来渲染的
        //开始写render方法了，好激动
        //如果当前vnode是空的话，
        if (vnode == null) {
            //卸载逻辑
            if (container._vnode) {
                unmount(container._vnode)
            }

        } else {
            //这里既有初始化的逻辑，也有更新的逻辑
            patch(container._vnode || null, vnode, container)//这一行有点不懂，难道是默认这个container
            //只挂载一个虚拟节点吗？
        }
        container._vnode = vnode
    }
    return {
        render,
    }
}
//文本的处理，需要增加一个类型，因为不能通过document.createElement('文本')
//我们如果传入null的时候在渲染是，需要将dom节点删除

//更新逻辑思考；
// - 如果前后完全没有关系，删除老的，添加新的
// - 老的和新的一样，属性可能不一样，再对比属性，更新属性
//- 比儿子
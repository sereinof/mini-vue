import { reactive, ReactiveEffect } from "@vue/reactivity";
import { hasOwn, invokeArrayFns, isNumber, isString, PatchFlags, ShapeFlags } from "@vue/shared";
import { patchClass } from "packages/runtime-dom/src/modules/class"
import { createComponentInstance, renderComponent, setupComponet } from "./component";
import { hasPropsChanged, initProps, updateProps } from "./componentProps";
import { isKeepAlive } from "./components/KeepAlive";
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
        if (isString(children[i]) || isNumber(children[i])) {
            let vnode = createVnode(Text, null, children[i]);
            children[i] = vnode;
        }
        return children[i];
    }

    const mountChildren = (children, container, parentComponet) => {
        for (let i = 0; i < children.length; i++) {
            let child = normalize(children, i);//处理后要进行替换，否则children中存放的依旧是那个字符串
            patch(null, child, container, parentComponet);
        }
    }

    function mountElement(vnode, container, anchor, parentComponet) {

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
            mountChildren(children, el, parentComponet);
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
    const unmountChildren = (children,parentComponet) => {
        for (let i = 0; i < children.length; i++) {
            unmount(children[i],parentComponet);
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
                    unmount(c1[i],null);
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
                unmount(oldChild,null);
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

    //下面这个方法名字打错了， 但是可以理解为是一个全量diff算法
    const patchChildren = (n1, n2, el, parentComponet) => {
        //刚刚说漏了，这里才是最精彩的部分
        const c1 = n1.children;
        const c2 = n2.children;
        const preShapeFlags = n1.shapeFlag;// 之前的
        const shapeFlag = n2.shapeFlag;//之后的
        //比较两个儿子列表的差异了
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (preShapeFlags & ShapeFlags.ARRAY_CHILDREN) {
                //  之前是数组节点儿子，现在是文本节点儿子。需要将数组节点全部卸载
                unmountChildren(c1,parentComponet);
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
                    unmountChildren(c1,parentComponet);
                }
            } else {
                if (preShapeFlags & ShapeFlags.TEXT_CHILDREN) {
                    hostSetElementText(el, '');
                }
                if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                    mountChildren(c2, el, parentComponet);
                }
            }

        }
    }

    const patchBlockChildren = (n1, n2, parentComponet) => {
        for (let i = 0; i < n2.dynamicChildren.length; i++) {
            patchElement(n1.dynamicChildren[i], n2.dynamicChildren[i], parentComponet);
        }
    }

    const patchElement = (n1, n2, parentComponet) => {
        let el = n2.el = n1.el;//居然进来比对了 当然要复用节点
        let oladProps = n1.props || {};
        let newProps = n2.props || {};

        let { patchFlag } = n2;
        if (patchFlag & PatchFlags.CLASS) {

            if (oladProps.class !== newProps.class) {//对于类名的靶向更新
                hostPatchprop(el, 'class', newProps.class)
            }
            //style。。事件都可以靶向更新 

        } else {
            patchProps(oladProps, newProps, el);//这里不是container而是el，找了好久，幸亏找出了不想computed一样

        }

        if (n2.dynamicChildren) {

            patchBlockChildren(n1, n2, parentComponet)
        } else {
            patchChildren(n1, n2, el, parentComponet);
        }

    }

    const processElement = (n1, n2, container, anchor, parentComponet) => {
        if (n1 === null) {
            mountElement(n2, container, anchor, parentComponet)
        } else {

            patchElement(n1, n2, container)//这里估计是重头戏里面的重头戏了，就是元素比对
        }
    }
    const processFragment = (n1, n2, container, anchor, parentComponet) => {
        if (n1 == null) {
            mountChildren(n2.children, container, parentComponet)
        } else {
            patchChildren(n1, n2, container, parentComponet);//走了是两个数组情况的diff算法
        }
    }
    const updateComponentPreRender = (instance, next) => {
        instance.next = null;//next清空
        instance.vnode = next;//实例上最新的虚拟节点
        updateProps(instance.props, next.props);
        
        Object.assign(instance.slots,next.children)
         
    }

    const setupRenderEffect = (instance, container, anchor) => {

        const { render, vnode } = instance;
        ;
        const componentUpdateFn = () => {//区分是初始化还是更新
            if (!instance.isMounted) {//初始化
                //关于加一些属性到html标签上乳data-v属性，还没有实现

                let { bm, m } = instance;
                if (bm) {
                    invokeArrayFns(bm);
                }
                const subTree = renderComponent(instance);//不是bind而是call后续this会改？

                patch(null, subTree, container, anchor, instance)
              
                instance.subTree = subTree;
                instance.isMounted = true;
                if (m) {
                    invokeArrayFns(m);
                }


            } else {//组件内部更新
                let { next, bu, u } = instance;
                if (next) {
                    //跟新前 我也需要拿到最新的属性来进行更新
                    updateComponentPreRender(instance, next);
                }
                if (bu) {
                    invokeArrayFns(bu)
                }

                const subTree = renderComponent(instance);
                ;
                patch(instance.subTree, subTree, container, anchor, instance);
                instance.subTree = subTree;
                if (u) {
                    invokeArrayFns(u);
                }

            }
        }

        const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update));
        //调用effect.run可以让组件强制更新渲染
        //我们将组件强制更新的逻辑保存到了组件的实例上
        let update = instance.update = effect.run.bind(effect);
        update();
    }

    const mountComponent = (vnode, container, anchor, parentComponet) => {

        //此方法代码十分冗余需要改写
        //1）创建一个实例
        //2）给实例赋值
        //3）创建一个effect
        let instance = vnode.component = createComponentInstance(vnode, parentComponet);

        if (isKeepAlive(vnode)) {
            (instance.ctx as any).renderer = {
                createElement: hostCreateElenment,//创建元素用这个方法
                move(vnode, ocntainer) {
                    hostInsert(vnode.component.subTree.el, container)
                }
            }
        }

        //给实例赋值
        setupComponet(instance);


        // 实例 以及用户传入的props 
        ;
        setupRenderEffect(instance, container, anchor);


    }
    const shouldUpdateComponent = (n1, n2) => {
        const { props: prevProps, children: prevChildren } = n1;
        const { props: nextProps, children: nextChildren } = n2;
        if (prevProps === nextProps) {
            return false;
        }
        if (prevChildren || nextChildren) {
            return true;
        }
        return hasPropsChanged(prevProps, nextProps);

    }
    const undateComponent = (n1, n2) => {
        //instance.props 是响应式的，而且可以更改，属性的更新会导致页面重新渲染
        //注意这里从代码层面获取到instance，2⃣️render函数中是给了一个代理对象，
        //是不能够对props进行更改的
        const instance = (n2.component = n1.component);
        //对于元素来说复用的是节点
        //对于组件来说复用的是实例
        //需要跟新就强制调用组件的update方法
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;//将新的虚拟节点放到instance身上
            instance.update();
        }
        // updateProps(instance,prevProps,nextProps);

    }

    const processCommponent = (n1, n2, container, anchor, parentComponet) => {
        if (n1 == null) {
            mountComponent(n2, container, anchor, parentComponet)
        } else {//组件更新靠的是props
            undateComponent(n1, n2,)
        }
    }

    const patch = (n1, n2, container, anchor = null, parentComponet = null) => {//核心的patch方法

        if (n1 === n2) { return };

        if (n1 && !isSameVnode(n1, n2)) {//判断两个vnode是否相同，不相同卸载再提交，

            unmount(n1,parentComponet);
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
                processFragment(n1, n2, container, anchor, parentComponet);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, anchor, parentComponet);
                } else if (shapeFlag & ShapeFlags.COMPONEBT) {
                    processCommponent(n1, n2, container, anchor, parentComponet)
                } else if (shapeFlag & ShapeFlags.TELEPORT) {

                    type.process(n1, n2, container, anchor, {
                        mountChildren,
                        patchChildren,
                        move(vnode, container, anchor) {
                            hostInsert(vnode.component ? vnode.component.subTree.el : vnode.el, container, anchor);
                        }
                    });
                }
        }

    }
    const unmount = (vnode,parentComponet) => {
        if (vnode.type == Fragment) {
            return unmountChildren(vnode,parentComponet)
        } else if(vnode.shapeFlag &ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE){
     parentComponet.ctx.deactivate(vnode);
        }
        else if (vnode.shapeFlag & ShapeFlags.COMPONEBT) {
            return unmount(vnode.component.subTree,parentComponet)
        }
        hostRemove(vnode.el);
    }

    const render = (vnode, container) => {//渲染过程是用你传入的renderOptions来渲染的
        //开始写render方法了，好激动
        //如果当前vnode是空的话，
        if (vnode == null) {
            //卸载逻辑
            if (container._vnode) {
                unmount(container._vnode,null)
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
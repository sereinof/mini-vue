import { proxyRefs, reactive } from "@vue/reactivity";
import { hasOwn, isFunction, isObject, ShapeFlags } from "@vue/shared";
import { initProps } from "./componentProps";

export let currentInstance = null;
export const setcurrentInstance=(instance)=>currentInstance =instance
export const getcurrentInstance = ()=>currentInstance;
export function createComponentInstance(vnode) {
    const instance = {//组件的实例
        data: null,
        vnode,
        subTree: null,
        isMounted: false,
        update: null,
        propsOptions: vnode.type.props,
        props: {},
        attrs: {},
        proxy: null,
        render: null,
        setUpState: {},
        slots: {},//这里就是插槽相关的内容
    }
    return instance;

}

const publicPropertyMap = {
    $attrs: (i) => i.attrs,
    $slots:(i)=>i.slots,
}
const publicInstanceProxy = {
    get(target, key) {
        const { data, props, setUpState } = target;
        if (data && hasOwn(data, key)) {//说明是自己data里的属性也就是所谓的状态
            return data[key]

        } else if (hasOwn(setUpState, key)) {
            return setUpState[key];
        }
        else if (props && hasOwn(props, key)) {//说明是props里的数据
            return props[key];//注意啊 这里都没有使用那个代理对应的反射
        }

        let getter = publicPropertyMap[key];//这里对于访问属性加一层限制，就是只可以访问
        //访问这个映射表里面的属性
        //用户写的模版最终要变成render函数，而模版里的this恰恰就是这个代理对象
        if (getter) {
            
            return getter(target);

        }
    },
    set(target, key, value) {
        const { data, props, setUpState } = target;
        if (data && hasOwn(data, key)) {//说明是自己data里的属性也就是所谓的状态
            data[key] = value;
            return true;
            //用户操作的属性是代理对象，这里面被屏蔽了
            //但是我们可以通过instance.props 拿到真实props
            //这里面还有个get currentinstance
        } else if (hasOwn(setUpState, key)) {
            setUpState[key] = value;
            return true;
        }
        else if (props && hasOwn(props, key)) {//说明是props里的数据
            console.warn('attempting to mutate prop' + (key as string))
        }
    }
}

function initSlots(instance,children){
if(instance.vnode.shapeFlag & ShapeFlags.SLOTS_CHILDREN){
     instance.slots = children;
}
}

export function setupComponet(instance) {

    let { props, type ,children} = instance.vnode;
    initProps(instance, props);
    initSlots(instance,children);//初始化插槽

    instance.proxy = new Proxy(instance, publicInstanceProxy);
    let data = type.data;
    if (data) {//vue2里面的data可以是对象也可以是函数但是vue3都是函数
        if (!isFunction(data)) {
            return console.warn('data option must be function')
        }
        instance.data = reactive(data.call(instance.proxy));
    }

    let setup = type.setup;
    if (setup) {
        const setupContext = {//典型的发布订阅模式，以后别去对上下文有恐惧了好吗
            emit: (event, ...args) => {

                const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
                //找到虚拟节点的属性 有存放props
                const handler = instance.vnode.props[eventName];
                handler && handler(...args);
            }
            ,
            attrs:instance.attrs,
            slots:instance.slots,
        };
        setcurrentInstance(instance);
        const setupResult = setup(instance.props, setupContext);
        setcurrentInstance(null);
        if (isFunction(setupResult)) {
            instance.render = setupResult;
        } else if (isObject(setupResult)) {
            instance.setUpState = proxyRefs(setupResult);


        }
    }
    if (!instance.render) {
        //走完了都还咩有render的话，就区render属性
        instance.render = type.render;

    }
    //由于setup里面也会返回render函数，则下面这一行的代码可能消失
    //instance.render = type.render;
}
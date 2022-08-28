import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";
import { initProps } from "./componentProps";

export function createComponentInstance(vnode){
    const instance = {//组件的实例
        data:null,
        vnode,
        subTree: null,
        isMounted: false,
        update: null,
        propsOptions:vnode.type.props,
        props: {},
        attrs: {},
        proxy: null,
        render:null,
    }
    return instance;

}

const publicPropertyMap = {
    $attrs: (i) => i.attrs
}
const publicInstanceProxy = {
    get(target, key) {
        const { data, props } = target;
        if (data && hasOwn(data, key)) {//说明是自己data里的属性也就是所谓的状态
            return data[key]

        } else if (props && hasOwn(props, key)) {//说明是props里的数据
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
        const { data, props } = target;
        if (data && hasOwn(data, key)) {//说明是自己data里的属性也就是所谓的状态
             data[key] = value;
             return true;
//用户操作的属性是代理对象，这里面被屏蔽了
//但是我们可以通过instance.props 拿到真实props
//这里面还有个get currentinstance
        } else if (props && hasOwn(props, key)) {//说明是props里的数据
console.warn('attempting to mutate prop' +(key as string))
        }
    }
}

export function setupComponet(instance){

    let {props,type} = instance.vnode;
    initProps(instance,props);


    instance.proxy = new Proxy(instance,publicInstanceProxy );
    let data =type.data;
    if(data){//vue2里面的data可以是对象也可以是函数但是vue3都是函数
  if(!isFunction(data)){
    return console.warn('data option must be function')
  }
  instance.data = reactive(data.call(instance.proxy));
  instance.render = type.render;
    }
}
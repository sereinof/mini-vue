import { isObject } from '@vue/shared';
import {ReactiveFlags,mutableHandlers} from'./baseHandler'
//将数据转换为响应式数据，这个只能做对象的代理哦 
const reactiveMap = new WeakMap();//key只能是对象;这个的用处解决用户对一个对象进行多次代理的问题

export  function isReactive(value){
  return !!(value && value[ReactiveFlags.IS_REACTIVE])
}
//实现同一个对象代理多次，返回同一个代理
//代理对象被再次代理，可以直接返回
export function reactive(target) {
    if (!isObject(target)) {
        return;
    };
    if(target[ReactiveFlags.IS_REACTIVE]){
        return target;
    }
    let existingProxy  = reactiveMap.get(target);
    if(existingProxy){
        return existingProxy;
    }
    //还要对一种情况做处理，就是用户可能对一个响应式的proxy有进行了代理
    const proxy =  new Proxy(target,mutableHandlers);
    reactiveMap.set(target,proxy)
    return proxy;
}
import { isObject } from '@vue/shared';
import { reactive } from './reactive';
import { activeEffevt, track ,trigger} from './effect';//需要借助这个变量，有重要用处；
//这里引入的是一个引用？据说和commonjs不太一样吗？这个之前还真没了解过啊
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
}
export const mutableHandlers = {
    get(target, key, receiver) {
        //下面的判断用来配合处理是否target是一个proxy
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true;
        }
        track(target, 'get', key);//该方法有大用处，就是需要effect和对应的属性收集起来，这也是一个重要的部分
        //这里可以监控到用户取值了
        let res =Reflect.get(target, key, receiver);//r如果取到的也是一个对象，则需要对这个对象继续进行代理
         if(isObject(res)){
            return reactive(res);//这就是一个深度代理，并且是一个懒递归，这个性能也是比较高
         }
        return res;
    },
    set(target, key, value, receiver) {
        //这里可以监控到用户改变值了
        let oldValue = target[key];
        let result =  Reflect.set(target, key, value, receiver);
        if(oldValue!=value){//只变化了，需要触发effect，神奇的一幕就要发生了
   trigger(target,'set',key,value,oldValue);
        }
        return result;
    },
}
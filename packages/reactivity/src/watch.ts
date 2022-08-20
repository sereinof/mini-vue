import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";


function traversal(value,set = new Set()){//考虑对象中哦有没有循环引用的问题
if(isObject(value))return value;
if(set.has(value)){
    return value;
}
set.add(value)

for(let key in value){
    traversal(value[key]);
}
}


//在源码中watch其实不在响应式模块里面
//source是用户传入的对象，cb是对应用户的回调
export function watch(source,cb){
    let getter;
    if(isReactive(source)){
//对我们用户传入的数据进行循环
getter = ()=>source;
    }else if(isFunction(source)){
   getter = source;
    }
    let cleanup ;
    const onCleanup = (fn)=>{
cleanup =fn;//保存用户的函数
    }
    const job = ()=>{
        if(cleanup)cleanup();
        const newValue = effect.run();
cb(newValue,oldValue,onCleanup);
//这里保存用户方法的那个部分虽然有点绕，但是意思很简单，就是第一次不执行用户的方法，以后每次变都会执行用户
//的方法，实现取消
oldValue = newValue;
}
    let oldValue;
  const effect = new ReactiveEffect(getter,job);
  oldValue =  effect.run();//这里仍然是effect默认执行一次，
}
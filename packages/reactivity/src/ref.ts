import { isArray, isObject } from "@vue/shared"

import { trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive"

function toReactive(value){
return isObject(value)?reactive(value):value
}

class RefImpl{
    public dep = new Set();
    public _value;
    public __v_isRef =true;
    constructor(public rawValue){
 this._value = toReactive(rawValue);
    }
    get value(){
 return this._value;
    }
    set value(newvalue){
        trackEffects(this.dep)
        if(newvalue!==this.rawValue){
            this._value =toReactive(newvalue);
            this.rawValue = newvalue;
            triggerEffects(this.dep)
        }
    }
}

export function ref(value){
 return new RefImpl(value)
}
class ObjectRefImpl{
    constructor(public object,public key){

    }
    set value(newValue){
this.object[this.key]=newValue
    }
    get value(){
return this.object[this.key]
    }
}

function toRef(object,key){
return new ObjectRefImpl(object,key);
}
export  function toRefs(object){
  const  result =  isArray(object)?new Array(object.length):{};
  for(let key in object){
    result[key] = toRef(object,key)
  }
}

//下面的API可以实现让你在模板里面写的时候不用取加.value就是会自动给你加上
//这个API的话一般开发者是用不到的
export function proxyRefs(object){
  return new Proxy(object,{
    get(target,key,receiver){
        let r = Reflect.get(target,key,receiver);
        return r.___v_isRef?r.value:r;//如果是一个ref的话就帮你点一下value，
    },
    set(target,key,value,receiver){
        let oldValue = target[key];
        if(oldValue.___v_isRef){
            oldValue.value = value;
            return true;
        }else{
            return Reflect.set(target,key,key,receiver);
        }
    }
  })
}

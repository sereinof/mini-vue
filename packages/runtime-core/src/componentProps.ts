import { reactive } from "@vue/reactivity";
import { hasOwn } from "@vue/shared";

export function initProps(instance,rawProps){//后面参数表示用户传的
 const props = {};
 const attrs = {};
 const options = instance.propsOptions || {};

 if(rawProps){
    for(let key in rawProps){
        const value = rawProps[key];
          if(hasOwn(options,key)){
             props[key] = value;
          }else{
            attrs[key] = value;
          }
    }
 }
 //这里的props不希望在组件内部被更改。但是props得是响应式的，因为后续属性变化了更新的师徒
instance.props = reactive(props);//源码里面用的shallowreactive
instance.attrs = attrs;
}
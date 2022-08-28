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
const hasPropsChanged = (prevProps={},nextProps={})=>{
const nextKeys = Object.keys(nextProps);
if(nextKeys.length!==Object.keys(prevProps).length){
    return true;
};//比对属性前后，个数是否一致
for(let i=0;i<nextKeys.length;i++){
    const key = nextKeys[i];
    if(nextProps[key]!==prevProps[key]){
        return true;
    }
}//比对属性对应的值是否一致
return false;
}
export function updateProps(instance,prevProps,nextProps){
    if(hasPropsChanged(prevProps,nextProps)){
        for(const key in nextProps){
            instance.props[key] =nextProps[key];
        }
        for(const key in instance.props){
            if(!hasOwn(nextProps,key)){
                delete instance.props[key];
            }
        }
    };
}
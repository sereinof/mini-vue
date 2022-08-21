import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

//dom属性操作的API，没想到是这么的复杂，就一个属性而已，
export function patchProp(el,key,prevValue,nextValue){
//类名， el.className
if(key=='class'){
    patchClass(el,nextValue);
}else if(key==='style'){
    patchStyle(el,prevValue,nextValue);//样式 el.style
}else if(/^on[^a-z]/.test('key')){
    patchEvent(el,key,nextValue);// events
}else{
    patchAttr(el,key,nextValue);//普通属性
}





}
//加一下虚拟dom
//如何创建真实dom
//dom diff 最长递增子序列
//组件的实现 模板渲染 核心的组件更新 ，teleport suspense

//模版的变异原理 + 代码转化 +代码生成（变异优化）
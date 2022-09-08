import { isArray, isFunction, isObject, isString, ShapeFlags } from "@vue/shared";
import { isTeleport } from "./components/Teleport";
 export const Text = Symbol('Text');
 export const Fragment = Symbol('Ftagment');
 //vue3组件不需要一个根标签就是基于这个fragment实现的
export function isVnode(value){
    return !!(value && value.__v_isVode);
}
export function isSameVnode(n1,n2){//判断两个虚拟节点是不，套路是1）标签名相同 2）key是一样的
  return (n1.type ===n2.type)&& (n1.key === n2.key)
}

//虚拟节点有很多，组件，元素，文本
export function createVnode(type, props, children=null,patchFlag=0) {
    //组合方案，shapeFlag 想知道一个元素中包含的是多个儿子，还是一个儿子；

    let shapeFlag = isString(type) ? ShapeFlags.ELEMENT :
    isTeleport(type)?ShapeFlags.TELEPORT: 
    isFunction(type)?ShapeFlags.FUNCTIONAL_COMPONENT:
    isObject(type)?ShapeFlags.STATEFUL_COMPONENT: 0;
    const vnode = {
        type,
        props,
        children,
        el:null,//虚拟节点上对应的真实节点，后续diff算法
        key:props?.['key'],
        __v_isVode:true,
        shapeFlag,
        patchFlag
    };
    if (children) {
        let type = 0;
        if (isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN;
        } else if (isObject(children)){
            //插槽 
            type = ShapeFlags.SLOTS_CHILDREN;
        }else {
            children = String(children);
            type = ShapeFlags.TEXT_CHILDREN;
        }
        vnode.shapeFlag = vnode.shapeFlag |type;//
        //这样就表示出这个vnode里面是一个文本还是数组
    }
    if(currentBlock && vnode.patchFlag){
        currentBlock.push(vnode);
    }
    return vnode;
}

export {createVnode as createElementVnode}

let currentBlock = null;
export function openBlock(){//用一个数组来收集多个动态节点
    //借鉴生命周期的思想
    currentBlock = [];
}
function setupBlock(vnode){
  vnode.dynamicChildren = currentBlock;
  currentBlock = null;
  return vnode;
}

export function createElementBlock(type,props,children,patchFlag){
    return   setupBlock(createVnode(type,props,children,patchFlag));
}
 /* export function _createElementVnode(){

 } */
export function toDisplayString(val){
 return isString(val)?val:val==null?'':isObject(val)?JSON.stringify(val):String(val);
}
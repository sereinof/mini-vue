import { isArray, isString, ShapeFlags } from "@vue/shared";
 export const Text = Symbol('Text');
export function isVnode(value){
    return !!(value && value.__v_isVode);
}
export function isSameVnode(n1,n2){//判断两个虚拟节点是不，套路是1）标签名相同 2）key是一样的
  return (n1.type ===n2.type)&& (n1.key === n2.key)
}

//虚拟节点有很多，组件，元素，文本
export function createVnode(type, props, children=null) {
    //组合方案，shapeFlag 想知道一个元素中包含的是多个儿子，还是一个儿子；

    let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
    const vnode = {
        type,
        props,
        children,
        el:null,//虚拟节点上对应的真实节点，后续diff算法
        key:props?.['key'],
        __v_isVode:true,
        shapeFlag,
    };
    if (children) {
        let type = 0;
        if (isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN;
        } else {
            children = String(children);
            type = ShapeFlags.TEXT_CHILDREN;
        }
        vnode.shapeFlag = vnode.shapeFlag |type;//
        //这样就表示出这个vnode里面是一个文本还是数组
    }
    return vnode;
}
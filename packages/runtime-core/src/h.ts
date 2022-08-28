//h的用法 h('div')
//h('div',{style:{"color":"red"}})
//h('div',{style:{"color":"red"}},"hello")
//h('div',"hello")
//h('div',null.'hellow','world')
//h('div',null,h('span'))
//h('div',null,[h('spab')])

import { isArray, isObject } from "@vue/shared";
import { createVnode, isVnode } from "./vnode";

export function h(type, propsChildren, children) {
    ;
    const l = arguments.length;
    if (l === 2) {
        if(isObject(propsChildren)&&!isArray(propsChildren)){
            if (isVnode(propsChildren)) {
                return createVnode(type, null, propsChildren)
            }
            return createVnode(type,propsChildren)
        }else{
           return  createVnode(type,null,propsChildren)//数组或者文本 
        }
    } else {
        if (l > 3) {
  children = Array.from(arguments).slice(2);
        } else if (l === 3&& isVnode(children)) {
   children = [children];
        }
        //其他
      return   createVnode(type,propsChildren,children)
    }
}
import { CREATE_ELEMENT_VNODE, CREATE_TEXT } from "./runtimeHelpers";

export const enum NodeTypes {
ROOT,//跟节点
ELEMENT,//元素
TEXT,//文本
COMMENT,//注释
SIMPLE_EXPRESSION,//简单表达
INTERPOLATION,//模版表达式
ATTRIBUTE,
DIRECTIVE,
//containers
COMPOUND_EXPRESSION,//复合表达式
IF,
If_BRANCH,
FOR,
TEXT_CALL,//文本调用 
//codegen
VNODE_CALL,//元素调用
JS_CALL_EXPRESS,//js调用表达式
JS_OBJECT_EXPRESSION,
}
export function createCallExpression(context,args){
   let callee =  context.helper(CREATE_TEXT);
   return {
    callee, 
    type:NodeTypes.JS_CALL_EXPRESS,
    arguments:args,
   }
}
export function createObjectExpression(properties){
    
    return {
      type:NodeTypes.JS_OBJECT_EXPRESSION,
      properties,
    }

}
export function createVnodeCall(context,vnodeTag,propsExpression,childrenNode){
       let callee =context.helper(CREATE_ELEMENT_VNODE);
       return {
    type:NodeTypes.VNODE_CALL,
    tag:vnodeTag,
    props:propsExpression,
    children:childrenNode,
       }
}
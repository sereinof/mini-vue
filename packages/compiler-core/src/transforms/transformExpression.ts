import { NodeTypes } from "../ast";

 export function transformExpression(node,contexts) {
//是不是表达式
if(node.type === NodeTypes.INTERPOLATION){
    let content = node.content.content;
    node.content.content = `_ctx.${content}`
}
}
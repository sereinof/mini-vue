import { createObjectExpression, createVnodeCall, NodeTypes } from "../ast";

export function transformElment(node, context) {
    if (NodeTypes.ELEMENT === node.type) {
        return () => {
            //createElement('div',{},孩子)
            let vnodeTag = `"${node.tag}"`;
            let preperties = [];
            let props = node.props;
            for (let i = 0; i < props.length; i++) {
                preperties.push({
                    key: props[i].name,
                    value: props[i].value.content,
                })
            }
            //创建一个属性表达式
        const propsExpression = preperties.length>0?createObjectExpression(preperties):null;
        //需要考虑孩子的情况
        let childrenNode = null;
        if(node.children.length===1){
              const childrenNode = node.children[0];
        }else if(node.children.length>1){
            childrenNode=   node.children
        }

        //createElementVnode
        node.codegenNode = createVnodeCall(context,vnodeTag,propsExpression,childrenNode);
        }
      
    }


}
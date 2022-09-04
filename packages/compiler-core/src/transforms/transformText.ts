import { PatchFlags } from "@vue/shared";
import { createCallExpression, NodeTypes } from "../ast";
export function isText(node) {

    return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT

}
export function transformTxet(node, context) {//我希望将多个子节点拼在一起
    if (node.type === NodeTypes.ELEMENT || node.type === NodeTypes.ROOT) {
        return () => {
            console.log('children', node.children);
            let currentContainer = null;
            let children = node.children;
            let hasText = false;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];//拿到第一个孩子
                hasText = true;
                if (isText(child)) {
                    //看下一个节点是不是文本
                    for (let j = i + 1; j < children.length; j++) {
                        let next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: NodeTypes.COMPOUND_EXPRESSION,
                                    children: [child]
                                }
                            }
                            currentContainer.children.push('+', next);
                            children.splice(j, 1);
                        } else {
                            currentContainer = null;
                            break;
                        }
                    }
                }
            }
            if (!hasText || children.length === 1) {
                return;
            }
            //需要给多个儿子中的创建文本节点添加patch Flag
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const callArgs = [];
                //
                if (isText(child) || child.type == NodeTypes.COMPOUND_EXPRESSION) {
                    //都是文本
                    callArgs.push(child);
                    if (node.type !== NodeTypes.TEXT) {
                        //动态节点
                        callArgs.push(PatchFlags.TEXT);
                    }
                    children[i] = {
                        type:NodeTypes.TEXT_CALL,
                        content:child,
                        condegenNode:createCallExpression(context,''),
                    }
                }
            
            }
        }
    }


}
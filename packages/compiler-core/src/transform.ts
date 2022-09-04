import { createVnodeCall, NodeTypes } from "./ast";
import { CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE, FRAGMENT, OPEN_BLOCK, TO_DISPLAY_STRING } from "./runtimeHelpers";
import { transformElment } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformTxet } from "./transforms/transformText";




function createTransformContext(root) {
    const context = {
        currentNode: root,//当前正在转化的是谁
        parent: null,//当前转化的父节点是谁
        helpers: new Map(),//优化，超过20个相同节点会被字符串化
        helper(name) {//根据使用过的方法进行优化
            const count = context.helpers.get(name) || 0;
            context.helpers.set(name, count + 1);
            return name;
        },
        removeHelper(name) {
            const count = context.helpers.get(name);
            if (count) {
                const currentCount = count - 1;
                if (!currentCount) {
                    context.helpers.delete(name);
                } else {
                    context.helpers.set(name, currentCount);
                }
            }
        },
        nodeTransforms: [//都会调用，但是每个方法自己要判断
            transformElment,
            transformTxet,
            transformExpression,

        ]
    }
    return context;
}

function traverse(node, context) {
    context.currentNode = node;
    const transforms = context.nodeTransforms;
    const exitsFns = [];
    for (let i = 0; i < transforms.length; i++) {
        let onExit = transforms[i](node, context);//在执行的时候又可能这个node被删除了？
        if (onExit) {
            exitsFns.push(onExit);

        }
        if (!context.currentNode) return;//如果当前节点被删掉了，那么就不考虑当前节点了
    }
    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            //宏 常量
            context.helper(TO_DISPLAY_STRING)
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:

            for (let i = 0; i < node.children.length; i++) {
                context.parent = node;
                traverse(node.children[i], context)
            }
    }
    context.currentNode = node;//当执行退出函数的 时候，复原
    //这里的退出函数的作用不是很清楚啊
    let i = exitsFns.length;
    while (i--) {
        exitsFns[i]();
    }

}

function createRootCodegen(ast, context) {

    let { children } = ast;
    if (children.length === 1) {
        const child = children[0];
        //如果是元素，还可能就是一个文本
        if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
        ast.codegenNode = child.codegenNode;
        //调用的是openBlock 
        context.removeHelper(CREATE_ELEMENT_VNODE);
        context.helper(OPEN_BLOCK);
        context.helper(CREATE_ELEMENT_BLOCK);
        ast.codegenNode.isBlock = true;//

        }else{
            ast.codegenNode = child;

        }
    } else {
        if(children.length ===0) return;
        ast.codegenNode = createVnodeCall(context,context.helper(FRAGMENT),null,children);
        context.helper(OPEN_BLOCK);
        context.helper(CREATE_ELEMENT_BLOCK);
        ast.codegenNode.isBlock = true;// 
    }

}

export function transform(ast) {
    //对树进行遍历操作、
    const context = createTransformContext(ast);
    traverse(ast, context);

    createRootCodegen(ast, context);
    ast.helpers = [...context.helpers.keys()];
    console.log(ast.helpers)
}
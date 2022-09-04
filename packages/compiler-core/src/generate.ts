import { NodeTypes } from "./ast";
import { helperMap, TO_DISPLAY_STRING } from "./runtimeHelpers";

function createCodegenContext(ast) {
    const context = {
        code: '',//最后的生成结果
        helper(name) {
            return `${helperMap[name]}`
        },
        push(code) {
            context.code = context.code + code;
        },
        indentLevel: 0,//
        indent() {//向后缩进
            ++context.indentLevel;
            context.newLine()
        },
        deindent(whithoutNewLine = false) {//向前缩进
            if (whithoutNewLine) {
                --context.indentLevel;
            } else {
                --context.indentLevel;
                context.newLine()
            }

        },
        newLine() {
            newLine(context.indentLevel)
        }//根据indent Level来生成新的行


    }
    return context;
    function newLine(n) {
        context.push('\n' + '   '.repeat(n));
    }
}

function genFunctionPreable(ast, context) {
    if (ast.helpers.length > 0) {
        context.push(`import{ ${ast.helpers.map(h => `${context.helper(h)} as ${context.helper(h)}`).join(',')
            } } from "vue" `);
        context.newLine();
    }
    context.push(`export  `)
}

function genInterPolation(node,context){
context.push(`${helperMap[TO_DISPLAY_STRING]}(`);

genNode(node.content,context);
context.push(')');
}

function genText(node, context) {
    context.push(JSON.stringify(node.content))

}

 function   genExpression(node,context){
    context.push(node.content);
 };

function genNode(node, context) {

    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context);//这里有点bug
            break;
        case NodeTypes.INTERPOLATION:
            genInterPolation(node,context);
            break
        case NodeTypes.SIMPLE_EXPRESSION:  
        genExpression(node,context);
        break;
           //元素-》元素对象 -》元素的儿子递归
 }

}

export function generate(ast) {

    const context = createCodegenContext(ast);
    const { push, indent, deindent } = context;
    genFunctionPreable(ast, context);

    const functionName = 'render  ';
    const args = ['_ctx', '_cache', '$props'];
    push(`function ${functionName}(${args.join(',')}){`);
    indent();
    push('return ');
    debugger
    if (ast.codegenNode) {


        genNode(ast.codegenNode, context);
    } else {
        push('null')
    }


    deindent();

    push('}')
    console.log(context.code);

}
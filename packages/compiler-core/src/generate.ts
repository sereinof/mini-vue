function createCodegenContext(ast) {
    const context = {
        code: '',//最后的生成结果
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

export function generate(ast) {

    const context = createCodegenContext(ast);
context.push('var a = 1');
context.indent();
context.push('var b = 3');
context.deindent();
context.push('var v = 444')
 console.log(context.code)
}
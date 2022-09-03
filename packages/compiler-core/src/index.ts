import { NodeTypes } from "./ast";

function createParserContext(template: any) {
  return {
    line: 1,
    column: 1,
    offset: 0,
    source: template,//此字段会被不停的进行解析，也就是被消费，具体用slice方法
    originalSource: template,
  }
}


function isEnd(context) {
  const source = context.source;
  return !source;//解析到最后一个字符串
}
function getCursor(context) {
  let { line, column, offset } = context;
  return { line, column, offset };
}

function advancePositionWithMutation(context, source, endIndex) {
  let lineCount = 0;
  let linePos = -1;
  for (let i = 0; i < endIndex; i++) {
    if (source.charCodeAt(i) == 10) {//换行符
      lineCount++;
      linePos = i;
    }
  }
  context.line += lineCount; 
  context.offset += endIndex;
  context.column = linePos ==-1?context.column+endIndex:endIndex - linePos
}
function advanceBy(context, endIndex) {
  let source = context.source;
  //每次删除内容的时候，都要更新最新的行列号和偏移量信息
  advancePositionWithMutation(context, source, endIndex);

  context.source = source.slice(endIndex);
  console.log(context.source)
}

function parseTextData(context, endIndex) {
  const rawText = context.source.slice(0, endIndex);
  //下面函数实现消费
  advanceBy(context, endIndex)
  return rawText;
}
function getSelection(context,start,end?){
  end = end || getCursor(context);
  return {
    start,
    end,
    source:context.originalSource.slice(start.offset,end.offset),
  }
}

function parseText(context) {
  //在解析文本的时候，要看 后面到哪里结束
  let endTokens = ['<', '{{'];
  let endIndex = context.source.length;//默认认为到最后结束

  for (let i = 0; i < endTokens.length; i++) {
    let index = context.source.indexOf(endTokens[i], 1);
    //找到了，并且第一次比整个字符串小
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }
  //创建行列信息、
   const start=  getCursor(context)//开始
  //取内容
  const content = parseTextData(context, endIndex);
  return {
    type:NodeTypes.TEXT,
    content:content,
    loc:getSelection(context,start),
  }
}
function parseInterpolation(context){//处理表达式的信息
  const start = getCursor(context);
  const closeIndex = context.source.indexOf('}}',2)//查找结束的大括号
  advanceBy(context,2);
  const innerStart = getCursor(context);
  const innerEnd = getCursor(context);
  //拿到原始的内容
  const rawContentLength = closeIndex -2;//此时左边两个大括号已经被消费，在获取右边括号的索引就得到表达式里面代码字符的长度
  let  preContent  =parseTextData(context,rawContentLength);//返回文本内容，实际是方法复用，但是这里的文本代表的是代码 
  let content = preContent.trim();
  let startOffset =  preContent.indexOf(content);//{{   CXXXX}}

  if(startOffset>0){
    advancePositionWithMutation(innerStart,preContent,startOffset)
  }

  let endOffset = startOffset + content.length;
  advancePositionWithMutation(innerEnd,preContent,endOffset);//跟新innerEnd的行列信息
   advanceBy(context,2)//此时里面的代码表达式信息已经获取 需要消费右边两个大括号
   return{
    type:NodeTypes.INTERPOLATION,//表达式
    content:{
      type:NodeTypes.SIMPLE_EXPRESSION,
      content,
      loc:getSelection(context,innerStart,innerEnd)
    },
    loc:getSelection(context,start)
   }
}
function parse(template) {
  //创建一个解析的上下文，来进行处理 
  const context = createParserContext(template);
  // < 元素
  // {{}}说明表达式
  //其他就是文本
  const nodes = [];
  while (!isEnd(context)) {
    const { source } = context;
    let node;
    if (source.startsWith('{{')) {
      node = parseInterpolation(context);
    } else if (source[0] === '<') {//标签
      node = ''
    }//文本
    if (!node) {
      node = parseText(context);
        console.log(node)

    }
    nodes.push(node);

  }
  return nodes
}

export function compile(template) {
  const ast = parse(template);//这里需要将html语法转换成javascript语法
  console.log(ast);
  //对ast语法书尽心一些预先处理

  //Transform(ast);
  console.log('fgvdfbdfbdf')
  //return generate(ast);

}





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
if(context.source.startsWith('</')){
  
  return true;
}

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

function advanceByspaces(context){
  let match = /^[ \t\r\n]+/.exec(context.source);//这个正则干啥用的？匹配正则的？
  if(match){
    advanceBy(context,match[0].length);//消费空格；
  }
}

function parseAttributeValue(context){
 const start = getCursor(context);
 let quote = context.source[0];
 let content;
 if(quote=='"' ||quote==="'"){
  advanceBy(context,1);
  const endIndex = context.source.indexOf(quote);
     content = parseTextData(context,endIndex);//这个方法经常服用
    //简单说一下吧，就是给你一个上下文，并且给你一个结束索引文字，你给我把到这个结
    //结束索引部分的值给消费掉，并且以字符的形式返回这个内容回来，
    advanceBy(context,1)//消费右边的引号
 }
 return {
  content,
  loc:getSelection(context,start),
 }


}

function parseAttribute(context){
const start  = getCursor(context);
const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
 let name = match[0];
 advanceBy(context,name.length);//消费属性名

 advanceByspaces(context);//消费出现的空格

 advanceBy(context,1);//消费等号
 //我只处理单双引号包裹的值
 let value = parseAttributeValue(context);

return {
  type:NodeTypes.ATTRIBUTE,
  name,
  value:{
    type:NodeTypes.TEXT,
    ...value
  },
  loc:getSelection(context,start),
}

}

 function parseAttributes(context){// a-1 b-2>
const props = [];
  while(context.source.length>0 && !context.source.startsWith('>')){
    //在源码里面
    const prop = parseAttribute(context);
    props.push(prop);
    advanceByspaces(context);
  }


return props;
 }

function parseTag(context){
  
  const start = getCursor(context);
  const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source)
  const tag = match[1];
  advanceBy(context,match[0].length);//删除整个标签
  advanceByspaces(context);


   let props =  parseAttributes(context);
  let isSelfCloseing = context.source.startsWith('/>');//自闭合标签？
  advanceBy(context,isSelfCloseing?2:1);
  return{
    type:NodeTypes.ELEMENT,
    tag:tag,
    isSelfCloseing,
    loc:getSelection(context,start),
    children:[],
    props,
  }
}

function parseelement(context){
//解析标签，这里面是比较复杂的，因为会涉及递归嵌套等等
// <div> <br/>  </div>  
 let ele =   parseTag(context);
//这里需要插入处理儿子的逻辑了也是模版渲染里面最为复杂的部分了；
let children = parseChildren(context);//处理儿子的时候可能没有儿子；

 if(context.source.startsWith('</')){
  //处理结束标签，这里处理的很简陋啊， 不考虑的里面嵌套元素以及不考虑里面有空格或者文字啥的
  parseTag(context);//这里不需要返回值哦，直接给你干掉了
 }
 //更新行列信息
 ele.loc = getSelection(context,ele.loc.start);
 ele.children = children;
 return ele;
}
//下面是一个递归方法
  function parseChildren(context){
  const nodes = [];
  while (!isEnd(context)) {
    const { source } = context;
    let node;
    if (source.startsWith('{{')) {
      node = parseInterpolation(context);
    } else if (source[0] === '<') {//标签
      node = parseelement(context);
    }//文本
    if (!node) {
      node = parseText(context);
        console.log(node)

    }
    nodes.push(node);

  }
  nodes.forEach((node,i)=>{
    if(node.type === NodeTypes.TEXT){
     if(!/[^t\r\n\f ] /.test(node.content)){
      nodes[i] = null;
     }; 
    }
  })
  
  return nodes.filter(Boolean);
 }

function parse(template) {
  //创建一个解析的上下文，来进行处理 
  const context = createParserContext(template);
  // < 元素
  // {{}}说明表达式
  //其他就是文本

  const start = getCursor(context)

   let root = createRoot(parseChildren(context),getSelection(context,start))
   
return root
}
function createRoot(nodes,loc){
   return {
    type:NodeTypes.ROOT,//后续转换成vnode的时候就是fragment
    children:nodes,
    loc,
   }
}

export function compile(template) {
  const ast = parse(template);//这里需要将html语法转换成javascript语法
  console.log(ast);
  //对ast语法书尽心一些预先处理

  //Transform(ast);
  console.log('fgvdfbdfbdf')
  //return generate(ast);

}





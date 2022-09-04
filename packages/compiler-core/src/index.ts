import { generate } from "./generate";
import { parse } from "./parse";
import { transform } from "./transform";


export function compile(template) {
  const ast = parse(template);//这里需要将html语法转换成javascript语法
  console.log(ast);
  //对ast语法书尽心一些预先处理

   transform(ast);



  return generate(ast);//最终生成代码 和vue一样

}





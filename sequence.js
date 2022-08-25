function getSequence(arr){
    const len = arr.length;

    const result = [0];
    const p = arr.slice(0);//最后要标记索引 
    let start ;
    let end ;
    let middle;
   let resultLastIndex ;
   for(let i =0;i<len;i++){
    let arrI = arr[i];
    if(arrI!==0){//因为vue里面的序列，零意味着没有意义需要创建
        resultLastIndex=result[result.length-1];
        if(arr[resultLastIndex]<arrI){
            //比较最后一项和当前项的值，如果比最后一项大
            //则将当前索引放到
            result.push(i);
            p[i] = resultLastIndex;//当前放到末尾的要记住他前面的那个人是谁
            continue;
        }
        //这里我们需要通过二分查找，在结果集中找到比当前值大的，用当前索引将其替换掉
        //递增序列，采用二分查找 是最快的
        start =0;
        end= result.length-1;
        while(start<end){
            middle = ((start+end)/2 ) |0;
            if(arr[result[middle]]<arrI){
                start = middle +1;
            }else{
                end = middle;
            }
        }
        //找到中间值后，我们需要做替换操作
        if(arr[result[end]]>arrI){//这里用当前着一项，替换掉已有的比当前大的那一项，
            result[end] = i;
            p[i] =result[end-1];//记住他的那一个人是谁
        }

    }
   }
   //通过最后一项进行回溯
  
let i = result.length;
let last = result[i-1];//找到最后一项了
while(i-- >0){//倒叙遍历 
    result[i] = last;
    last = p[last];

}
return result;
}
console.log(getSequence([2,3,1,5,6,8,7,9,4]))
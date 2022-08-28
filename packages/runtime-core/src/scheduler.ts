 const  queue = [];
 let isFlushing = false;
 const resolvePromise = Promise.resolve();
export function queueJob(job){
if(!queue.includes(job)){
    queue.push(job);
}
//从目前来看这个scheduler参数很有用处，不管是之前的计算属性还是现在的组件都有用到
if(!isFlushing){//批处理逻辑
    isFlushing = true;
   resolvePromise.then(()=>{
    isFlushing = false;
    let copy = queue.slice(0);
    queue.length =0;

    for(let i=0;i<copy.length;i++){
        let job = copy[i];
       
        job();
    }
    copy.length =0;
   })

}
}
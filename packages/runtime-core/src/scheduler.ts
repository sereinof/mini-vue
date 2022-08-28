 const  queue = [];
 let isFlushing = false;
 const resolvePromise = Promise.resolve();
export function queueJob(job){
if(!queue.includes(job)){
    queue.push(job);
}
if(!isFlushing){//批处理逻辑
    isFlushing = true;
   resolvePromise.then(()=>{
    isFlushing = false;
    let copy = queue.slice(0);
    queue.length =0;

    for(let i=0;i<queue.length;i++){
        let job = copy[i];
       
        job();
    }
    copy.length =0;
   })

}
}
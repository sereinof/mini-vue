export function patchStyle(el,prevValue,nextValue){
    //这个样式的需求是这样的，去除之前没有的，添上后面有的，传入的前后两个对象都是一个对象
    for(let key in nextValue){
        el.style[key] = nextValue[key];//用新的覆盖即可
        }
        if(prevValue){
            for(let key in prevValue){
                if(nextValue[key] == null){
                    el.style[key] = null;
                }
            }
        }
}
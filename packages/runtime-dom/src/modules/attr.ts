export function patchAttr(el,key,nextValue){
    if(nextValue){
        el.setAttribute(key,nextValue)
    }else{
        el.removeAttribute(key);
    }
}
export const TelportImpl  = {
    __isTeleport:true,
    process(n1, n2, container, anchor,internals){
        debugger
        let {mountChildren,patchChildren,move} = internals;
   if(!n1){
    const target = document.querySelector(n2.props.to);
    if(target){
        mountChildren(n2.children,target)
    }
   }else{//更新逻辑
    patchChildren(n1,n2,container);//儿子内容变化
    if(n2.props.to!==n1.props.to){//传送的位置发生了变化
const nextTarget =document.querySelector(n2.props.to);
n2.children.forEach(child => {
     move(child,nextTarget,anchor);
});
    }

   }
    }
}
export const isTeleport = (type)=>type.__isTeleport
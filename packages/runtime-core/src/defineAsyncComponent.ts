import { reactive } from "@vue/reactivity"
import { h } from "./h";
import { Fragment } from "./vnode";

export function defineAsyncComponent(loader){
    //哇靠 这个异步组件原理不难，但是有点绕
return {
    setup(){ 
     
        const loaded = reactive({flag:false});
        let Comp = reactive({n:null});
        loader().then((c)=>{
            console.log(c)
     Comp.n =c;
   console.log(loaded);
   
   loaded.flag =true;
        })
        return {loaded,Comp}
    },
    render(){
        return this.loaded.flag?h(this.Comp.n,null,''):h('div',null,'gtg')
    }
}
}
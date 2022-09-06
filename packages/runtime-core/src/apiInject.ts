import { currentInstance } from "./component";

export function provide(key,value){
if(!currentInstance){
    return;//次provide一定要用到setup语法中去
}
 const parentProvides = currentInstance.parent && currentInstance.parent.provides;

let  provides = currentInstance.provides;//自己的provides
if(parentProvides ===provides){
    provides = currentInstance.provides = Object.create(provides);
}
provides[key] = value;

}
export function inject(key){
    if(!currentInstance){
        return;//次provide一定要用到setup语法中去
    }
    debugger;
    const provides  = currentInstance.parent&& currentInstance.parent.provides;
    if(provides && (key in provides)){
        return provides[key];
    }
}
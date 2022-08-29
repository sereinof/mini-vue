import { currentInstance, setcurrentInstance } from "./component";

export const enum LifecycleHooks {
    BEFORE_MOUNT='bm',
    MOUNTED='m',
    BEFORE_UPDATE = 'bu',
    UPDATED = 'u',
}

function createHook(type){
    
return (hook,target=currentInstance)=>{//hook需要绑定要对应的实例上，有点想之前的active effect
 if(target){//关联currentinstance和hook
    debugger
  const hooks = target[type] || (target[type] = [])

const wrapedHook = ()=>{//注意 此处存在闭包
  setcurrentInstance(target);
  hook();
  setcurrentInstance(null);
}
  hooks.push(wrapedHook);
 }
}
}

//工厂模式
export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT)
export const onMounted = createHook(LifecycleHooks.MOUNTED)
export const onUpdated = createHook(LifecycleHooks.UPDATED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE)
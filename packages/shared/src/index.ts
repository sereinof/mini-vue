export const isObject = (value) => {
    return typeof value === 'object' && value !== null
}
export const isFunction = (value) => {
    return typeof value === 'function';
};

export const isString = (value) => {
    return typeof value === 'string';
}
export const isNumber = (value) => {
    return typeof value === 'number';
}
const hasOwnProperty = Object.prototype.hasOwnProperty;
  export const hasOwn = (value,key)=>hasOwnProperty.call(value,key);


export const isArray = Array.isArray;
export const assign = Object.assign;

export const invokeArrayFns=(fns)=>{
    for(let i =0;i<fns.length;i++){
        fns[i]();//奇观，全都执行？
    }
}

export const enum ShapeFlags {
    ELEMENT = 1,
    FUNCTIONAL_COMPONENT = 1<<1,
    STATEFUL_COMPONENT = 1<<2,
    TEXT_CHILDREN = 1<<3,
    ARRAY_CHILDREN = 1<<4,
    SLOTS_CHILDREN = 1<<5,
    TELEPORT = 1<<6,

    SUSPENSE = 1<<7,
    COMPONENT_SHOULD_KEEP_ALIVE = 1<<8,
    CONMONENT_KEPT_ALIVE = 1<<9,
    COMPONEBT = ShapeFlags.STATEFUL_COMPONENT |ShapeFlags.FUNCTIONAL_COMPONENT
}

export const enum PatchFlags {
    TEXT=1,//动态文本节点
    CLASS=1<<1,//动态class
    STYLE = 1<<2,//动态style。
    PROPS = 1<<3,//除了class/style的动态属性
    FULL_PROPS= 1<<4,//有key需要完整的diff
    HYDRATE_EVENTs  =1<<5,//挂载过事件的
    STABLE_FRAGMENT = 1<<6,//稳定序列，自节点顺序不会发生改变
    KEYED_FRAGMENT = 1<<7,//子节点有key的fragment
    UNKEYED_FRAGMENY = 1<<8,//子节点没有key的fragment
    NEED_PATCH = 1<<9.//进行给props比较，ref比较
    
}
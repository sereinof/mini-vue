function creatInvoker(callback) {
    const invoker = (e) => invoker.value(e);
    invoker.value = callback;
    return invoker;
}
//简答说一下这里的原理
//就是这个invoker是一个函数，实际绑定的是这个函数，而这个函数会调用自身上面的value方法
//用户传入的方法会被赋值给value，这样避免的多次调用addEventListener来绑定事件
//不过上述函数的写法，以及下面连等的写法还是令人看起来有点儿懵逼的
//源码中是可以绑定多个回调的就是传入一个数组
export function patchEvent(el, eventName, nextValue) {
    //vue里面对于事件的处理有些许复杂，
//指数级增加事件的bug修复了
    let invokers = el._vei || (el._vei = {});
    let exists = invokers[eventName];
    if (exists) {
        if (nextValue) {
            exists.value = nextValue;
        } else {
            el.removeEventListener(exists);
            invokers[eventName] = null;

        }
    } else {
        let event = eventName.slice(2).toLowerCase();
        if (nextValue) {
            const invoker = invokers[eventName] = creatInvoker(nextValue);
            //上一步这样写，就是增加阅读难度罢了
            el.addEventListener(event, invoker);
        }

    }
}
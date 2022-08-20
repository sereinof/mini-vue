export let activeEffevt = undefined;//注意这个变量是十分动态的，十分活跃的
function cleanupEffect(effect) {
    const { deps } = effect;
    for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect);//解除effect。重新收集依赖，注意这个delete是set对象上面的方法
        //上述循环遍历的set其实就是targetMap里面得到set
        //注意trigger里面是根据targetMap来触发的
    }
    effect.deps.lenght = 0;//注意这里做了双方的清理工作，都是因为，effect和对应的对象和属性，存在一个多对多的关系
}

 export class ReactiveEffect {
    public parent = null;//该属性在处理嵌套属性的时候极其有用； 
    public deps = [];//记录属性，和track配合实现属性和effect多对多记录
    active = true;//这个effect默认是激活状态
    constructor(public fn, public scheduler) {

    };
    //不得不说，下面这个run方法实在是太精辟了，实现了数据变的时候，回去渲染页面，至此，对于响应式的原理又深入了一步
    //等等，数据变得时候去执行run方法，数据变得化是去出发set。set是属性和代理处理，如何获得对应的effect？估计又内存结构
    //存储他们之间的映射关系
    //所以那个默认先执行一次run方法里面就完成了这映射关系的绑定。妙啊
    run() {
        if (!this.active) {

            //这里需要将之前的依赖属性字段进行清空，因为effect的函数里面涉及到分支切换，就是修改了某些布尔值的时候，有些属性不在依赖了，
            //有些属性又成为了新的依赖
            cleanupEffect(this);

            this.fn();  //这里表示如果是非激活的情况，只需要执行函数，不需要进行依赖收集--有点不明白啊
            //这里面的逻辑现在接触不到，需要到后面学习到卸载组件的时候可能会用到，现在先不去管它
        }
        try {
            //这里就需要做依赖收集了，如何做？核心就是将当前的effect和稍后渲染的属性关联在一起
            //注意啊，下面的代码实在是太妙了，好好理解啊
            this.parent = activeEffevt;
            activeEffevt = this;
           return  this.fn();//此处加return🈶️特俗意义，找了我好久，我他妈的，
           //还不是要实现computed，获取effect中函数的返回值，太坑了，高了我好久
        } finally {
            activeEffevt = this.parent;//处理嵌套effect用的
            this.parent = null;
        }
    }
    stop() {
        if (this.active) {
            this.active = false;
            cleanupEffect(this);
        }
    }
}

export function effect(fn, options:any= {}) {
    //fn可以根据状态变化，重新执行，并且effect可以嵌套的写，因为组件就是一个嵌套的结构
    const _effect = new ReactiveEffect(fn, options.scheduler);//创建响应式的effect
    _effect.run();//默认要先执行一次

    const runner = _effect.run.bind(_effect);

    runner.effect = _effect;
    return runner;

}
// effect(()=>{
// state.name = "ggrg";
// effect(()=>{
//   state.age = 89;
//})
//state.address = "dgfg"//如果没有处理，那么这里的activeEffeft 将是undefined 出现bug
//})
//对于effect嵌套的情况，老版本的方法是使用一个栈来处理，入栈出栈，
//至于新版本，就是现在要学习的，居然是给每个effect记录它的父亲effect是谁，如此依赖不用借助栈，不用额外的存储空间
//实在是太妙了！！！


const targetMap = new WeakMap();//全局对象注意哦


export function track(target, type, key) {
    if (!activeEffevt) {//只有在模版中使用的属性才会收集，就是模版中的才会
        return;
    }//这里还是借助weakMap进行存储关系，
    //这里的存储方式有些复杂，但是仔细看还是可以看出来的
    //一个对象有多个属性，所以一个源对象对应一个map，
    //这个map的key就是缘对象的各个属性，而各个属性又可以对应不同的属性
    //于是又借助了一个set结构，
    //不过一个属性对应多个effect的情况比较难以理解，
    //难不成一个对象多个组件来用吗？也许吧
    let depsMap = targetMap.get(target);//这个变量就是存储各个属性对应的effect的mao
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()))
    }
    let dep = depsMap.get(key);//此dep就是存储单个属性的effect的set
    if (!dep) {
        depsMap.set(key, (dep = new Set()))
    }
    //由于下面这部分代码在s算属性的里面也会用到， 所以抽离出来，精简代码；
    trackEffects(dep)
  
}
export function trackEffects(dep){
    let shouldTrack = !dep.has(activeEffevt);
    if (shouldTrack) {
        dep.add(activeEffevt);
        activeEffevt.deps.push(dep)//感觉这里有点问题
    }
}
//卧槽 上面只是单向记录，属性记录的effect，难不成effect也需要记录属性？
//反向记录是为了方便清理哦
//有trace就要有trigger。收集了依赖，就要使用，不然收集它干嘛
export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) { return; }//
    let effects = depsMap.get(key);//拿到属性对应的effect集合set
    //这里直接循环effect据说会有错误，就是不断的循环
    //但是我没有遇到这情况呀
    //还要拷贝一个set进行循环
    //真的醉了
    if (effects) {
        //同理，下面代码也要抽离出来，因为计算属性要用的到
      triggerEffects(effects)
    }

}
export function triggerEffects(effects){
    effects = new Set(effects);
    effects.forEach(effect => {
        // effect.run();
        if (effect !== activeEffevt) {

            if (effect.schduler) {

                debugger;
                effect.schduler();//提供调度方法，如果用户传入scheduler方法，则调用这个方法
            } else { effect.run(); }
        }//这边其实是处理effect中有出发set操作的代码的，虽然这种情况很少
        //出现，但是还是需要预防，想象，effect里面有set操作，触发trigger方法，trigger方法又run，然后又是，就是循环了
    });
}  
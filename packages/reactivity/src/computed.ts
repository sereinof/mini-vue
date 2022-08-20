import { isFunction } from "@vue/shared"
import { ReactiveEffect, trackEffects ,triggerEffects} from "./effect";


class ComputedRefImpl {
    public effect;
    public _dirty = true;//默认是脏的
    public __v_isReadonly = true;
    public __v_isRef = true;
    public _value = null;
    public dep =new Set()
    constructor(public getter, public setter) {
        this.effect = new ReactiveEffect(getter, () => {
            //注意这里传入了scheduler调度器，则属性变化会执行这个里·面的方法，看看怎么搞吧
            if (!this._dirty) {
                debugger
                this._dirty = true;
            }
        });
    }
    //终于还是需要劫持一个名叫value的属性了
    //类的属性访问器，底层其实就是object.defineProperty
    get value() {
        trackEffects(this.dep);
        debugger;
        if (this._dirty) {
            this._dirty =false;
            this._value = this.effect.run();
//做依赖收集，注意这里不是在代理里做的，实在get，和set方法，就是说object.definepporpertyf

        }

        return this._value;
    }
    set value(newValue) {
        //这里难道不用判断新旧的值吗？
        triggerEffects(this.dep)
        this.setter(newValue);
    }
}

export const computed = (getterOrOptions) => {
    let onlyGetter = isFunction(getterOrOptions);
    let getter;
    let setter;
    if (onlyGetter) {
        getter = getterOrOptions;
        setter = () => {
            console.warn('no set')
        }
    } else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    return new ComputedRefImpl(getter, setter)
}
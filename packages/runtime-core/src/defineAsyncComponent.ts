import { reactive } from "@vue/reactivity"
import { h } from "./h";
import { Fragment } from "./vnode";

export function defineAsyncComponent(options) {
    //哇靠 这个异步组件原理不难，但是有点绕
    if (typeof options === 'function') {
        options = { loader: options }
    }
    return {
        setup() {
            const error = reactive({ flag: false });
            const loaded = reactive({ flag: false });
            const loading = reactive({ flag: false })
            const { loader, timeout, errorComponent, delay ,loadingComponent} = options;
            if (delay) {
                setTimeout(() => {
                    loading.flag = true
                }, delay)
            }
            let Comp = reactive({ n: null });
            loader().then((c) => {
                Comp.n = c;
                loaded.flag = true;
            }).catch(err => error.flag = err).finally(() => { loading.flag = false })
            setTimeout(() => {
                error.flag = true
            }, timeout)
            return { loaded, Comp }
        },
        render() {
            if (this.loaded.flag) {//正确组件渲染
                return h(this.comp.n, null, '');
            } else if (this.error.flag && this.errorComponent) {
                return h(this.errorComponent, null, '');//错误组件渲染
            }else if(this.loading.flag && this.loadingComponent){
                 return h(this.loadingComponent,null,'');
            }
            return this.loaded.flag ? h(this.Comp.n, null, '') : h('div', null, 'gtg')
        }
    }
}
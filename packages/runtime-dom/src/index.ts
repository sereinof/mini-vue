import { createRenderer } from "@vue/runtime-core";
import { nodeOps } from "./nodeOps";
import { patchProp } from "./patchProp";
const renderOptions = Object.assign(nodeOps, { patchProp })

//注意神奇的h方法，就是就是将你传的一些列参数转化为一个虚拟dom就是一个javascript对象
export function render(vnode, container) {//注意参数，前者是一个虚拟dom后者是一个真实的dom,也称容器
    createRenderer(renderOptions).render(vnode, container);
}
//注意这里有两个render方法，但其实是一个卧槽
//无论是h 方法还是render方法都与dom操作无关，
//这里有点难以理解，h方法无关好理解，但是render方法需要传入一个真实的dom难道这也与dom操作无关吗

export   * from "@vue/runtime-core";
export   * from "@vue/reactivity";

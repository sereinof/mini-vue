import { ShapeFlags } from "@vue/shared";
import { onMounted, onUpdated } from "../apiLifecycle";
import { getcurrentInstance } from "../component";
import { isVnode } from "../vnode";

export const KeepAliveImpl = {
    __isKeepAlive: true,
    setup(props, { slots }) {
        //本身keep-alive
        const keys = new Set();//缓存的key
        const cache = new Map();//哪个key对应的哪个虚拟节点

        const instance = getcurrentInstance();
        let { createElement, move } = instance.ctx.renderer;
        const storageContainer = createElement('div');
        instance.ctx.deactivate = function(vnode){
    move(vnode,storageContainer)
        }
        let pendingCachekey = null;
        function cacheSubTree(){
            if (pendingCachekey) {
                cache.set(pendingCachekey, instance.subTree);
            }
         }
        onMounted(cacheSubTree);
        onUpdated(cacheSubTree)
        return () => {
            //keep-alive 默认会去slots的default属性返回虚拟节点的第一个
            let vnode = slots.default();
            //要求必须式虚拟节点而且是带状态的组件
            if (isVnode(vnode) || !(vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT)) {
                return vnode
            }
            const comp = vnode.type;
            const key = vnode.key == null ? vnode.key : comp;
            let cacheVnode = cache.get(key);//找有没有缓存过
            if (cacheVnode) {

            } else {
                keys.add(key);//缓存key
                pendingCachekey = key;
            }
            vnode.shapeFlag |= ShapeFlags.COMPONENT_SHOULD_KEEP_ALIVE;//标识这个组件稍后是假的卸载
            return vnode;
        }
    }
}
export function isKeepAlive(vnode) {
    return vnode.type.__isKeepAlive;
}
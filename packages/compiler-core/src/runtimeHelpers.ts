export const TO_DISPLAY_STRING  = Symbol('toDisplayString')
export const CREATE_TEXT = Symbol('createTextVNode');
export const CREATE_ELEMENT_VNODE = Symbol('createElementVnode');
export const OPEN_BLOCK = Symbol('openBlock');
export const CREATE_ELEMENT_BLOCK = Symbol('createElementBlock');
export const FRAGMENT = Symbol('fragment');
export const helperMap = {
    [TO_DISPLAY_STRING]:'toDisplayString',
    [CREATE_TEXT] :'createTextVNode',
    [CREATE_ELEMENT_VNODE]:'createElementVnode',
    [OPEN_BLOCK]:'openBlock',
    [CREATE_ELEMENT_BLOCK]:'createElementBlock',
    [FRAGMENT]:'fragment',

}
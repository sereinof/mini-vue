export const TO_DISPLAY_STRING  = Symbol('toDisplayString')
export const CREATE_TEXT = Symbol('createTextVNode');
export const CREATE_ELEMENT_VNODE = Symbol('createElementVnode');
export const helperMap = {
    [TO_DISPLAY_STRING]:'tiDsiplayString',
    [CREATE_TEXT] :'createTextVNode',
    [CREATE_ELEMENT_VNODE]:'createElementVnode'
}
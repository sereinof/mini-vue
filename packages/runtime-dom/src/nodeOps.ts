export const nodeOps = {
    insert(child, parent, anchor = null) {
        parent.insertBefore(child, anchor);//如果anchor为null的话就等价为appendChild，
        //三个参数应该都是真实的dom节点
    },
    remove(child) {
        const parentNode = child.parentNode;
        if (parentNode) {
            parentNode.removeChild(child);
        }
    },
    setElementText(el, text) {
        el.textContent = text;

    },
    setText(node, text) {//document.creatTextNode()
        node.nodeValue = text;
    },
    querySelect(selector) {
        return document.querySelector(selector);
    },
    parentNode(node) {
        return node.parentNode;
    },
    nextSibling(node) {
        return node.nextSibling;
    },
    createElement(tagName) {
        return document.createElement(tagName);
    },
    createText(text) {
        return document.createTextNode(text);
    }
}
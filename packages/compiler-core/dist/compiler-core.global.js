var VueCompilerCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // packages/compiler-core/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    compile: () => compile
  });

  // packages/compiler-core/src/runtimeHelpers.ts
  var TO_DISPLAY_STRING = Symbol("toDisplayString");
  var CREATE_TEXT = Symbol("createTextVNode");
  var CREATE_ELEMENT_VNODE = Symbol("createElementVnode");
  var OPEN_BLOCK = Symbol("openBlock");
  var CREATE_ELEMENT_BLOCK = Symbol("createElementBlock");
  var FRAGMENT = Symbol("fragment");
  var helperMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_TEXT]: "createTextVNode",
    [CREATE_ELEMENT_VNODE]: "createElementVnode",
    [OPEN_BLOCK]: "openBlock",
    [CREATE_ELEMENT_BLOCK]: "createElementBlock",
    [FRAGMENT]: "fragment"
  };

  // packages/compiler-core/src/ast.ts
  function createCallExpression(context, args) {
    let callee = context.helper(CREATE_TEXT);
    return {
      callee,
      type: 14 /* JS_CALL_EXPRESS */,
      arguments: args
    };
  }
  function createObjectExpression(properties) {
    return {
      type: 15 /* JS_OBJECT_EXPRESSION */,
      properties
    };
  }
  function createVnodeCall(context, vnodeTag, propsExpression, childrenNode) {
    let callee = context.helper(CREATE_ELEMENT_VNODE);
    return {
      type: 13 /* VNODE_CALL */,
      tag: vnodeTag,
      props: propsExpression,
      children: childrenNode
    };
  }

  // packages/compiler-core/src/generate.ts
  function createCodegenContext(ast) {
    const context = {
      code: "",
      helper(name) {
        return `${helperMap[name]}`;
      },
      push(code) {
        context.code = context.code + code;
      },
      indentLevel: 0,
      indent() {
        ++context.indentLevel;
        context.newLine();
      },
      deindent(whithoutNewLine = false) {
        if (whithoutNewLine) {
          --context.indentLevel;
        } else {
          --context.indentLevel;
          context.newLine();
        }
      },
      newLine() {
        newLine(context.indentLevel);
      }
    };
    return context;
    function newLine(n) {
      context.push("\n" + "   ".repeat(n));
    }
  }
  function genFunctionPreable(ast, context) {
    if (ast.helpers.length > 0) {
      context.push(`import{ ${ast.helpers.map((h) => `${context.helper(h)} as ${context.helper(h)}`).join(",")} } from "vue" `);
      context.newLine();
    }
    context.push(`export  `);
  }
  function genInterPolation(node, context) {
    context.push(`${helperMap[TO_DISPLAY_STRING]}(`);
    genNode(node.content, context);
    context.push(")");
  }
  function genText(node, context) {
    context.push(JSON.stringify(node.content));
  }
  function genExpression(node, context) {
    context.push(node.content);
  }
  function genNode(node, context) {
    switch (node.type) {
      case 2 /* TEXT */:
        genText(node, context);
        break;
      case 5 /* INTERPOLATION */:
        genInterPolation(node, context);
        break;
      case 4 /* SIMPLE_EXPRESSION */:
        genExpression(node, context);
        break;
    }
  }
  function generate(ast) {
    const context = createCodegenContext(ast);
    const { push, indent, deindent } = context;
    genFunctionPreable(ast, context);
    const functionName = "render  ";
    const args = ["_ctx", "_cache", "$props"];
    push(`function ${functionName}(${args.join(",")}){`);
    indent();
    push("return ");
    debugger;
    if (ast.codegenNode) {
      genNode(ast.codegenNode, context);
    } else {
      push("null");
    }
    deindent();
    push("}");
    console.log(context.code);
  }

  // packages/compiler-core/src/parse.ts
  function createParserContext(template) {
    return {
      line: 1,
      column: 1,
      offset: 0,
      source: template,
      originalSource: template
    };
  }
  function isEnd(context) {
    const source = context.source;
    if (context.source.startsWith("</")) {
      return true;
    }
    return !source;
  }
  function getCursor(context) {
    let { line, column, offset } = context;
    return { line, column, offset };
  }
  function advancePositionWithMutation(context, source, endIndex) {
    let lineCount = 0;
    let linePos = -1;
    for (let i = 0; i < endIndex; i++) {
      if (source.charCodeAt(i) == 10) {
        lineCount++;
        linePos = i;
      }
    }
    context.line += lineCount;
    context.offset += endIndex;
    context.column = linePos == -1 ? context.column + endIndex : endIndex - linePos;
  }
  function advanceBy(context, endIndex) {
    let source = context.source;
    advancePositionWithMutation(context, source, endIndex);
    context.source = source.slice(endIndex);
    console.log(context.source);
  }
  function parseTextData(context, endIndex) {
    const rawText = context.source.slice(0, endIndex);
    advanceBy(context, endIndex);
    return rawText;
  }
  function getSelection(context, start, end) {
    end = end || getCursor(context);
    return {
      start,
      end,
      source: context.originalSource.slice(start.offset, end.offset)
    };
  }
  function parseText(context) {
    let endTokens = ["<", "{{"];
    let endIndex = context.source.length;
    for (let i = 0; i < endTokens.length; i++) {
      let index = context.source.indexOf(endTokens[i], 1);
      if (index !== -1 && endIndex > index) {
        endIndex = index;
      }
    }
    const start = getCursor(context);
    const content = parseTextData(context, endIndex);
    return {
      type: 2 /* TEXT */,
      content,
      loc: getSelection(context, start)
    };
  }
  function parseInterpolation(context) {
    const start = getCursor(context);
    const closeIndex = context.source.indexOf("}}", 2);
    advanceBy(context, 2);
    const innerStart = getCursor(context);
    const innerEnd = getCursor(context);
    const rawContentLength = closeIndex - 2;
    let preContent = parseTextData(context, rawContentLength);
    let content = preContent.trim();
    let startOffset = preContent.indexOf(content);
    if (startOffset > 0) {
      advancePositionWithMutation(innerStart, preContent, startOffset);
    }
    let endOffset = startOffset + content.length;
    advancePositionWithMutation(innerEnd, preContent, endOffset);
    advanceBy(context, 2);
    return {
      type: 5 /* INTERPOLATION */,
      content: {
        type: 4 /* SIMPLE_EXPRESSION */,
        content,
        loc: getSelection(context, innerStart, innerEnd)
      },
      loc: getSelection(context, start),
      children: []
    };
  }
  function advanceByspaces(context) {
    let match = /^[ \t\r\n]+/.exec(context.source);
    if (match) {
      advanceBy(context, match[0].length);
    }
  }
  function parseAttributeValue(context) {
    const start = getCursor(context);
    let quote = context.source[0];
    let content;
    if (quote == '"' || quote === "'") {
      advanceBy(context, 1);
      const endIndex = context.source.indexOf(quote);
      content = parseTextData(context, endIndex);
      advanceBy(context, 1);
    }
    return {
      content,
      loc: getSelection(context, start)
    };
  }
  function parseAttribute(context) {
    const start = getCursor(context);
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
    let name = match[0];
    advanceBy(context, name.length);
    advanceByspaces(context);
    advanceBy(context, 1);
    let value = parseAttributeValue(context);
    return {
      type: 6 /* ATTRIBUTE */,
      name,
      value: __spreadValues({
        type: 2 /* TEXT */
      }, value),
      loc: getSelection(context, start)
    };
  }
  function parseAttributes(context) {
    const props = [];
    while (context.source.length > 0 && !context.source.startsWith(">")) {
      const prop = parseAttribute(context);
      props.push(prop);
      advanceByspaces(context);
    }
    return props;
  }
  function parseTag(context) {
    const start = getCursor(context);
    const match = /^<\/?([a-z][^ \t\r\n/>]*)/.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceByspaces(context);
    let props = parseAttributes(context);
    let isSelfCloseing = context.source.startsWith("/>");
    advanceBy(context, isSelfCloseing ? 2 : 1);
    return {
      type: 1 /* ELEMENT */,
      tag,
      isSelfCloseing,
      loc: getSelection(context, start),
      children: [],
      props
    };
  }
  function parseelement(context) {
    let ele = parseTag(context);
    let children = parseChildren(context);
    if (context.source.startsWith("</")) {
      parseTag(context);
    }
    ele.loc = getSelection(context, ele.loc.start);
    ele.children = children;
    return ele;
  }
  function parseChildren(context) {
    const nodes = [];
    while (!isEnd(context)) {
      const { source } = context;
      let node;
      if (source.startsWith("{{")) {
        node = parseInterpolation(context);
      } else if (source[0] === "<") {
        node = parseelement(context);
      }
      if (!node) {
        node = parseText(context);
        console.log(node);
      }
      nodes.push(node);
    }
    nodes.forEach((node, i) => {
      if (node.type === 2 /* TEXT */) {
        if (!/[^t\r\n\f ] /.test(node.content)) {
          nodes[i] = null;
        }
        ;
      }
    });
    return nodes.filter(Boolean);
  }
  function parse(template) {
    const context = createParserContext(template);
    const start = getCursor(context);
    let root = createRoot(parseChildren(context), getSelection(context, start));
    return root;
  }
  function createRoot(nodes, loc) {
    return {
      type: 0 /* ROOT */,
      children: nodes,
      loc
    };
  }

  // packages/compiler-core/src/transforms/transformElement.ts
  function transformElment(node, context) {
    if (1 /* ELEMENT */ === node.type) {
      return () => {
        let vnodeTag = `"${node.tag}"`;
        let preperties = [];
        let props = node.props;
        for (let i = 0; i < props.length; i++) {
          preperties.push({
            key: props[i].name,
            value: props[i].value.content
          });
        }
        const propsExpression = preperties.length > 0 ? createObjectExpression(preperties) : null;
        let childrenNode = null;
        if (node.children.length === 1) {
          const childrenNode2 = node.children[0];
        } else if (node.children.length > 1) {
          childrenNode = node.children;
        }
        node.codegenNode = createVnodeCall(context, vnodeTag, propsExpression, childrenNode);
      };
    }
  }

  // packages/compiler-core/src/transforms/transformExpression.ts
  function transformExpression(node, contexts) {
    if (node.type === 5 /* INTERPOLATION */) {
      let content = node.content.content;
      node.content.content = `_ctx.${content}`;
    }
  }

  // packages/shared/src/index.ts
  var isArray = Array.isArray;

  // packages/compiler-core/src/transforms/transformText.ts
  function isText(node) {
    return node.type === 5 /* INTERPOLATION */ || node.type === 2 /* TEXT */;
  }
  function transformTxet(node, context) {
    if (node.type === 1 /* ELEMENT */ || node.type === 0 /* ROOT */) {
      return () => {
        console.log("children", node.children);
        let currentContainer = null;
        let children = node.children;
        let hasText = false;
        for (let i = 0; i < children.length; i++) {
          let child = children[i];
          hasText = true;
          if (isText(child)) {
            for (let j = i + 1; j < children.length; j++) {
              let next = children[j];
              if (isText(next)) {
                if (!currentContainer) {
                  currentContainer = children[i] = {
                    type: 8 /* COMPOUND_EXPRESSION */,
                    children: [child]
                  };
                }
                currentContainer.children.push("+", next);
                children.splice(j, 1);
              } else {
                currentContainer = null;
                break;
              }
            }
          }
        }
        if (!hasText || children.length === 1) {
          return;
        }
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const callArgs = [];
          if (isText(child) || child.type == 8 /* COMPOUND_EXPRESSION */) {
            callArgs.push(child);
            if (node.type !== 2 /* TEXT */) {
              callArgs.push(1 /* TEXT */);
            }
            children[i] = {
              type: 12 /* TEXT_CALL */,
              content: child,
              condegenNode: createCallExpression(context, "")
            };
          }
        }
      };
    }
  }

  // packages/compiler-core/src/transform.ts
  function createTransformContext(root) {
    const context = {
      currentNode: root,
      parent: null,
      helpers: /* @__PURE__ */ new Map(),
      helper(name) {
        const count = context.helpers.get(name) || 0;
        context.helpers.set(name, count + 1);
        return name;
      },
      removeHelper(name) {
        const count = context.helpers.get(name);
        if (count) {
          const currentCount = count - 1;
          if (!currentCount) {
            context.helpers.delete(name);
          } else {
            context.helpers.set(name, currentCount);
          }
        }
      },
      nodeTransforms: [
        transformElment,
        transformTxet,
        transformExpression
      ]
    };
    return context;
  }
  function traverse(node, context) {
    context.currentNode = node;
    const transforms = context.nodeTransforms;
    const exitsFns = [];
    for (let i2 = 0; i2 < transforms.length; i2++) {
      let onExit = transforms[i2](node, context);
      if (onExit) {
        exitsFns.push(onExit);
      }
      if (!context.currentNode)
        return;
    }
    switch (node.type) {
      case 5 /* INTERPOLATION */:
        context.helper(TO_DISPLAY_STRING);
      case 1 /* ELEMENT */:
      case 0 /* ROOT */:
        for (let i2 = 0; i2 < node.children.length; i2++) {
          context.parent = node;
          traverse(node.children[i2], context);
        }
    }
    context.currentNode = node;
    let i = exitsFns.length;
    while (i--) {
      exitsFns[i]();
    }
  }
  function createRootCodegen(ast, context) {
    let { children } = ast;
    if (children.length === 1) {
      const child = children[0];
      if (child.type === 1 /* ELEMENT */ && child.codegenNode) {
        ast.codegenNode = child.codegenNode;
        context.removeHelper(CREATE_ELEMENT_VNODE);
        context.helper(OPEN_BLOCK);
        context.helper(CREATE_ELEMENT_BLOCK);
        ast.codegenNode.isBlock = true;
      } else {
        ast.codegenNode = child;
      }
    } else {
      if (children.length === 0)
        return;
      ast.codegenNode = createVnodeCall(context, context.helper(FRAGMENT), null, children);
      context.helper(OPEN_BLOCK);
      context.helper(CREATE_ELEMENT_BLOCK);
      ast.codegenNode.isBlock = true;
    }
  }
  function transform(ast) {
    const context = createTransformContext(ast);
    traverse(ast, context);
    createRootCodegen(ast, context);
    ast.helpers = [...context.helpers.keys()];
    console.log(ast.helpers);
  }

  // packages/compiler-core/src/index.ts
  function compile(template) {
    const ast = parse(template);
    console.log(ast);
    transform(ast);
    return generate(ast);
  }
  return __toCommonJS(src_exports);
})();
//# sourceMappingURL=compiler-core.global.js.map

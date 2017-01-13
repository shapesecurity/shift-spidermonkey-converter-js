"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                   * Copyright 2014 Shape Security, Inc.
                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                   * Licensed under the Apache License, Version 2.0 (the "License")
                                                                                                                                                                                                                                                   * you may not use this file except in compliance with the License.
                                                                                                                                                                                                                                                   * You may obtain a copy of the License at
                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                   *     http://www.apache.org/licenses/LICENSE-2.0
                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                   * Unless required by applicable law or agreed to in writing, software
                                                                                                                                                                                                                                                   * distributed under the License is distributed on an "AS IS" BASIS,
                                                                                                                                                                                                                                                   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                                                                                                                                                                                                                                                   * See the License for the specific language governing permissions and
                                                                                                                                                                                                                                                   * limitations under the License.
                                                                                                                                                                                                                                                   */

exports.default = convert;

var _shiftAst = require("shift-ast");

var Shift = _interopRequireWildcard(_shiftAst);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// convert Babylon AST format to Shift AST format

function convert(node) {
  if (node == null) {
    return null;
  }

  if (!Convert[node.type]) throw Error("Unrecognized type: " + node.type);

  return Convert[node.type](node);
}

function toBinding(node) {
  if (node == null) return null;
  switch (node.type) {
    case "Identifier":
      return new Shift.BindingIdentifier({ name: node.name });
    case "ObjectProperty":
      if (node.shorthand) {
        return new Shift.BindingPropertyIdentifier({
          binding: toBinding(node.key),
          init: toExpression(node.value.right)
        });
      } else {
        return new Shift.BindingPropertyProperty({
          name: toPropertyName(node.key, node.computed),
          binding: toBinding(node.value)
        });
      }
    default:
      return convert(node);
  }
}

function convertAssignmentExpression(node) {
  var binding = toBinding(node.left),
      expression = toExpression(node.right),
      operator = node.operator;
  if (operator === "=") return new Shift.AssignmentExpression({ binding: binding, expression: expression });else return new Shift.CompoundAssignmentExpression({ binding: binding, expression: expression, operator: operator });
}

function convertArrayExpression(node) {
  return new Shift.ArrayExpression({ elements: node.elements.map(convert) });
}

function convertBinaryExpression(node) {
  return new Shift.BinaryExpression({
    operator: node.operator,
    left: convert(node.left),
    right: convert(node.right)
  });
}

function convertBlock(node) {
  return new Shift.Block({ statements: node.body.map(convert) });
}

function convertBlockStatement(node) {
  return new Shift.BlockStatement({ block: convertBlock(node) });
}

function convertBreakStatement(node) {
  return new Shift.BreakStatement({ label: node.label ? node.label.name : null });
}

function toExpression(node) {
  if (node == null) return null;
  switch (node.type) {
    case "Literal":
      return convertLiteral(node);
    case "Identifier":
      return new Shift.IdentifierExpression({ name: node.name });
    case "MetaProperty":
      return new Shift.NewTargetExpression();
    case "TemplateLiteral":
      return convertTemplateLiteral(node);
    case "ObjectMethod":
      return convertObjectMethod(node);
    default:
      return convert(node);
  }
}

function toArgument(node) {
  if (node.type === "SpreadElement") {
    return convertSpreadElement(node);
  }
  return toExpression(node);
}

function convertCallExpression(node) {
  var callee = node.callee.type === "Super" ? convertSuper(node.callee) : toExpression(node.callee);
  return new Shift.CallExpression({ callee: callee, arguments: node.arguments.map(toArgument) });
}

function convertCatchClause(node) {
  return new Shift.CatchClause({
    binding: toBinding(node.param),
    body: convertBlock(node.body)
  });
}

function convertConditionalExpression(node) {
  return new Shift.ConditionalExpression({
    test: toExpression(node.test),
    consequent: toExpression(node.consequent),
    alternate: toExpression(node.alternate)
  });
}

function convertContinueStatement(node) {
  return new Shift.ContinueStatement({ label: node.label ? node.label.name : null });
}

function convertDebuggerStatement() {
  return new Shift.DebuggerStatement();
}

function convertDoWhileStatement(node) {
  return new Shift.DoWhileStatement({
    body: convert(node.body),
    test: convert(node.test)
  });
}

function convertEmptyStatement() {
  return new Shift.EmptyStatement();
}

function convertExpressionStatement(node) {
  return new Shift.ExpressionStatement({ expression: toExpression(node.expression) });
}

function convertForStatement(node) {
  var init = node.init != null && node.init.type === "VariableDeclaration" ? convertVariableDeclaration(node.init, true) : toExpression(node.init);
  return new Shift.ForStatement({
    init: init,
    test: toExpression(node.test),
    update: toExpression(node.update),
    body: convert(node.body)
  });
}

function convertForInStatement(node) {
  var left = node.left.type === "VariableDeclaration" ? convertVariableDeclaration(node.left, true) : toBinding(node.left);
  return new Shift.ForInStatement({
    left: left,
    right: toExpression(node.right),
    body: convert(node.body)
  });
}

function convertForOfStatement(node) {
  var left = node.left.type === "VariableDeclaration" ? convertVariableDeclaration(node.left, true) : toBinding(node.left);
  return new Shift.ForOfStatement({
    left: left,
    right: toExpression(node.right),
    body: convert(node.body)
  });
}

function toFunctionBody(node) {
  return new Shift.FunctionBody({
    directives: node.directives.map(convertDirective),
    statements: node.body.map(convert)
  });
}

function convertFunctionDeclaration(node) {
  return new Shift.FunctionDeclaration({
    isGenerator: node.generator,
    name: toBinding(node.id),
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: toFunctionBody(node.body)
  });
}

function convertFunctionExpression(node) {
  return new Shift.FunctionExpression({
    isGenerator: node.generator,
    name: toBinding(node.id),
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: toFunctionBody(node.body)
  });
}

function convertIfStatement(node) {
  return new Shift.IfStatement({
    test: toExpression(node.test),
    consequent: convert(node.consequent),
    alternate: convert(node.alternate)
  });
}

function convertLabeledStatement(node) {
  return new Shift.LabeledStatement({
    label: node.label.name,
    body: convert(node.body)
  });
}

function convertLiteral(node) {
  switch (_typeof(node.value)) {
    case "number":
      if (node.value === 1 / 0) {
        return new Shift.LiteralInfinityExpression();
      }
      return new Shift.LiteralNumericExpression(node);
    case "string":
      return new Shift.LiteralStringExpression(node);
    case "boolean":
      return new Shift.LiteralBooleanExpression(node);
    default:
      if (node.value === null) return new Shift.LiteralNullExpression();else return new Shift.LiteralRegExpExpression(node.regex);
  }
}

function convertBooleanLiteral(node) {
  return new Shift.LiteralBooleanExpression(node);
}

function convertNumericLiteral(node) {
  return new Shift.LiteralNumericExpression(node);
}

function convertStringLiteral(node) {
  return new Shift.LiteralStringExpression(node);
}

function convertRegExpLiteral(node) {
  return new Shift.LiteralRegExpExpression(node);
}

function convertNullLiteral(node) {
  return new Shift.LiteralNullExpression();
}

function convertMemberExpression(node) {
  var obj = node.object.type === "Super" ? convertSuper(node.object) : toExpression(node.object);

  if (node.computed) {
    return new Shift.ComputedMemberExpression({
      object: obj,
      expression: toExpression(node.property)
    });
  } else {
    return new Shift.StaticMemberExpression({
      object: obj,
      property: node.property.name
    });
  }
}

function convertNewExpression(node) {
  return new Shift.NewExpression({
    callee: toArgument(node.callee),
    arguments: node.arguments.map(toArgument)
  });
}

function convertObjectExpression(node) {
  return new Shift.ObjectExpression({ properties: node.properties.map(toExpression) });
}

function convertDirective(node) {
  return new Shift.Directive({ rawValue: node.value.value });
}

function convertProgram(node) {
  var directives = node.directives ? node.directives.map(convertDirective) : [],
      statements = node.body.map(convert);

  if (node.sourceType === "module") {
    return new Shift.Module({ directives: directives, items: statements });
  }
  return new Shift.Script({ directives: directives, statements: statements });
}

function toPropertyName(node, computed) {
  if (computed) {
    return new Shift.ComputedPropertyName({ expression: toExpression(node) });
  } else {
    return new Shift.StaticPropertyName({
      value: node.type === "Identifier" ? node.name : node.value.toString()
    });
  }
}

function convertObjectProperty(node) {
  var name = toPropertyName(node.key, node.computed);
  if (node.shorthand) {
    return new Shift.ShorthandProperty({ name: node.key.name });
  }
  return new Shift.DataProperty({ name: name, expression: toExpression(node.value) });
}

function toMethod(node) {
  return new Shift.Method({
    isGenerator: node.generator,
    name: toPropertyName(node.key, node.computed),
    body: toFunctionBody(node.body),
    params: new Shift.FormalParameters(convertFunctionParams(node))
  });
}

function toGetter(node) {
  return new Shift.Getter({
    name: toPropertyName(node.key, node.computed),
    body: toFunctionBody(node.body)
  });
}

function toSetter(node) {
  var params = convertFunctionParams(node);
  return new Shift.Setter({
    name: toPropertyName(node.key, node.computed),
    body: toFunctionBody(node.body),
    param: params.items[0] || params.rest
  });
}

function convertObjectMethod(node) {
  switch (node.kind) {
    case "method":
      return toMethod(node);
    case "get":
      return toGetter(node);
    case "set":
      return toSetter(node);
    default:
      throw Error("Unknown kind of method: " + node.kind);
  }
}

function convertReturnStatement(node) {
  return new Shift.ReturnStatement({ expression: toExpression(node.argument) });
}

function convertSequenceExpression(node) {
  var expr = toExpression(node.expressions[0]);
  for (var i = 1; i < node.expressions.length; i++) {
    expr = new Shift.BinaryExpression({
      operator: ",",
      left: expr,
      right: toExpression(node.expressions[i])
    });
  }
  return expr;
}

function convertSwitchCase(node) {
  if (node.test) {
    return new Shift.SwitchCase({
      test: convert(node.test),
      consequent: node.consequent.map(convert)
    });
  }
  return new Shift.SwitchDefault({ consequent: node.consequent.map(convert) });
}

function convertSwitchStatement(node) {
  if (!node.cases.every(function (c) {
    return c.test != null;
  })) {
    var scs = node.cases.map(convertSwitchCase);
    for (var i = 0; i < scs.length; i++) {
      if (scs[i].type === "SwitchDefault") {
        break;
      }
    }
    return new Shift.SwitchStatementWithDefault({
      discriminant: toExpression(node.discriminant),
      preDefaultCases: scs.slice(0, i),
      defaultCase: scs[i],
      postDefaultCases: scs.slice(i + 1)
    });
  } else {
    return new Shift.SwitchStatement({
      discriminant: toExpression(node.discriminant),
      cases: node.cases.map(convertSwitchCase)
    });
  }
}

function convertThisExpression() {
  return new Shift.ThisExpression();
}

function convertThrowStatement(node) {
  return new Shift.ThrowStatement({ expression: toExpression(node.argument) });
}

function convertTryStatement(node) {
  if (node.finalizer != null) {
    return new Shift.TryFinallyStatement({
      body: convertBlock(node.block),
      catchClause: convertCatchClause(node.handler),
      finalizer: convertBlock(node.finalizer)
    });
  } else {
    return new Shift.TryCatchStatement({
      body: convertBlock(node.block),
      catchClause: convertCatchClause(node.handler),
      handlers: [convert(node.handler)]
    });
  }
}

function convertUpdateExpression(node) {
  return new Shift.UpdateExpression({
    isPrefix: node.prefix,
    operator: node.operator,
    operand: toBinding(node.argument)
  });
}

function convertUnaryExpression(node) {
  return new Shift.UnaryExpression({
    operator: node.operator,
    operand: toExpression(node.argument)
  });
}

function convertVariableDeclaration(node, isDeclaration) {
  var declaration = new Shift.VariableDeclaration({
    kind: node.kind,
    declarators: node.declarations.map(convertVariableDeclarator)
  });
  if (isDeclaration) return declaration;
  return new Shift.VariableDeclarationStatement({ declaration: declaration });
}

function convertVariableDeclarator(node) {
  return new Shift.VariableDeclarator({
    binding: toBinding(node.id),
    init: convert(node.init)
  });
}

function convertWhileStatement(node) {
  return new Shift.WhileStatement({ test: convert(node.test), body: convert(node.body) });
}

function convertWithStatement(node) {
  return new Shift.WithStatement({ object: convert(node.object), body: convert(node.body) });
}

function convertMetaProperty(node) {
  if (node.meta === "new" && node.property === "target") {
    return new Shift.NewTargetExpression();
  }
  return null;
}

function convertObjectPattern(node) {
  return new Shift.ObjectBinding({ properties: node.properties.map(toBinding) });
}

function convertAssignmentPattern(node) {
  return new Shift.BindingWithDefault({
    binding: toBinding(node.left),
    init: convert(node.right)
  });
}

function convertClassDeclaration(node) {
  return new Shift.ClassDeclaration({
    name: toBinding(node.id),
    super: toExpression(node.superClass),
    elements: convert(node.body)
  });
}

function convertClassExpression(node) {
  var _convertClassDeclarat = convertClassDeclaration(node);

  var name = _convertClassDeclarat.name;
  var spr = _convertClassDeclarat.super;
  var elements = _convertClassDeclarat.elements;

  return new Shift.ClassExpression({ name: name, super: spr, elements: elements });
}

function convertClassBody(node) {
  return node.body.map(convert);
}

function convertRestElement(node) {
  return toBinding(node.argument);
}

function convertElements(elts) {
  var count = elts.length;
  if (count === 0) {
    return [[], null];
  } else if (elts[count - 1].type === "RestElement") {
    return [elts.slice(0, count - 1).map(toBinding), toBinding(elts[count - 1])];
  } else {
    return [elts.map(toBinding), null];
  }
}

function convertArrayPattern(node) {
  var _convertElements = convertElements(node.elements);

  var _convertElements2 = _slicedToArray(_convertElements, 2);

  var elements = _convertElements2[0];
  var restElement = _convertElements2[1];

  return new Shift.ArrayBinding({ elements: elements, restElement: restElement });
}

function convertArrowFunctionExpression(node) {
  return new Shift.ArrowExpression({
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: node.expression ? convert(node.body) : toFunctionBody(node.body)
  });
}

function convertFunctionParams(node) {
  var _convertElements3 = convertElements(node.params);

  var _convertElements4 = _slicedToArray(_convertElements3, 2);

  var items = _convertElements4[0];
  var rest = _convertElements4[1];

  return { items: items, rest: rest };
}

function convertClassMethod(node) {
  return new Shift.ClassElement({ isStatic: node.static, method: toMethod(node) });
}

function convertSuper(node) {
  return new Shift.Super();
}

function convertTaggedTemplateExpression(node) {
  var elts = [];
  node.quasi.quasis.forEach(function (e, i) {
    elts.push(convertTemplateElement(e));
    if (i < node.quasi.expressions.length) elts.push(toExpression(node.quasi.expressions[i]));
  });
  return new Shift.TemplateExpression({
    tag: toExpression(node.tag),
    elements: elts
  });
}

function convertTemplateElement(node) {
  return new Shift.TemplateElement({ rawValue: node.value.raw });
}

function convertTemplateLiteral(node, tag) {
  var elts = [];
  node.quasis.forEach(function (e, i) {
    elts.push(convertTemplateElement(e));
    if (i < node.expressions.length) elts.push(toExpression(node.expressions[i]));
  });
  return new Shift.TemplateExpression({
    tag: tag != null ? convert(tag) : null,
    elements: elts
  });
}

function convertYieldExpression(node) {
  if (node.delegate) return new Shift.YieldGeneratorExpression({ expression: toExpression(node.argument) });
  return new Shift.YieldExpression({ expression: toExpression(node.argument) });
}

function convertExportAllDeclaration(node) {
  return new Shift.ExportAllFrom({ moduleSpecifier: node.source.value });
}

function convertExportNamedDeclaration(node) {
  if (node.declaration != null) {
    return new Shift.Export({
      kind: node.kind,
      declaration: node.declaration.type === "VariableDeclaration" ? convertVariableDeclaration(node.declaration, true) : convert(node.declaration)
    });
  }

  return new Shift.ExportFrom({
    moduleSpecifier: node.source != null ? node.source.value : null,
    namedExports: node.specifiers.map(convert)
  });
}

function convertExportSpecifier(node) {
  return new Shift.ExportSpecifier({
    exportedName: node.exported.name,
    name: node.local.name !== node.exported.name ? node.local.name : null
  });
}

function convertExportDefaultDeclaration(node) {
  return new Shift.ExportDefault({ body: convert(node.declaration) });
}

function convertImportDeclaration(node) {
  var hasDefaultSpecifier = node.specifiers.some(function (s) {
    return s.type === "ImportDefaultSpecifier";
  }),
      hasNamespaceSpecifier = node.specifiers.some(function (s) {
    return s.type === "ImportNamespaceSpecifier";
  }),
      defaultBinding = hasDefaultSpecifier ? toBinding(node.specifiers[0]) : null;

  if (hasNamespaceSpecifier) {
    return new Shift.ImportNamespace({
      moduleSpecifier: node.source.value,
      namespaceBinding: toBinding(node.specifiers[1]),
      defaultBinding: defaultBinding
    });
  }

  var namedImports = node.specifiers.map(convert);
  if (hasDefaultSpecifier) namedImports.shift();
  return new Shift.Import({
    moduleSpecifier: node.source.value,
    namedImports: namedImports,
    defaultBinding: defaultBinding
  });
}

function convertImportDefaultSpecifier(node) {
  return toBinding(node.local);
}

function convertImportNamespaceSpecifier(node) {
  return toBinding(node.local);
}

function convertImportSpecifier(node) {
  return new Shift.ImportSpecifier({
    name: node.imported.name === node.local.name ? null : node.imported.name,
    binding: toBinding(node.local)
  });
}

function convertSpreadElement(node) {
  return new Shift.SpreadElement({ expression: toExpression(node.argument) });
}

function convertFile(node) {
  return convert(node.program);
}

var Convert = {
  AssignmentExpression: convertAssignmentExpression,
  AssignmentPattern: convertAssignmentPattern,
  ArrayExpression: convertArrayExpression,
  ArrayPattern: convertArrayPattern,
  ArrowFunctionExpression: convertArrowFunctionExpression,
  BlockStatement: convertBlockStatement,
  BinaryExpression: convertBinaryExpression,
  BreakStatement: convertBreakStatement,
  CallExpression: convertCallExpression,
  CatchClause: convertCatchClause,
  ClassDeclaration: convertClassDeclaration,
  ClassExpression: convertClassExpression,
  ClassBody: convertClassBody,
  ClassMethod: convertClassMethod,
  ConditionalExpression: convertConditionalExpression,
  ContinueStatement: convertContinueStatement,
  DoWhileStatement: convertDoWhileStatement,
  DebuggerStatement: convertDebuggerStatement,
  EmptyStatement: convertEmptyStatement,
  ExportAllDeclaration: convertExportAllDeclaration,
  ExportDefaultDeclaration: convertExportDefaultDeclaration,
  ExportNamedDeclaration: convertExportNamedDeclaration,
  ExportSpecifier: convertExportSpecifier,
  ExpressionStatement: convertExpressionStatement,
  File: convertFile,
  ForStatement: convertForStatement,
  ForOfStatement: convertForOfStatement,
  ForInStatement: convertForInStatement,
  FunctionDeclaration: convertFunctionDeclaration,
  FunctionExpression: convertFunctionExpression,
  IfStatement: convertIfStatement,
  ImportDeclaration: convertImportDeclaration,
  ImportDefaultSpecifier: convertImportDefaultSpecifier,
  ImportNamespaceSpecifier: convertImportNamespaceSpecifier,
  ImportSpecifier: convertImportSpecifier,
  Literal: convertLiteral,
  BooleanLiteral: convertBooleanLiteral,
  NumericLiteral: convertNumericLiteral,
  StringLiteral: convertStringLiteral,
  RegExpLiteral: convertRegExpLiteral,
  NullLiteral: convertNullLiteral,
  LabeledStatement: convertLabeledStatement,
  LogicalExpression: convertBinaryExpression,
  MemberExpression: convertMemberExpression,
  MetaProperty: convertMetaProperty,
  NewExpression: convertNewExpression,
  ObjectExpression: convertObjectExpression,
  ObjectPattern: convertObjectPattern,
  ObjectProperty: convertObjectProperty,
  Program: convertProgram,
  RestElement: convertRestElement,
  ReturnStatement: convertReturnStatement,
  SequenceExpression: convertSequenceExpression,
  SpreadElement: convertSpreadElement,
  Super: convertSuper,
  SwitchCase: convertSwitchCase,
  SwitchStatement: convertSwitchStatement,
  TaggedTemplateExpression: convertTaggedTemplateExpression,
  TemplateElement: convertTemplateElement,
  TemplateLiteral: convertTemplateLiteral,
  ThisExpression: convertThisExpression,
  ThrowStatement: convertThrowStatement,
  TryStatement: convertTryStatement,
  UnaryExpression: convertUnaryExpression,
  UpdateExpression: convertUpdateExpression,
  VariableDeclaration: convertVariableDeclaration,
  VariableDeclarator: convertVariableDeclarator,
  WhileStatement: convertWhileStatement,
  WithStatement: convertWithStatement,
  YieldExpression: convertYieldExpression
};
//# sourceMappingURL=data:application/json;base64,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QUFvQix5QkFyRE47QUFzRGQsaUJBQWUsb0JBdEREO0FBdURkLFNBQU8sWUF2RE87QUF3RGQsY0FBWSxpQkF4REU7QUF5RGQsbUJBQWlCLHNCQXpESDtBQTBEZCw0QkFBMEIsK0JBMURaO0FBMkRkLG1CQUFpQixzQkEzREg7QUE0RGQsbUJBQWlCLHNCQTVESDtBQTZEZCxrQkFBZ0IscUJBN0RGO0FBOERkLGtCQUFnQixxQkE5REY7QUErRGQsZ0JBQWMsbUJBL0RBO0FBZ0VkLG1CQUFpQixzQkFoRUg7QUFpRWQsb0JBQWtCLHVCQWpFSjtBQWtFZCx1QkFBcUIsMEJBbEVQO0FBbUVkLHNCQUFvQix5QkFuRU47QUFvRWQsa0JBQWdCLHFCQXBFRjtBQXFFZCxpQkFBZSxvQkFyRUQ7QUFzRWQsbUJBQWlCO0FBdEVILENBQWhCIiwiZmlsZSI6InRvLXNoaWZ0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIFNoaWZ0IGZyb20gXCJzaGlmdC1hc3RcIjtcblxuLy8gY29udmVydCBCYWJ5bG9uIEFTVCBmb3JtYXQgdG8gU2hpZnQgQVNUIGZvcm1hdFxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0KG5vZGUpIHtcbiAgaWYgKG5vZGUgPT0gbnVsbCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYoIUNvbnZlcnRbbm9kZS50eXBlXSkgdGhyb3cgRXJyb3IoYFVucmVjb2duaXplZCB0eXBlOiAke25vZGUudHlwZX1gKTtcblxuICByZXR1cm4gQ29udmVydFtub2RlLnR5cGVdKG5vZGUpO1xufVxuXG5mdW5jdGlvbiB0b0JpbmRpbmcobm9kZSkge1xuICBpZihub2RlID09IG51bGwpIHJldHVybiBudWxsO1xuICBzd2l0Y2gobm9kZS50eXBlKSB7XG4gICAgY2FzZSBcIklkZW50aWZpZXJcIjogcmV0dXJuIG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcih7IG5hbWU6IG5vZGUubmFtZSB9KTtcbiAgICBjYXNlIFwiT2JqZWN0UHJvcGVydHlcIjogaWYobm9kZS5zaG9ydGhhbmQpIHtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcih7XG4gICAgICAgIGJpbmRpbmc6IHRvQmluZGluZyhub2RlLmtleSksXG4gICAgICAgIGluaXQ6IHRvRXhwcmVzc2lvbihub2RlLnZhbHVlLnJpZ2h0KVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5UHJvcGVydHkoe1xuICAgICAgICBuYW1lOiB0b1Byb3BlcnR5TmFtZShub2RlLmtleSwgbm9kZS5jb21wdXRlZCksXG4gICAgICAgIGJpbmRpbmc6IHRvQmluZGluZyhub2RlLnZhbHVlKVxuICAgICAgfSk7XG4gICAgfVxuICAgIGRlZmF1bHQ6IHJldHVybiBjb252ZXJ0KG5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRBc3NpZ25tZW50RXhwcmVzc2lvbihub2RlKSB7XG4gIGxldCBiaW5kaW5nID0gdG9CaW5kaW5nKG5vZGUubGVmdCksXG4gICAgICBleHByZXNzaW9uID0gdG9FeHByZXNzaW9uKG5vZGUucmlnaHQpLFxuICAgICAgb3BlcmF0b3IgPSBub2RlLm9wZXJhdG9yO1xuICBpZihvcGVyYXRvciA9PT0gXCI9XCIpIHJldHVybiBuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24oeyBiaW5kaW5nLCBleHByZXNzaW9uIH0pO1xuICBlbHNlIHJldHVybiBuZXcgU2hpZnQuQ29tcG91bmRBc3NpZ25tZW50RXhwcmVzc2lvbih7IGJpbmRpbmcsIGV4cHJlc3Npb24sIG9wZXJhdG9yIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QXJyYXlFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5BcnJheUV4cHJlc3Npb24oeyBlbGVtZW50czogbm9kZS5lbGVtZW50cy5tYXAoY29udmVydCkgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCaW5hcnlFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKHtcbiAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcbiAgICBsZWZ0OiBjb252ZXJ0KG5vZGUubGVmdCksXG4gICAgcmlnaHQ6IGNvbnZlcnQobm9kZS5yaWdodClcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCbG9jayhub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQmxvY2soeyBzdGF0ZW1lbnRzOiBub2RlLmJvZHkubWFwKGNvbnZlcnQpIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QmxvY2tTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkJsb2NrU3RhdGVtZW50KHsgYmxvY2s6IGNvbnZlcnRCbG9jayhub2RlKSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJyZWFrU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudCh7IGxhYmVsOiBub2RlLmxhYmVsID8gbm9kZS5sYWJlbC5uYW1lIDogbnVsbCB9KTtcbn1cblxuZnVuY3Rpb24gdG9FeHByZXNzaW9uKG5vZGUpIHtcbiAgaWYobm9kZSA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgc3dpdGNoKG5vZGUudHlwZSkge1xuICAgIGNhc2UgXCJMaXRlcmFsXCI6IHJldHVybiBjb252ZXJ0TGl0ZXJhbChub2RlKTtcbiAgICBjYXNlIFwiSWRlbnRpZmllclwiOiByZXR1cm4gbmV3IFNoaWZ0LklkZW50aWZpZXJFeHByZXNzaW9uKHsgbmFtZTogbm9kZS5uYW1lIH0pO1xuICAgIGNhc2UgXCJNZXRhUHJvcGVydHlcIjogcmV0dXJuIG5ldyBTaGlmdC5OZXdUYXJnZXRFeHByZXNzaW9uKCk7XG4gICAgY2FzZSBcIlRlbXBsYXRlTGl0ZXJhbFwiOiByZXR1cm4gY29udmVydFRlbXBsYXRlTGl0ZXJhbChub2RlKTtcbiAgICBjYXNlIFwiT2JqZWN0TWV0aG9kXCI6IHJldHVybiBjb252ZXJ0T2JqZWN0TWV0aG9kKG5vZGUpO1xuICAgIGRlZmF1bHQ6IHJldHVybiBjb252ZXJ0KG5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRvQXJndW1lbnQobm9kZSkge1xuICBpZihub2RlLnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiKSB7XG4gICAgcmV0dXJuIGNvbnZlcnRTcHJlYWRFbGVtZW50KG5vZGUpO1xuICB9XG4gIHJldHVybiB0b0V4cHJlc3Npb24obm9kZSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDYWxsRXhwcmVzc2lvbihub2RlKSB7XG4gIGxldCBjYWxsZWUgPSBub2RlLmNhbGxlZS50eXBlID09PSBcIlN1cGVyXCIgP1xuICAgICAgY29udmVydFN1cGVyKG5vZGUuY2FsbGVlKSA6XG4gICAgICB0b0V4cHJlc3Npb24obm9kZS5jYWxsZWUpO1xuICByZXR1cm4gbmV3IFNoaWZ0LkNhbGxFeHByZXNzaW9uKHsgY2FsbGVlLCBhcmd1bWVudHM6IG5vZGUuYXJndW1lbnRzLm1hcCh0b0FyZ3VtZW50KSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydENhdGNoQ2xhdXNlKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5DYXRjaENsYXVzZSh7XG4gICAgYmluZGluZzogdG9CaW5kaW5nKG5vZGUucGFyYW0pLFxuICAgIGJvZHk6IGNvbnZlcnRCbG9jayhub2RlLmJvZHkpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q29uZGl0aW9uYWxFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5Db25kaXRpb25hbEV4cHJlc3Npb24oe1xuICAgIHRlc3Q6IHRvRXhwcmVzc2lvbihub2RlLnRlc3QpLFxuICAgIGNvbnNlcXVlbnQ6IHRvRXhwcmVzc2lvbihub2RlLmNvbnNlcXVlbnQpLFxuICAgIGFsdGVybmF0ZTogdG9FeHByZXNzaW9uKG5vZGUuYWx0ZXJuYXRlKVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbnRpbnVlU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudCh7IGxhYmVsOiBub2RlLmxhYmVsID8gbm9kZS5sYWJlbC5uYW1lIDogbnVsbCB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydERlYnVnZ2VyU3RhdGVtZW50KCkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkRlYnVnZ2VyU3RhdGVtZW50KCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnREb1doaWxlU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5Eb1doaWxlU3RhdGVtZW50KHtcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSksXG4gICAgdGVzdDogY29udmVydChub2RlLnRlc3QpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RW1wdHlTdGF0ZW1lbnQoKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuRW1wdHlTdGF0ZW1lbnQoKTtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cHJlc3Npb25TdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkV4cHJlc3Npb25TdGF0ZW1lbnQoeyBleHByZXNzaW9uOiB0b0V4cHJlc3Npb24obm9kZS5leHByZXNzaW9uKSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZvclN0YXRlbWVudChub2RlKSB7XG4gIGxldCBpbml0ID0gKG5vZGUuaW5pdCAhPSBudWxsICYmIG5vZGUuaW5pdC50eXBlID09PSBcIlZhcmlhYmxlRGVjbGFyYXRpb25cIikgP1xuICAgICAgY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb24obm9kZS5pbml0LCB0cnVlKSA6XG4gICAgICB0b0V4cHJlc3Npb24obm9kZS5pbml0KTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoe1xuICAgIGluaXQsXG4gICAgdGVzdDogdG9FeHByZXNzaW9uKG5vZGUudGVzdCksXG4gICAgdXBkYXRlOiB0b0V4cHJlc3Npb24obm9kZS51cGRhdGUpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZvckluU3RhdGVtZW50KG5vZGUpIHtcbiAgbGV0IGxlZnQgPSBub2RlLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIgP1xuICAgICAgY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb24obm9kZS5sZWZ0LCB0cnVlKSA6XG4gICAgICB0b0JpbmRpbmcobm9kZS5sZWZ0KTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JJblN0YXRlbWVudCh7XG4gICAgbGVmdCxcbiAgICByaWdodDogdG9FeHByZXNzaW9uKG5vZGUucmlnaHQpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZvck9mU3RhdGVtZW50KG5vZGUpIHtcbiAgbGV0IGxlZnQgPSBub2RlLmxlZnQudHlwZSA9PT0gXCJWYXJpYWJsZURlY2xhcmF0aW9uXCIgP1xuICAgICAgY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb24obm9kZS5sZWZ0LCB0cnVlKSA6XG4gICAgICB0b0JpbmRpbmcobm9kZS5sZWZ0KTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JPZlN0YXRlbWVudCh7XG4gICAgbGVmdCxcbiAgICByaWdodDogdG9FeHByZXNzaW9uKG5vZGUucmlnaHQpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gdG9GdW5jdGlvbkJvZHkobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkZ1bmN0aW9uQm9keSh7XG4gICAgZGlyZWN0aXZlczogbm9kZS5kaXJlY3RpdmVzLm1hcChjb252ZXJ0RGlyZWN0aXZlKSxcbiAgICBzdGF0ZW1lbnRzOiBub2RlLmJvZHkubWFwKGNvbnZlcnQpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RnVuY3Rpb25EZWNsYXJhdGlvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuRnVuY3Rpb25EZWNsYXJhdGlvbih7XG4gICAgaXNHZW5lcmF0b3I6IG5vZGUuZ2VuZXJhdG9yLFxuICAgIG5hbWU6IHRvQmluZGluZyhub2RlLmlkKSxcbiAgICBwYXJhbXM6IG5ldyBTaGlmdC5Gb3JtYWxQYXJhbWV0ZXJzKGNvbnZlcnRGdW5jdGlvblBhcmFtcyhub2RlKSksXG4gICAgYm9keTogdG9GdW5jdGlvbkJvZHkobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuRnVuY3Rpb25FeHByZXNzaW9uKHtcbiAgICBpc0dlbmVyYXRvcjogbm9kZS5nZW5lcmF0b3IsXG4gICAgbmFtZTogdG9CaW5kaW5nKG5vZGUuaWQpLFxuICAgIHBhcmFtczogbmV3IFNoaWZ0LkZvcm1hbFBhcmFtZXRlcnMoY29udmVydEZ1bmN0aW9uUGFyYW1zKG5vZGUpKSxcbiAgICBib2R5OiB0b0Z1bmN0aW9uQm9keShub2RlLmJvZHkpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SWZTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LklmU3RhdGVtZW50KHtcbiAgICB0ZXN0OiB0b0V4cHJlc3Npb24obm9kZS50ZXN0KSxcbiAgICBjb25zZXF1ZW50OiBjb252ZXJ0KG5vZGUuY29uc2VxdWVudCksXG4gICAgYWx0ZXJuYXRlOiBjb252ZXJ0KG5vZGUuYWx0ZXJuYXRlKVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydExhYmVsZWRTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkxhYmVsZWRTdGF0ZW1lbnQoe1xuICAgIGxhYmVsOiBub2RlLmxhYmVsLm5hbWUsXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGl0ZXJhbChub2RlKSB7XG4gIHN3aXRjaCAodHlwZW9mIG5vZGUudmFsdWUpIHtcbiAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICBpZiAobm9kZS52YWx1ZSA9PT0gMSAvIDApIHtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5MaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvbihub2RlKTtcbiAgICBjYXNlIFwic3RyaW5nXCI6XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKG5vZGUpO1xuICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbihub2RlKTtcbiAgICBkZWZhdWx0OlxuICAgICAgaWYgKG5vZGUudmFsdWUgPT09IG51bGwpXG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuTGl0ZXJhbE51bGxFeHByZXNzaW9uKCk7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24obm9kZS5yZWdleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29udmVydEJvb2xlYW5MaXRlcmFsKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24obm9kZSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnROdW1lcmljTGl0ZXJhbChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3RyaW5nTGl0ZXJhbChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24obm9kZSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRSZWdFeHBMaXRlcmFsKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5MaXRlcmFsUmVnRXhwRXhwcmVzc2lvbihub2RlKTtcbn1cblxuZnVuY3Rpb24gY29udmVydE51bGxMaXRlcmFsKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5MaXRlcmFsTnVsbEV4cHJlc3Npb24oKTtcbn1cblxuZnVuY3Rpb24gY29udmVydE1lbWJlckV4cHJlc3Npb24obm9kZSkge1xuICBsZXQgb2JqID0gbm9kZS5vYmplY3QudHlwZSA9PT0gXCJTdXBlclwiID9cbiAgICAgIGNvbnZlcnRTdXBlcihub2RlLm9iamVjdCkgOlxuICAgICAgdG9FeHByZXNzaW9uKG5vZGUub2JqZWN0KTtcblxuICBpZiAobm9kZS5jb21wdXRlZCkge1xuICAgIHJldHVybiBuZXcgU2hpZnQuQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKHtcbiAgICAgIG9iamVjdDogb2JqLFxuICAgICAgZXhwcmVzc2lvbjogdG9FeHByZXNzaW9uKG5vZGUucHJvcGVydHkpXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKHtcbiAgICAgIG9iamVjdDogb2JqLFxuICAgICAgcHJvcGVydHk6IG5vZGUucHJvcGVydHkubmFtZVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnROZXdFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5OZXdFeHByZXNzaW9uKHtcbiAgICBjYWxsZWU6IHRvQXJndW1lbnQobm9kZS5jYWxsZWUpLFxuICAgIGFyZ3VtZW50czogbm9kZS5hcmd1bWVudHMubWFwKHRvQXJndW1lbnQpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0T2JqZWN0RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuT2JqZWN0RXhwcmVzc2lvbih7IHByb3BlcnRpZXM6IG5vZGUucHJvcGVydGllcy5tYXAodG9FeHByZXNzaW9uKSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydERpcmVjdGl2ZShub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuRGlyZWN0aXZlKHtyYXdWYWx1ZTogbm9kZS52YWx1ZS52YWx1ZX0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0UHJvZ3JhbShub2RlKSB7XG4gIGxldCBkaXJlY3RpdmVzID0gbm9kZS5kaXJlY3RpdmVzID8gbm9kZS5kaXJlY3RpdmVzLm1hcChjb252ZXJ0RGlyZWN0aXZlKSA6IFtdLFxuICAgICAgc3RhdGVtZW50cyA9IG5vZGUuYm9keS5tYXAoY29udmVydCk7XG5cbiAgaWYobm9kZS5zb3VyY2VUeXBlID09PSBcIm1vZHVsZVwiKSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Nb2R1bGUoeyBkaXJlY3RpdmVzLCBpdGVtczogc3RhdGVtZW50cyB9KTtcbiAgfVxuICByZXR1cm4gbmV3IFNoaWZ0LlNjcmlwdCh7IGRpcmVjdGl2ZXMsIHN0YXRlbWVudHMgfSk7XG59XG5cbmZ1bmN0aW9uIHRvUHJvcGVydHlOYW1lKG5vZGUsIGNvbXB1dGVkKSB7XG4gIGlmKGNvbXB1dGVkKSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Db21wdXRlZFByb3BlcnR5TmFtZSh7IGV4cHJlc3Npb246IHRvRXhwcmVzc2lvbihub2RlKX0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHtcbiAgICAgIHZhbHVlOiAobm9kZS50eXBlID09PSBcIklkZW50aWZpZXJcIikgPyBub2RlLm5hbWUgOiBub2RlLnZhbHVlLnRvU3RyaW5nKClcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0T2JqZWN0UHJvcGVydHkobm9kZSkge1xuICBsZXQgbmFtZSA9IHRvUHJvcGVydHlOYW1lKG5vZGUua2V5LCBub2RlLmNvbXB1dGVkKTtcbiAgaWYobm9kZS5zaG9ydGhhbmQpIHtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlNob3J0aGFuZFByb3BlcnR5KHsgbmFtZTogbm9kZS5rZXkubmFtZSB9KTtcbiAgfVxuICByZXR1cm4gbmV3IFNoaWZ0LkRhdGFQcm9wZXJ0eSh7IG5hbWUsIGV4cHJlc3Npb246IHRvRXhwcmVzc2lvbihub2RlLnZhbHVlKX0pO1xufVxuXG5mdW5jdGlvbiB0b01ldGhvZChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuTWV0aG9kKHtcbiAgICBpc0dlbmVyYXRvcjogbm9kZS5nZW5lcmF0b3IsXG4gICAgbmFtZTogdG9Qcm9wZXJ0eU5hbWUobm9kZS5rZXksIG5vZGUuY29tcHV0ZWQpLFxuICAgIGJvZHk6IHRvRnVuY3Rpb25Cb2R5KG5vZGUuYm9keSksXG4gICAgcGFyYW1zOiBuZXcgU2hpZnQuRm9ybWFsUGFyYW1ldGVycyhjb252ZXJ0RnVuY3Rpb25QYXJhbXMobm9kZSkpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiB0b0dldHRlcihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuR2V0dGVyKHtcbiAgICBuYW1lOiB0b1Byb3BlcnR5TmFtZShub2RlLmtleSwgbm9kZS5jb21wdXRlZCksXG4gICAgYm9keTogdG9GdW5jdGlvbkJvZHkobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gdG9TZXR0ZXIobm9kZSkge1xuICBsZXQgcGFyYW1zID0gY29udmVydEZ1bmN0aW9uUGFyYW1zKG5vZGUpO1xuICByZXR1cm4gbmV3IFNoaWZ0LlNldHRlcih7XG4gICAgbmFtZTogdG9Qcm9wZXJ0eU5hbWUobm9kZS5rZXksIG5vZGUuY29tcHV0ZWQpLFxuICAgIGJvZHk6IHRvRnVuY3Rpb25Cb2R5KG5vZGUuYm9keSksXG4gICAgcGFyYW06IHBhcmFtcy5pdGVtc1swXSB8fCBwYXJhbXMucmVzdFxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydE9iamVjdE1ldGhvZChub2RlKSB7XG4gIHN3aXRjaCAobm9kZS5raW5kKSB7XG4gICAgY2FzZSBcIm1ldGhvZFwiOiByZXR1cm4gdG9NZXRob2Qobm9kZSk7XG4gICAgY2FzZSBcImdldFwiOiByZXR1cm4gdG9HZXR0ZXIobm9kZSk7XG4gICAgY2FzZSBcInNldFwiOiByZXR1cm4gdG9TZXR0ZXIobm9kZSk7XG4gICAgZGVmYXVsdDogdGhyb3cgRXJyb3IoYFVua25vd24ga2luZCBvZiBtZXRob2Q6ICR7bm9kZS5raW5kfWApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRSZXR1cm5TdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LlJldHVyblN0YXRlbWVudCh7IGV4cHJlc3Npb246IHRvRXhwcmVzc2lvbihub2RlLmFyZ3VtZW50KSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFNlcXVlbmNlRXhwcmVzc2lvbihub2RlKSB7XG4gIHZhciBleHByID0gdG9FeHByZXNzaW9uKG5vZGUuZXhwcmVzc2lvbnNbMF0pO1xuICBmb3IgKHZhciBpID0gMTsgaSA8IG5vZGUuZXhwcmVzc2lvbnMubGVuZ3RoOyBpKyspIHtcbiAgICBleHByID0gbmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oe1xuICAgICAgb3BlcmF0b3I6IFwiLFwiLFxuICAgICAgbGVmdDogZXhwcixcbiAgICAgIHJpZ2h0OiB0b0V4cHJlc3Npb24obm9kZS5leHByZXNzaW9uc1tpXSlcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gZXhwcjtcbn1cblxuZnVuY3Rpb24gY29udmVydFN3aXRjaENhc2Uobm9kZSkge1xuICBpZiAobm9kZS50ZXN0KSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hDYXNlKHtcbiAgICAgIHRlc3Q6IGNvbnZlcnQobm9kZS50ZXN0KSxcbiAgICAgIGNvbnNlcXVlbnQ6IG5vZGUuY29uc2VxdWVudC5tYXAoY29udmVydClcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaERlZmF1bHQoeyBjb25zZXF1ZW50OiBub2RlLmNvbnNlcXVlbnQubWFwKGNvbnZlcnQpIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3dpdGNoU3RhdGVtZW50KG5vZGUpIHtcbiAgaWYgKCFub2RlLmNhc2VzLmV2ZXJ5KChjKSA9PiBjLnRlc3QgIT0gbnVsbCApKSB7XG4gICAgdmFyIHNjcyA9IG5vZGUuY2FzZXMubWFwKGNvbnZlcnRTd2l0Y2hDYXNlKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNjcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHNjc1tpXS50eXBlID09PSBcIlN3aXRjaERlZmF1bHRcIikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdCh7XG4gICAgICBkaXNjcmltaW5hbnQ6IHRvRXhwcmVzc2lvbihub2RlLmRpc2NyaW1pbmFudCksXG4gICAgICBwcmVEZWZhdWx0Q2FzZXM6IHNjcy5zbGljZSgwLCBpKSxcbiAgICAgIGRlZmF1bHRDYXNlOiBzY3NbaV0sXG4gICAgICBwb3N0RGVmYXVsdENhc2VzOiBzY3Muc2xpY2UoaSArIDEpXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnQoe1xuICAgICAgZGlzY3JpbWluYW50OiB0b0V4cHJlc3Npb24obm9kZS5kaXNjcmltaW5hbnQpLFxuICAgICAgY2FzZXM6IG5vZGUuY2FzZXMubWFwKGNvbnZlcnRTd2l0Y2hDYXNlKVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUaGlzRXhwcmVzc2lvbigpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5UaGlzRXhwcmVzc2lvbigpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGhyb3dTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LlRocm93U3RhdGVtZW50KHsgZXhwcmVzc2lvbjogdG9FeHByZXNzaW9uKG5vZGUuYXJndW1lbnQpIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VHJ5U3RhdGVtZW50KG5vZGUpIHtcbiAgaWYgKG5vZGUuZmluYWxpemVyICE9IG51bGwpIHtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlRyeUZpbmFsbHlTdGF0ZW1lbnQoe1xuICAgICAgYm9keTogY29udmVydEJsb2NrKG5vZGUuYmxvY2spLFxuICAgICAgY2F0Y2hDbGF1c2U6IGNvbnZlcnRDYXRjaENsYXVzZShub2RlLmhhbmRsZXIpLFxuICAgICAgZmluYWxpemVyOiBjb252ZXJ0QmxvY2sobm9kZS5maW5hbGl6ZXIpXG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlDYXRjaFN0YXRlbWVudCh7XG4gICAgICBib2R5OiBjb252ZXJ0QmxvY2sobm9kZS5ibG9jayksXG4gICAgICBjYXRjaENsYXVzZTogY29udmVydENhdGNoQ2xhdXNlKG5vZGUuaGFuZGxlciksXG4gICAgICBoYW5kbGVyczogW2NvbnZlcnQobm9kZS5oYW5kbGVyKV1cbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0VXBkYXRlRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuVXBkYXRlRXhwcmVzc2lvbih7XG4gICAgaXNQcmVmaXg6IG5vZGUucHJlZml4LFxuICAgIG9wZXJhdG9yOiBub2RlLm9wZXJhdG9yLFxuICAgIG9wZXJhbmQ6IHRvQmluZGluZyhub2RlLmFyZ3VtZW50KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFVuYXJ5RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuVW5hcnlFeHByZXNzaW9uKHtcbiAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcbiAgICBvcGVyYW5kOiB0b0V4cHJlc3Npb24obm9kZS5hcmd1bWVudClcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUsIGlzRGVjbGFyYXRpb24pIHtcbiAgbGV0IGRlY2xhcmF0aW9uID0gbmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb24oe1xuICAgIGtpbmQ6IG5vZGUua2luZCxcbiAgICBkZWNsYXJhdG9yczogbm9kZS5kZWNsYXJhdGlvbnMubWFwKGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0b3IpXG4gIH0pO1xuICBpZihpc0RlY2xhcmF0aW9uKSByZXR1cm4gZGVjbGFyYXRpb247XG4gIHJldHVybiBuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCh7IGRlY2xhcmF0aW9uIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VmFyaWFibGVEZWNsYXJhdG9yKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5WYXJpYWJsZURlY2xhcmF0b3Ioe1xuICAgIGJpbmRpbmc6IHRvQmluZGluZyhub2RlLmlkKSxcbiAgICBpbml0OiBjb252ZXJ0KG5vZGUuaW5pdClcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRXaGlsZVN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuV2hpbGVTdGF0ZW1lbnQoeyB0ZXN0OiBjb252ZXJ0KG5vZGUudGVzdCksIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KSB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFdpdGhTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LldpdGhTdGF0ZW1lbnQoeyBvYmplY3Q6IGNvbnZlcnQobm9kZS5vYmplY3QpLCBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSkgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRNZXRhUHJvcGVydHkobm9kZSkge1xuICBpZihub2RlLm1ldGEgPT09IFwibmV3XCIgJiYgbm9kZS5wcm9wZXJ0eSA9PT0gXCJ0YXJnZXRcIikge1xuICAgIHJldHVybiBuZXcgU2hpZnQuTmV3VGFyZ2V0RXhwcmVzc2lvbigpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0T2JqZWN0UGF0dGVybihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuT2JqZWN0QmluZGluZyh7IHByb3BlcnRpZXM6IG5vZGUucHJvcGVydGllcy5tYXAodG9CaW5kaW5nKX0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0QXNzaWdubWVudFBhdHRlcm4obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkJpbmRpbmdXaXRoRGVmYXVsdCh7XG4gICAgYmluZGluZzogdG9CaW5kaW5nKG5vZGUubGVmdCksXG4gICAgaW5pdDogY29udmVydChub2RlLnJpZ2h0KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydENsYXNzRGVjbGFyYXRpb24obm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LkNsYXNzRGVjbGFyYXRpb24oe1xuICAgIG5hbWU6IHRvQmluZGluZyhub2RlLmlkKSxcbiAgICBzdXBlcjogdG9FeHByZXNzaW9uKG5vZGUuc3VwZXJDbGFzcyksXG4gICAgZWxlbWVudHM6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydENsYXNzRXhwcmVzc2lvbihub2RlKSB7XG4gIGxldCB7bmFtZSxzdXBlcjpzcHIsZWxlbWVudHN9ID0gY29udmVydENsYXNzRGVjbGFyYXRpb24obm9kZSk7XG4gIHJldHVybiBuZXcgU2hpZnQuQ2xhc3NFeHByZXNzaW9uKHsgbmFtZSwgc3VwZXI6c3ByLCBlbGVtZW50cyB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydENsYXNzQm9keShub2RlKSB7XG4gIHJldHVybiBub2RlLmJvZHkubWFwKGNvbnZlcnQpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0UmVzdEVsZW1lbnQobm9kZSkge1xuICByZXR1cm4gdG9CaW5kaW5nKG5vZGUuYXJndW1lbnQpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RWxlbWVudHMoZWx0cykge1xuICBsZXQgY291bnQgPSBlbHRzLmxlbmd0aDtcbiAgaWYoY291bnQgPT09IDApIHtcbiAgICByZXR1cm4gW1tdLCBudWxsXTtcbiAgfSBlbHNlIGlmKGVsdHNbY291bnQtMV0udHlwZSA9PT0gXCJSZXN0RWxlbWVudFwiKSB7XG4gICAgcmV0dXJuIFtlbHRzLnNsaWNlKDAsY291bnQtMSkubWFwKHRvQmluZGluZyksIHRvQmluZGluZyhlbHRzW2NvdW50LTFdKV07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFtlbHRzLm1hcCh0b0JpbmRpbmcpLCBudWxsXTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0QXJyYXlQYXR0ZXJuKG5vZGUpIHtcbiAgbGV0IFtlbGVtZW50cywgcmVzdEVsZW1lbnRdID0gY29udmVydEVsZW1lbnRzKG5vZGUuZWxlbWVudHMpO1xuICByZXR1cm4gbmV3IFNoaWZ0LkFycmF5QmluZGluZyh7IGVsZW1lbnRzLCByZXN0RWxlbWVudCB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEFycm93RnVuY3Rpb25FeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5BcnJvd0V4cHJlc3Npb24oe1xuICAgIHBhcmFtczogbmV3IFNoaWZ0LkZvcm1hbFBhcmFtZXRlcnMoY29udmVydEZ1bmN0aW9uUGFyYW1zKG5vZGUpKSxcbiAgICBib2R5OiBub2RlLmV4cHJlc3Npb24gPyBjb252ZXJ0KG5vZGUuYm9keSkgOiB0b0Z1bmN0aW9uQm9keShub2RlLmJvZHkpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RnVuY3Rpb25QYXJhbXMobm9kZSkge1xuICBsZXQgW2l0ZW1zLCByZXN0XSA9IGNvbnZlcnRFbGVtZW50cyhub2RlLnBhcmFtcyk7XG4gIHJldHVybiB7IGl0ZW1zLCByZXN0IH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDbGFzc01ldGhvZChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuQ2xhc3NFbGVtZW50KHsgaXNTdGF0aWM6IG5vZGUuc3RhdGljLCBtZXRob2Q6IHRvTWV0aG9kKG5vZGUpIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3VwZXIobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LlN1cGVyKCk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUYWdnZWRUZW1wbGF0ZUV4cHJlc3Npb24obm9kZSkge1xuICBsZXQgZWx0cyA9IFtdO1xuICBub2RlLnF1YXNpLnF1YXNpcy5mb3JFYWNoKChlLGkpID0+IHtcbiAgICBlbHRzLnB1c2goY29udmVydFRlbXBsYXRlRWxlbWVudChlKSk7XG4gICAgaWYoaSA8IG5vZGUucXVhc2kuZXhwcmVzc2lvbnMubGVuZ3RoKSBlbHRzLnB1c2godG9FeHByZXNzaW9uKG5vZGUucXVhc2kuZXhwcmVzc2lvbnNbaV0pKTtcbiAgfSk7XG4gIHJldHVybiBuZXcgU2hpZnQuVGVtcGxhdGVFeHByZXNzaW9uKHtcbiAgICB0YWc6IHRvRXhwcmVzc2lvbihub2RlLnRhZyksXG4gICAgZWxlbWVudHM6IGVsdHNcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUZW1wbGF0ZUVsZW1lbnQobm9kZSkge1xuICByZXR1cm4gbmV3IFNoaWZ0LlRlbXBsYXRlRWxlbWVudCh7IHJhd1ZhbHVlOiBub2RlLnZhbHVlLnJhdyB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydFRlbXBsYXRlTGl0ZXJhbChub2RlLCB0YWcpIHtcbiAgbGV0IGVsdHMgPSBbXTtcbiAgbm9kZS5xdWFzaXMuZm9yRWFjaCgoZSxpKSA9PiB7XG4gICAgZWx0cy5wdXNoKGNvbnZlcnRUZW1wbGF0ZUVsZW1lbnQoZSkpO1xuICAgIGlmKGkgPCBub2RlLmV4cHJlc3Npb25zLmxlbmd0aCkgZWx0cy5wdXNoKHRvRXhwcmVzc2lvbihub2RlLmV4cHJlc3Npb25zW2ldKSk7XG4gIH0pO1xuICByZXR1cm4gbmV3IFNoaWZ0LlRlbXBsYXRlRXhwcmVzc2lvbih7XG4gICAgdGFnOiB0YWcgIT0gbnVsbCA/IGNvbnZlcnQodGFnKSA6IG51bGwsXG4gICAgZWxlbWVudHM6IGVsdHNcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRZaWVsZEV4cHJlc3Npb24obm9kZSkge1xuICBpZihub2RlLmRlbGVnYXRlKSByZXR1cm4gbmV3IFNoaWZ0LllpZWxkR2VuZXJhdG9yRXhwcmVzc2lvbih7IGV4cHJlc3Npb246IHRvRXhwcmVzc2lvbihub2RlLmFyZ3VtZW50KSB9KTtcbiAgcmV0dXJuIG5ldyBTaGlmdC5ZaWVsZEV4cHJlc3Npb24oeyBleHByZXNzaW9uOiB0b0V4cHJlc3Npb24obm9kZS5hcmd1bWVudCkgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHBvcnRBbGxEZWNsYXJhdGlvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuRXhwb3J0QWxsRnJvbSh7IG1vZHVsZVNwZWNpZmllcjogbm9kZS5zb3VyY2UudmFsdWUgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHBvcnROYW1lZERlY2xhcmF0aW9uKG5vZGUpIHtcbiAgaWYobm9kZS5kZWNsYXJhdGlvbiAhPSBudWxsKSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5FeHBvcnQoe1xuICAgICAga2luZDogbm9kZS5raW5kLFxuICAgICAgZGVjbGFyYXRpb246IChub2RlLmRlY2xhcmF0aW9uLnR5cGUgPT09IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiKSA/XG4gICAgICAgIGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uKG5vZGUuZGVjbGFyYXRpb24sIHRydWUpIDpcbiAgICAgICAgY29udmVydChub2RlLmRlY2xhcmF0aW9uKVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBTaGlmdC5FeHBvcnRGcm9tKHtcbiAgICBtb2R1bGVTcGVjaWZpZXI6IG5vZGUuc291cmNlICE9IG51bGwgPyBub2RlLnNvdXJjZS52YWx1ZSA6IG51bGwsXG4gICAgbmFtZWRFeHBvcnRzOiBub2RlLnNwZWNpZmllcnMubWFwKGNvbnZlcnQpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0U3BlY2lmaWVyKG5vZGUpIHtcbiAgcmV0dXJuIG5ldyBTaGlmdC5FeHBvcnRTcGVjaWZpZXIoe1xuICAgIGV4cG9ydGVkTmFtZTogbm9kZS5leHBvcnRlZC5uYW1lLFxuICAgIG5hbWU6IG5vZGUubG9jYWwubmFtZSAhPT0gbm9kZS5leHBvcnRlZC5uYW1lID8gbm9kZS5sb2NhbC5uYW1lIDogbnVsbFxuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cG9ydERlZmF1bHREZWNsYXJhdGlvbihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuRXhwb3J0RGVmYXVsdCh7IGJvZHk6IGNvbnZlcnQobm9kZS5kZWNsYXJhdGlvbikgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJbXBvcnREZWNsYXJhdGlvbihub2RlKSB7XG4gIGxldCBoYXNEZWZhdWx0U3BlY2lmaWVyID0gbm9kZS5zcGVjaWZpZXJzLnNvbWUocyA9PiBzLnR5cGUgPT09IFwiSW1wb3J0RGVmYXVsdFNwZWNpZmllclwiKSxcbiAgICAgIGhhc05hbWVzcGFjZVNwZWNpZmllciA9IG5vZGUuc3BlY2lmaWVycy5zb21lKHMgPT4gcy50eXBlID09PSBcIkltcG9ydE5hbWVzcGFjZVNwZWNpZmllclwiKSxcbiAgICAgIGRlZmF1bHRCaW5kaW5nID0gaGFzRGVmYXVsdFNwZWNpZmllciA/IHRvQmluZGluZyhub2RlLnNwZWNpZmllcnNbMF0pOiBudWxsO1xuXG4gIGlmKGhhc05hbWVzcGFjZVNwZWNpZmllcikge1xuICAgIHJldHVybiBuZXcgU2hpZnQuSW1wb3J0TmFtZXNwYWNlKHtcbiAgICAgIG1vZHVsZVNwZWNpZmllcjogbm9kZS5zb3VyY2UudmFsdWUsXG4gICAgICBuYW1lc3BhY2VCaW5kaW5nOiB0b0JpbmRpbmcobm9kZS5zcGVjaWZpZXJzWzFdKSxcbiAgICAgIGRlZmF1bHRCaW5kaW5nXG4gICAgfSk7XG4gIH1cblxuICBsZXQgbmFtZWRJbXBvcnRzID0gbm9kZS5zcGVjaWZpZXJzLm1hcChjb252ZXJ0KTtcbiAgaWYoaGFzRGVmYXVsdFNwZWNpZmllcikgbmFtZWRJbXBvcnRzLnNoaWZ0KCk7XG4gIHJldHVybiBuZXcgU2hpZnQuSW1wb3J0KHtcbiAgICBtb2R1bGVTcGVjaWZpZXI6IG5vZGUuc291cmNlLnZhbHVlLFxuICAgIG5hbWVkSW1wb3J0cyxcbiAgICBkZWZhdWx0QmluZGluZ1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEltcG9ydERlZmF1bHRTcGVjaWZpZXIobm9kZSkge1xuICByZXR1cm4gdG9CaW5kaW5nKG5vZGUubG9jYWwpO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyKG5vZGUpIHtcbiAgcmV0dXJuIHRvQmluZGluZyhub2RlLmxvY2FsKTtcbn1cblxuZnVuY3Rpb24gY29udmVydEltcG9ydFNwZWNpZmllcihub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuSW1wb3J0U3BlY2lmaWVyKHtcbiAgICBuYW1lOiBub2RlLmltcG9ydGVkLm5hbWUgPT09IG5vZGUubG9jYWwubmFtZSA/IG51bGwgOiBub2RlLmltcG9ydGVkLm5hbWUsXG4gICAgYmluZGluZzogdG9CaW5kaW5nKG5vZGUubG9jYWwpXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3ByZWFkRWxlbWVudChub2RlKSB7XG4gIHJldHVybiBuZXcgU2hpZnQuU3ByZWFkRWxlbWVudCh7IGV4cHJlc3Npb246IHRvRXhwcmVzc2lvbihub2RlLmFyZ3VtZW50KX0pO1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RmlsZShub2RlKSB7XG4gIHJldHVybiBjb252ZXJ0KG5vZGUucHJvZ3JhbSk7XG59XG5cbmNvbnN0IENvbnZlcnQgPSB7XG4gIEFzc2lnbm1lbnRFeHByZXNzaW9uOiBjb252ZXJ0QXNzaWdubWVudEV4cHJlc3Npb24sXG4gIEFzc2lnbm1lbnRQYXR0ZXJuOiBjb252ZXJ0QXNzaWdubWVudFBhdHRlcm4sXG4gIEFycmF5RXhwcmVzc2lvbjogY29udmVydEFycmF5RXhwcmVzc2lvbixcbiAgQXJyYXlQYXR0ZXJuOiBjb252ZXJ0QXJyYXlQYXR0ZXJuLFxuICBBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvbjogY29udmVydEFycm93RnVuY3Rpb25FeHByZXNzaW9uLFxuICBCbG9ja1N0YXRlbWVudDogY29udmVydEJsb2NrU3RhdGVtZW50LFxuICBCaW5hcnlFeHByZXNzaW9uOiBjb252ZXJ0QmluYXJ5RXhwcmVzc2lvbixcbiAgQnJlYWtTdGF0ZW1lbnQ6IGNvbnZlcnRCcmVha1N0YXRlbWVudCxcbiAgQ2FsbEV4cHJlc3Npb246IGNvbnZlcnRDYWxsRXhwcmVzc2lvbixcbiAgQ2F0Y2hDbGF1c2U6IGNvbnZlcnRDYXRjaENsYXVzZSxcbiAgQ2xhc3NEZWNsYXJhdGlvbjogY29udmVydENsYXNzRGVjbGFyYXRpb24sXG4gIENsYXNzRXhwcmVzc2lvbjogY29udmVydENsYXNzRXhwcmVzc2lvbixcbiAgQ2xhc3NCb2R5OiBjb252ZXJ0Q2xhc3NCb2R5LFxuICBDbGFzc01ldGhvZDogY29udmVydENsYXNzTWV0aG9kLFxuICBDb25kaXRpb25hbEV4cHJlc3Npb246IGNvbnZlcnRDb25kaXRpb25hbEV4cHJlc3Npb24sXG4gIENvbnRpbnVlU3RhdGVtZW50OiBjb252ZXJ0Q29udGludWVTdGF0ZW1lbnQsXG4gIERvV2hpbGVTdGF0ZW1lbnQ6IGNvbnZlcnREb1doaWxlU3RhdGVtZW50LFxuICBEZWJ1Z2dlclN0YXRlbWVudDogY29udmVydERlYnVnZ2VyU3RhdGVtZW50LFxuICBFbXB0eVN0YXRlbWVudDogY29udmVydEVtcHR5U3RhdGVtZW50LFxuICBFeHBvcnRBbGxEZWNsYXJhdGlvbjogY29udmVydEV4cG9ydEFsbERlY2xhcmF0aW9uLFxuICBFeHBvcnREZWZhdWx0RGVjbGFyYXRpb246IGNvbnZlcnRFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24sXG4gIEV4cG9ydE5hbWVkRGVjbGFyYXRpb246IGNvbnZlcnRFeHBvcnROYW1lZERlY2xhcmF0aW9uLFxuICBFeHBvcnRTcGVjaWZpZXI6IGNvbnZlcnRFeHBvcnRTcGVjaWZpZXIsXG4gIEV4cHJlc3Npb25TdGF0ZW1lbnQ6IGNvbnZlcnRFeHByZXNzaW9uU3RhdGVtZW50LFxuICBGaWxlOiBjb252ZXJ0RmlsZSxcbiAgRm9yU3RhdGVtZW50OiBjb252ZXJ0Rm9yU3RhdGVtZW50LFxuICBGb3JPZlN0YXRlbWVudDogY29udmVydEZvck9mU3RhdGVtZW50LFxuICBGb3JJblN0YXRlbWVudDogY29udmVydEZvckluU3RhdGVtZW50LFxuICBGdW5jdGlvbkRlY2xhcmF0aW9uOiBjb252ZXJ0RnVuY3Rpb25EZWNsYXJhdGlvbixcbiAgRnVuY3Rpb25FeHByZXNzaW9uOiBjb252ZXJ0RnVuY3Rpb25FeHByZXNzaW9uLFxuICBJZlN0YXRlbWVudDogY29udmVydElmU3RhdGVtZW50LFxuICBJbXBvcnREZWNsYXJhdGlvbjogY29udmVydEltcG9ydERlY2xhcmF0aW9uLFxuICBJbXBvcnREZWZhdWx0U3BlY2lmaWVyOiBjb252ZXJ0SW1wb3J0RGVmYXVsdFNwZWNpZmllcixcbiAgSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyOiBjb252ZXJ0SW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyLFxuICBJbXBvcnRTcGVjaWZpZXI6IGNvbnZlcnRJbXBvcnRTcGVjaWZpZXIsXG4gIExpdGVyYWw6IGNvbnZlcnRMaXRlcmFsLFxuICBCb29sZWFuTGl0ZXJhbDogY29udmVydEJvb2xlYW5MaXRlcmFsLFxuICBOdW1lcmljTGl0ZXJhbDogY29udmVydE51bWVyaWNMaXRlcmFsLFxuICBTdHJpbmdMaXRlcmFsOiBjb252ZXJ0U3RyaW5nTGl0ZXJhbCxcbiAgUmVnRXhwTGl0ZXJhbDogY29udmVydFJlZ0V4cExpdGVyYWwsXG4gIE51bGxMaXRlcmFsOiBjb252ZXJ0TnVsbExpdGVyYWwsXG4gIExhYmVsZWRTdGF0ZW1lbnQ6IGNvbnZlcnRMYWJlbGVkU3RhdGVtZW50LFxuICBMb2dpY2FsRXhwcmVzc2lvbjogY29udmVydEJpbmFyeUV4cHJlc3Npb24sXG4gIE1lbWJlckV4cHJlc3Npb246IGNvbnZlcnRNZW1iZXJFeHByZXNzaW9uLFxuICBNZXRhUHJvcGVydHk6IGNvbnZlcnRNZXRhUHJvcGVydHksXG4gIE5ld0V4cHJlc3Npb246IGNvbnZlcnROZXdFeHByZXNzaW9uLFxuICBPYmplY3RFeHByZXNzaW9uOiBjb252ZXJ0T2JqZWN0RXhwcmVzc2lvbixcbiAgT2JqZWN0UGF0dGVybjogY29udmVydE9iamVjdFBhdHRlcm4sXG4gIE9iamVjdFByb3BlcnR5OiBjb252ZXJ0T2JqZWN0UHJvcGVydHksXG4gIFByb2dyYW06IGNvbnZlcnRQcm9ncmFtLFxuICBSZXN0RWxlbWVudDogY29udmVydFJlc3RFbGVtZW50LFxuICBSZXR1cm5TdGF0ZW1lbnQ6IGNvbnZlcnRSZXR1cm5TdGF0ZW1lbnQsXG4gIFNlcXVlbmNlRXhwcmVzc2lvbjogY29udmVydFNlcXVlbmNlRXhwcmVzc2lvbixcbiAgU3ByZWFkRWxlbWVudDogY29udmVydFNwcmVhZEVsZW1lbnQsXG4gIFN1cGVyOiBjb252ZXJ0U3VwZXIsXG4gIFN3aXRjaENhc2U6IGNvbnZlcnRTd2l0Y2hDYXNlLFxuICBTd2l0Y2hTdGF0ZW1lbnQ6IGNvbnZlcnRTd2l0Y2hTdGF0ZW1lbnQsXG4gIFRhZ2dlZFRlbXBsYXRlRXhwcmVzc2lvbjogY29udmVydFRhZ2dlZFRlbXBsYXRlRXhwcmVzc2lvbixcbiAgVGVtcGxhdGVFbGVtZW50OiBjb252ZXJ0VGVtcGxhdGVFbGVtZW50LFxuICBUZW1wbGF0ZUxpdGVyYWw6IGNvbnZlcnRUZW1wbGF0ZUxpdGVyYWwsXG4gIFRoaXNFeHByZXNzaW9uOiBjb252ZXJ0VGhpc0V4cHJlc3Npb24sXG4gIFRocm93U3RhdGVtZW50OiBjb252ZXJ0VGhyb3dTdGF0ZW1lbnQsXG4gIFRyeVN0YXRlbWVudDogY29udmVydFRyeVN0YXRlbWVudCxcbiAgVW5hcnlFeHByZXNzaW9uOiBjb252ZXJ0VW5hcnlFeHByZXNzaW9uLFxuICBVcGRhdGVFeHByZXNzaW9uOiBjb252ZXJ0VXBkYXRlRXhwcmVzc2lvbixcbiAgVmFyaWFibGVEZWNsYXJhdGlvbjogY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb24sXG4gIFZhcmlhYmxlRGVjbGFyYXRvcjogY29udmVydFZhcmlhYmxlRGVjbGFyYXRvcixcbiAgV2hpbGVTdGF0ZW1lbnQ6IGNvbnZlcnRXaGlsZVN0YXRlbWVudCxcbiAgV2l0aFN0YXRlbWVudDogY29udmVydFdpdGhTdGF0ZW1lbnQsXG4gIFlpZWxkRXhwcmVzc2lvbjogY29udmVydFlpZWxkRXhwcmVzc2lvblxufTtcblxuIl19
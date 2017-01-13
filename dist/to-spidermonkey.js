"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = convert;
/**
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

// convert Shift AST format to Babylon AST format

function convert(ast) {
  if (ast == null) {
    return null;
  }

  return Convert[ast.type](ast);
}

function convertBindingWithDefault(node) {
  return {
    type: "AssignmentPattern",
    left: convert(node.binding),
    right: convert(node.init)
  };
}

function convertFunctionBody(node) {
  return {
    type: "BlockStatement",
    directives: node.directives ? node.directives.map(convert) : [],
    body: node.statements ? node.statements.map(convert) : []
  };
}

function convertFunctionDeclaration(node) {
  return {
    type: "FunctionDeclaration",
    id: convert(node.name),
    params: convertFormalParameters(node.params),
    body: convert(node.body),
    generator: node.isGenerator,
    expression: false
  };
}

function convertFunctionExpression(node) {
  return {
    type: "FunctionExpression",
    id: convert(node.name),
    params: convertFormalParameters(node.params),
    body: convert(node.body),
    generator: node.isGenerator,
    expression: false
  };
}

function convertObjectExpression(node) {
  return {
    type: "ObjectExpression",
    properties: node.properties.map(convert)
  };
}

function convertGetter(node) {
  return {
    type: "ObjectMethod",
    key: convert(node.name),
    computed: false,
    id: null,
    params: [],
    body: convertFunctionBody(node.body),
    generator: false,
    expression: false,
    method: false,
    shorthand: false,
    kind: "get"
  };
}

function convertSetter(node) {
  return {
    type: "ObjectMethod",
    key: convert(node.name),
    computed: node.name.type === "ComputedPropertyName",
    id: null,
    params: [convert(node.param)],
    body: convertFunctionBody(node.body),
    generator: false,
    expression: false,
    method: false,
    shorthand: false,
    kind: "set"
  };
}
function convertMethod(node) {
  return {
    type: "ObjectMethod",
    key: convert(node.name),
    computed: node.name.type === "ComputedPropertyName",
    kind: "method",
    method: true,
    shorthand: false,
    id: null,
    params: convertFormalParameters(node.params),
    generator: node.isGenerator,
    expression: false,
    body: convertFunctionBody(node.body)
  };
}

function convertDataProperty(node) {
  return {
    type: "ObjectProperty",
    key: convert(node.name),
    value: convert(node.expression),
    computed: node.name.type === "ComputedPropertyName",
    method: false,
    shorthand: false
  };
}

function convertComputedPropertyName(node) {
  return convert(node.expression);
}

function convertPropertyName(node) {
  switch (node.type) {
    case "StaticPropertyName":
      return convertStaticPropertyName(node);
    case "ComputedPropertyName":
      return convertComputedPropertyName(node);
    case "ShorthandProperty":
      return convertShorthandProperty(node);
  }
}

function convertLiteralBooleanExpression(node) {
  return {
    type: "BooleanLiteral",
    value: node.value
  };
}

function convertLiteralNullExpression() {
  return {
    type: "NullLiteral"
  };
}

function convertLiteralNumericExpression(node) {
  return {
    type: "NumericLiteral",
    value: parseFloat(node.value)
  };
}

function convertLiteralInfinityExpression(node) {
  return {
    type: "Literal",
    value: 1 / 0
  };
}

function convertLiteralRegExpExpression(node) {
  return {
    type: "RegExpLiteral",
    value: undefined,
    pattern: node.pattern,
    flags: node.flags
  };
}

function convertLiteralStringExpression(node) {
  return {
    type: "StringLiteral",
    value: node.value
  };
}

function convertArrayExpression(node) {
  return {
    type: "ArrayExpression",
    elements: node.elements.map(convert)
  };
}

function convertAssignmentExpression(node) {
  return {
    type: "AssignmentExpression",
    operator: "=",
    left: convert(node.binding),
    right: convert(node.expression)
  };
}

function convertSequenceExpressionToArray(node) {
  var array = [];
  if (node.left.type === "BinaryExpression" && node.left.operator === ",") {
    array = convertSequenceExpressionToArray(node.left);
  } else {
    array = [convert(node.left)];
  }
  array.push(convert(node.right));
  return array;
}

function convertBinaryExpression(node) {
  if (node.operator === ",") {
    return {
      type: "SequenceExpression",
      expressions: convertSequenceExpressionToArray(node)
    };
  }
  return {
    type: node.operator === "||" || node.operator === "&&" ? "LogicalExpression" : "BinaryExpression",
    operator: node.operator,
    left: convert(node.left),
    right: convert(node.right)
  };
}

function convertCallExpression(node) {
  return {
    type: "CallExpression",
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  };
}

function convertComputedMemberExpression(node) {
  return {
    type: "MemberExpression",
    object: convert(node.object),
    property: convert(node.expression),
    computed: true
  };
}

function convertConditionalExpression(node) {
  return {
    type: "ConditionalExpression",
    test: convert(node.test),
    alternate: convert(node.alternate),
    consequent: convert(node.consequent)
  };
}

function createIdentifier(name) {
  return {
    type: "Identifier",
    name: name
  };
}

function convertIdentifierExpression(node) {
  return createIdentifier(node.name);
}

function convertNewExpression(node) {
  return {
    type: "NewExpression",
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  };
}

function convertStaticMemberExpression(node) {
  return {
    type: "MemberExpression",
    object: convert(node.object),
    property: createIdentifier(node.property),
    computed: false
  };
}

function convertThisExpression() {
  return {
    type: "ThisExpression"
  };
}

function convertBlockStatement(node) {
  return convertBlock(node.block);
}

function convertBreakStatement(node) {
  return {
    type: "BreakStatement",
    label: createIdentifier(node.label)
  };
}

function convertContinueStatement(node) {
  return {
    type: "ContinueStatement",
    label: node.label ? createIdentifier(node.label) : null
  };
}

function convertDebuggerStatement() {
  return {
    type: "DebuggerStatement"
  };
}

function convertDoWhileStatement(node) {
  return {
    type: "DoWhileStatement",
    test: convert(node.test),
    body: convert(node.body)
  };
}

function convertEmptyStatement() {
  return {
    type: "EmptyStatement"
  };
}

function convertExpressionStatement(node) {
  return {
    type: "ExpressionStatement",
    expression: convert(node.expression)
  };
}

function convertForInStatement(node) {
  return {
    type: "ForInStatement",
    left: convert(node.left),
    right: convert(node.right),
    body: convert(node.body)
  };
}

function convertForStatement(node) {
  return {
    type: "ForStatement",
    init: convert(node.init),
    test: convert(node.test),
    update: convert(node.update),
    body: convert(node.body)
  };
}

function convertIfStatement(node) {
  return {
    type: "IfStatement",
    test: convert(node.test),
    consequent: convert(node.consequent),
    alternate: convert(node.alternate)
  };
}

function convertLabeledStatement(node) {
  return {
    type: "LabeledStatement",
    label: createIdentifier(node.label),
    body: convert(node.body)
  };
}

function convertReturnStatement(node) {
  return {
    type: "ReturnStatement",
    argument: convert(node.expression)
  };
}

function convertSwitchStatement(node) {
  return {
    type: "SwitchStatement",
    discriminant: convert(node.discriminant),
    cases: node.cases.map(convert)
  };
}

function convertSwitchStatementWithDefault(node) {
  return {
    type: "SwitchStatement",
    discriminant: convert(node.discriminant),
    cases: node.preDefaultCases.map(convert).concat(convert(node.defaultCase)).concat(node.postDefaultCases.map(convert))
  };
}

function convertThrowStatement(node) {
  return {
    type: "ThrowStatement",
    argument: convert(node.expression)
  };
}

function toTryStatement(convertFinalizer, node) {
  return {
    type: "TryStatement",
    block: convertBlock(node.body),
    handler: convert(node.catchClause),
    guardedHandlers: [],
    finalizer: convertFinalizer(node.finalizer)
  };
}

var convertTryCatchStatement = toTryStatement.bind(null, function () {
  return null;
});

var convertTryFinallyStatement = toTryStatement.bind(null, convert);

function convertVariableDeclarationStatement(node) {
  return convert(node.declaration);
}

function convertWhileStatement(node) {
  return {
    type: "WhileStatement",
    test: convert(node.test),
    body: convert(node.body)
  };
}

function convertWithStatement(node) {
  return {
    type: "WithStatement",
    object: convert(node.object),
    body: convert(node.body)
  };
}

function convertBlock(node) {
  return {
    type: "BlockStatement",
    directives: [],
    body: node.statements.map(convert)
  };
}

function convertCatchClause(node) {
  return {
    type: "CatchClause",
    param: convert(node.binding),
    body: convert(node.body)
  };
}

function toFile(sourceType, bodyProp, node) {
  return {
    type: "File",
    program: {
      type: "Program",
      directives: node.directives.map(convert),
      body: node[bodyProp].map(convert),
      sourceType: sourceType
    }
  };
}

var convertScript = toFile.bind(null, "script", "statements");

var convertModule = toFile.bind(null, "module", "items");

function toSwitchCase(convertCase, node) {
  return {
    type: "SwitchCase",
    test: convertCase(node.test),
    consequent: node.consequent.map(convert)
  };
}

var convertSwitchCase = toSwitchCase.bind(null, convert);

var convertSwitchDefault = toSwitchCase.bind(null, function () {
  return null;
});

function convertVariableDeclaration(node) {
  return {
    type: "VariableDeclaration",
    declarations: node.declarators.map(convert),
    kind: node.kind
  };
}

function convertVariableDeclarator(node) {
  return {
    type: "VariableDeclarator",
    id: convert(node.binding),
    init: convert(node.init)
  };
}

function convertBindingIdentifier(node) {
  return createIdentifier(node.name);
}

function convertDirective(node) {
  return {
    type: "Directive",
    value: {
      type: "DirectiveLiteral",
      value: node.rawValue
    }
  };
}

function convertUpdateExpression(node) {
  return {
    type: "UpdateExpression",
    prefix: node.isPrefix,
    operator: node.operator,
    argument: convert(node.operand)
  };
}

function convertUnaryExpression(node) {
  return {
    type: "UnaryExpression",
    operator: node.operator,
    argument: convert(node.operand),
    prefix: true
  };
}

function convertStaticPropertyName(node) {
  var value = parseFloat(node.value) || node.value,
      type = typeof value === "number" ? "NumericLiteral" : "StringLiteral";
  return { type: type, value: value };
}

function convertNewTargetExpression(node) {
  return {
    type: "MetaProperty",
    meta: createIdentifier("new"),
    property: createIdentifier("target")
  };
}

function convertForOfStatement(node) {
  return {
    type: "ForOfStatement",
    left: convert(node.left),
    right: convert(node.right),
    body: convert(node.body)
  };
}

function convertBindingPropertyIdentifier(node) {
  var key = convert(node.binding);
  var value = !node.init ? key : {
    type: "AssignmentPattern",
    left: key,
    right: convert(node.init)
  };
  return {
    type: "ObjectProperty",
    method: false,
    computed: false,
    shorthand: true,
    key: key,
    value: value
  };
}

function convertObjectBinding(node) {
  return {
    type: "ObjectPattern",
    properties: node.properties.map(convert)
  };
}

function convertClassDeclaration(node) {
  return {
    type: "ClassDeclaration",
    id: convert(node.name),
    superClass: convert(node.super),
    body: {
      type: "ClassBody",
      body: node.elements.map(convert)
    }
  };
}

function convertClassExpression(node) {
  var expression = convertClassDeclaration(node);
  expression.type = "ClassExpression";
  return expression;
}

function convertArrayBinding(node) {
  var elts = node.elements.map(function (v) {
    if (v.type === "BindingWithDefault") {
      return convertBindingWithDefault(v);
    }
    return convert(v);
  });
  if (node.restElement) elts.push({
    type: "RestElement",
    argument: convert(node.restElement)
  });
  return { type: "ArrayPattern", elements: elts };
}

function convertBindingPropertyProperty(node) {
  return {
    type: "ObjectProperty",
    computed: false,
    method: false,
    shorthand: false,
    key: convert(node.name),
    value: convert(node.binding)
  };
}

function convertArrowExpression(node) {
  var body = convert(node.body);
  return {
    type: "ArrowFunctionExpression",
    id: null,
    generator: false,
    expression: body.type !== "BlockStatement",
    params: convertFormalParameters(node.params),
    body: convert(node.body)
  };
}

function convertFormalParameters(ps) {
  var params = ps.items.map(convert);
  if (ps.items.length > 0) {
    if (ps.rest != null) {
      params.push({ type: "RestElement", argument: convert(ps.rest) });
    }
  }
  return params;
}

function convertClassElement(node) {
  var m = node.method;
  return {
    type: "ClassMethod",
    key: convert(m.name),
    computed: m.name.type === "ComputedPropertyName",
    kind: m.name.value === "constructor" ? "constructor" : "init",
    static: node.isStatic,
    id: null,
    params: convertFormalParameters(m.params),
    generator: m.isGenerator,
    expression: false,
    body: convert(m.body)
  };
}

function convertSpreadElement(node) {
  return {
    type: "SpreadElement",
    argument: convert(node.expression)
  };
}

function convertSuper(node) {
  return {
    type: "Super"
  };
}

function convertTemplateExpression(node) {
  var quasis = [],
      expressions = [];
  node.elements.forEach(function (v, i) {
    if (i % 2 === 0) quasis.push(convert(v));else expressions.push(convert(v));
  });
  quasis[quasis.length - 1].tail = true;

  if (node.tag != null) {
    return {
      type: "TaggedTemplateExpression",
      tag: convert(node.tag),
      quasi: {
        type: "TemplateLiteral",
        quasis: quasis,
        expressions: expressions
      }
    };
  }
  return {
    type: "TemplateLiteral",
    quasis: quasis,
    expressions: expressions
  };
}

function convertTemplateElement(node) {
  return {
    type: "TemplateElement",
    value: {
      raw: node.rawValue,
      cooked: node.rawValue
    },
    tail: false
  };
}

function convertYieldExpression(node) {
  return {
    type: "YieldExpression",
    argument: convert(node.expression),
    delegate: false
  };
}

function convertYieldGeneratorExpression(node) {
  var expr = convertYieldExpression(node);
  expr.delegate = true;
  return expr;
}

function convertExportAllFrom(node) {
  return {
    type: "ExportAllDeclaration",
    source: {
      type: "StringLiteral",
      value: node.moduleSpecifier
    }
  };
}

function convertExportFrom(node) {
  return {
    type: "ExportNamedDeclaration",
    declaration: null,
    source: {
      type: "StringLiteral",
      value: node.moduleSpecifier
    },
    specifiers: node.namedExports.map(convert)
  };
}

function convertExportSpecifier(node) {
  return {
    type: "ExportSpecifier",
    exported: createIdentifier(node.exportedName),
    local: createIdentifier(node.name != null ? node.name : node.exportedName)
  };
}

function convertExport(node) {
  return {
    type: "ExportNamedDeclaration",
    declaration: convert(node.declaration),
    specifiers: [],
    source: null
  };
}

function convertExportDefault(node) {
  return {
    type: "ExportDefaultDeclaration",
    declaration: convert(node.body)
  };
}

function convertImport(node) {
  var specifiers = node.namedImports.map(convert);
  if (node.defaultBinding) specifiers.unshift({
    type: "ImportDefaultSpecifier",
    local: convert(node.defaultBinding)
  });
  return {
    type: "ImportDeclaration",
    source: {
      type: "StringLiteral",
      value: node.moduleSpecifier
    },
    specifiers: specifiers
  };
}

function convertImportNamespace(node) {
  return {
    type: "ImportDeclaration",
    source: {
      type: "StringLiteral",
      value: node.moduleSpecifier
    },
    specifiers: [{
      type: "ImportDefaultSpecifier",
      local: convert(node.defaultBinding)
    }, {
      type: "ImportNamespaceSpecifier",
      local: convert(node.namespaceBinding)
    }]
  };
}

function convertImportSpecifier(node) {
  return {
    type: "ImportSpecifier",
    local: convert(node.binding),
    imported: createIdentifier(node.name || node.binding.name)
  };
}

function convertShorthandProperty(node) {
  return {
    type: "ObjectProperty",
    shorthand: true,
    method: false,
    computed: false,
    key: createIdentifier(node.name),
    value: createIdentifier(node.name)
  };
}

function convertCompoundAssignmentExpression(node) {
  return {
    type: "AssignmentExpression",
    operator: node.operator,
    left: convert(node.binding),
    right: convert(node.expression)
  };
}

var Convert = {
  // bindings
  BindingWithDefault: convertBindingWithDefault,
  BindingIdentifier: convertBindingIdentifier,
  ArrayBinding: convertArrayBinding,
  ObjectBinding: convertObjectBinding,
  BindingPropertyIdentifier: convertBindingPropertyIdentifier,
  BindingPropertyProperty: convertBindingPropertyProperty,

  // classes
  ClassExpression: convertClassExpression,
  ClassDeclaration: convertClassDeclaration,
  ClassElement: convertClassElement,

  // modules
  Module: convertModule,
  Import: convertImport,
  ImportNamespace: convertImportNamespace,
  ImportSpecifier: convertImportSpecifier,
  ExportAllFrom: convertExportAllFrom,
  ExportFrom: convertExportFrom,
  Export: convertExport,
  ExportDefault: convertExportDefault,
  ExportSpecifier: convertExportSpecifier,

  // property definition
  Method: convertMethod,
  Getter: convertGetter,
  Setter: convertSetter,
  DataProperty: convertDataProperty,
  ShorthandProperty: convertShorthandProperty,
  ComputedPropertyName: convertComputedPropertyName,
  StaticPropertyName: convertStaticPropertyName,

  // literals
  LiteralBooleanExpression: convertLiteralBooleanExpression,
  LiteralInfinityExpression: convertLiteralInfinityExpression,
  LiteralNullExpression: convertLiteralNullExpression,
  LiteralNumericExpression: convertLiteralNumericExpression,
  LiteralRegExpExpression: convertLiteralRegExpExpression,
  LiteralStringExpression: convertLiteralStringExpression,

  // other expressions
  ArrayExpression: convertArrayExpression,
  ArrowExpression: convertArrowExpression,
  AssignmentExpression: convertAssignmentExpression,
  BinaryExpression: convertBinaryExpression,
  CallExpression: convertCallExpression,
  CompoundAssignmentExpression: convertCompoundAssignmentExpression,
  ComputedMemberExpression: convertComputedMemberExpression,
  ConditionalExpression: convertConditionalExpression,
  FunctionExpression: convertFunctionExpression,
  IdentifierExpression: convertIdentifierExpression,
  NewExpression: convertNewExpression,
  NewTargetExpression: convertNewTargetExpression,
  ObjectExpression: convertObjectExpression,
  UnaryExpression: convertUnaryExpression,
  StaticMemberExpression: convertStaticMemberExpression,
  TemplateExpression: convertTemplateExpression,
  ThisExpression: convertThisExpression,
  UpdateExpression: convertUpdateExpression,
  YieldExpression: convertYieldExpression,
  YieldGeneratorExpression: convertYieldGeneratorExpression,

  // other statements
  BlockStatement: convertBlockStatement,
  BreakStatement: convertBreakStatement,
  ContinueStatement: convertContinueStatement,
  DebuggerStatement: convertDebuggerStatement,
  DoWhileStatement: convertDoWhileStatement,
  EmptyStatement: convertEmptyStatement,
  ExpressionStatement: convertExpressionStatement,
  ForInStatement: convertForInStatement,
  ForOfStatement: convertForOfStatement,
  ForStatement: convertForStatement,
  IfStatement: convertIfStatement,
  LabeledStatement: convertLabeledStatement,
  ReturnStatement: convertReturnStatement,
  SwitchStatement: convertSwitchStatement,
  SwitchStatementWithDefault: convertSwitchStatementWithDefault,
  ThrowStatement: convertThrowStatement,
  TryCatchStatement: convertTryCatchStatement,
  TryFinallyStatement: convertTryFinallyStatement,
  VariableDeclarationStatement: convertVariableDeclarationStatement,
  WhileStatement: convertWhileStatement,
  WithStatement: convertWithStatement,

  // other nodes
  Block: convertBlock,
  CatchClause: convertCatchClause,
  Directive: convertDirective,
  FormalParameters: convertFormalParameters,
  FunctionBody: convertFunctionBody,
  FunctionDeclaration: convertFunctionDeclaration,
  Script: convertScript,
  SpreadElement: convertSpreadElement,
  Super: convertSuper,
  SwitchCase: convertSwitchCase,
  SwitchDefault: convertSwitchDefault,
  TemplateElement: convertTemplateElement,
  VariableDeclaration: convertVariableDeclaration,
  VariableDeclarator: convertVariableDeclarator
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy90by1zcGlkZXJtb25rZXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7a0JBa0J3QixPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQVQsU0FBUyxPQUFULENBQWlCLEdBQWpCLEVBQXNCO0FBQ25DLE1BQUksT0FBTyxJQUFYLEVBQWlCO0FBQ2YsV0FBTyxJQUFQO0FBQ0Q7O0FBRUQsU0FBTyxRQUFRLElBQUksSUFBWixFQUFrQixHQUFsQixDQUFQO0FBQ0Q7O0FBRUQsU0FBUyx5QkFBVCxDQUFtQyxJQUFuQyxFQUF5QztBQUN2QyxTQUFPO0FBQ0wsVUFBTSxtQkFERDtBQUVMLFVBQU0sUUFBUSxLQUFLLE9BQWIsQ0FGRDtBQUdMLFdBQU8sUUFBUSxLQUFLLElBQWI7QUFIRixHQUFQO0FBS0Q7O0FBRUQsU0FBUyxtQkFBVCxDQUE2QixJQUE3QixFQUFtQztBQUNqQyxTQUFPO0FBQ0wsVUFBTSxnQkFERDtBQUVMLGdCQUFZLEtBQUssVUFBTCxHQUFrQixLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEIsQ0FBbEIsR0FBaUQsRUFGeEQ7QUFHTCxVQUFNLEtBQUssVUFBTCxHQUFrQixLQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEIsQ0FBbEIsR0FBaUQ7QUFIbEQsR0FBUDtBQUtEOztBQUVELFNBQVMsMEJBQVQsQ0FBb0MsSUFBcEMsRUFBMEM7QUFDeEMsU0FBTztBQUNMLFVBQU0scUJBREQ7QUFFTCxRQUFJLFFBQVEsS0FBSyxJQUFiLENBRkM7QUFHTCxZQUFRLHdCQUF3QixLQUFLLE1BQTdCLENBSEg7QUFJTCxVQUFNLFFBQVEsS0FBSyxJQUFiLENBSkQ7QUFLTCxlQUFXLEtBQUssV0FMWDtBQU1MLGdCQUFZO0FBTlAsR0FBUDtBQVFEOztBQUVELFNBQVMseUJBQVQsQ0FBbUMsSUFBbkMsRUFBeUM7QUFDdkMsU0FBTztBQUNMLFVBQU0sb0JBREQ7QUFFTCxRQUFJLFFBQVEsS0FBSyxJQUFiLENBRkM7QUFHTCxZQUFR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R0g7QUFxR2QsdUJBQXFCLDBCQXJHUDtBQXNHZCxzQkFBb0I7QUF0R04sQ0FBaEIiLCJmaWxlIjoidG8tc3BpZGVybW9ua2V5LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIGNvbnZlcnQgU2hpZnQgQVNUIGZvcm1hdCB0byBCYWJ5bG9uIEFTVCBmb3JtYXRcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydChhc3QpIHtcbiAgaWYgKGFzdCA9PSBudWxsKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gQ29udmVydFthc3QudHlwZV0oYXN0KTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpbmRpbmdXaXRoRGVmYXVsdChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJBc3NpZ25tZW50UGF0dGVyblwiLFxuICAgIGxlZnQ6IGNvbnZlcnQobm9kZS5iaW5kaW5nKSxcbiAgICByaWdodDogY29udmVydChub2RlLmluaXQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGdW5jdGlvbkJvZHkobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQmxvY2tTdGF0ZW1lbnRcIixcbiAgICBkaXJlY3RpdmVzOiBub2RlLmRpcmVjdGl2ZXMgPyBub2RlLmRpcmVjdGl2ZXMubWFwKGNvbnZlcnQpIDogW10sXG4gICAgYm9keTogbm9kZS5zdGF0ZW1lbnRzID8gbm9kZS5zdGF0ZW1lbnRzLm1hcChjb252ZXJ0KSA6IFtdXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGdW5jdGlvbkRlY2xhcmF0aW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkZ1bmN0aW9uRGVjbGFyYXRpb25cIixcbiAgICBpZDogY29udmVydChub2RlLm5hbWUpLFxuICAgIHBhcmFtczogY29udmVydEZvcm1hbFBhcmFtZXRlcnMobm9kZS5wYXJhbXMpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KSxcbiAgICBnZW5lcmF0b3I6IG5vZGUuaXNHZW5lcmF0b3IsXG4gICAgZXhwcmVzc2lvbjogZmFsc2VcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZ1bmN0aW9uRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJGdW5jdGlvbkV4cHJlc3Npb25cIixcbiAgICBpZDogY29udmVydChub2RlLm5hbWUpLFxuICAgIHBhcmFtczogY29udmVydEZvcm1hbFBhcmFtZXRlcnMobm9kZS5wYXJhbXMpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KSxcbiAgICBnZW5lcmF0b3I6IG5vZGUuaXNHZW5lcmF0b3IsXG4gICAgZXhwcmVzc2lvbjogZmFsc2VcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydE9iamVjdEV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiT2JqZWN0RXhwcmVzc2lvblwiLFxuICAgIHByb3BlcnRpZXM6IG5vZGUucHJvcGVydGllcy5tYXAoY29udmVydClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEdldHRlcihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJPYmplY3RNZXRob2RcIixcbiAgICBrZXk6IGNvbnZlcnQobm9kZS5uYW1lKSxcbiAgICBjb21wdXRlZDogZmFsc2UsXG4gICAgaWQ6IG51bGwsXG4gICAgcGFyYW1zOiBbXSxcbiAgICBib2R5OiBjb252ZXJ0RnVuY3Rpb25Cb2R5KG5vZGUuYm9keSksXG4gICAgZ2VuZXJhdG9yOiBmYWxzZSxcbiAgICBleHByZXNzaW9uOiBmYWxzZSxcbiAgICBtZXRob2Q6IGZhbHNlLFxuICAgIHNob3J0aGFuZDogZmFsc2UsXG4gICAga2luZDogXCJnZXRcIlxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U2V0dGVyKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdE1ldGhvZFwiLFxuICAgIGtleTogY29udmVydChub2RlLm5hbWUpLFxuICAgIGNvbXB1dGVkOiBub2RlLm5hbWUudHlwZSA9PT0gXCJDb21wdXRlZFByb3BlcnR5TmFtZVwiLFxuICAgIGlkOiBudWxsLFxuICAgIHBhcmFtczogW2NvbnZlcnQobm9kZS5wYXJhbSldLFxuICAgIGJvZHk6IGNvbnZlcnRGdW5jdGlvbkJvZHkobm9kZS5ib2R5KSxcbiAgICBnZW5lcmF0b3I6IGZhbHNlLFxuICAgIGV4cHJlc3Npb246IGZhbHNlLFxuICAgIG1ldGhvZDogZmFsc2UsXG4gICAgc2hvcnRoYW5kOiBmYWxzZSxcbiAgICBraW5kOiBcInNldFwiXG4gIH07XG59XG5mdW5jdGlvbiBjb252ZXJ0TWV0aG9kKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdE1ldGhvZFwiLFxuICAgIGtleTogY29udmVydChub2RlLm5hbWUpLFxuICAgIGNvbXB1dGVkOiBub2RlLm5hbWUudHlwZSA9PT0gXCJDb21wdXRlZFByb3BlcnR5TmFtZVwiLFxuICAgIGtpbmQ6IFwibWV0aG9kXCIsXG4gICAgbWV0aG9kOiB0cnVlLFxuICAgIHNob3J0aGFuZDogZmFsc2UsXG4gICAgaWQ6IG51bGwsXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhub2RlLnBhcmFtcyksXG4gICAgZ2VuZXJhdG9yOiBub2RlLmlzR2VuZXJhdG9yLFxuICAgIGV4cHJlc3Npb246IGZhbHNlLFxuICAgIGJvZHk6IGNvbnZlcnRGdW5jdGlvbkJvZHkobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RGF0YVByb3BlcnR5KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdFByb3BlcnR5XCIsXG4gICAga2V5OiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgdmFsdWU6IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKSxcbiAgICBjb21wdXRlZDogbm9kZS5uYW1lLnR5cGUgPT09IFwiQ29tcHV0ZWRQcm9wZXJ0eU5hbWVcIixcbiAgICBtZXRob2Q6IGZhbHNlLFxuICAgIHNob3J0aGFuZDogZmFsc2VcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENvbXB1dGVkUHJvcGVydHlOYW1lKG5vZGUpIHtcbiAgcmV0dXJuIGNvbnZlcnQobm9kZS5leHByZXNzaW9uKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFByb3BlcnR5TmFtZShub2RlKSB7XG4gIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgY2FzZSBcIlN0YXRpY1Byb3BlcnR5TmFtZVwiOlxuICAgICAgcmV0dXJuIGNvbnZlcnRTdGF0aWNQcm9wZXJ0eU5hbWUobm9kZSk7XG4gICAgY2FzZSBcIkNvbXB1dGVkUHJvcGVydHlOYW1lXCI6XG4gICAgICByZXR1cm4gY29udmVydENvbXB1dGVkUHJvcGVydHlOYW1lKG5vZGUpO1xuICAgIGNhc2UgXCJTaG9ydGhhbmRQcm9wZXJ0eVwiOlxuICAgICAgcmV0dXJuIGNvbnZlcnRTaG9ydGhhbmRQcm9wZXJ0eShub2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkJvb2xlYW5MaXRlcmFsXCIsXG4gICAgdmFsdWU6IG5vZGUudmFsdWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydExpdGVyYWxOdWxsRXhwcmVzc2lvbigpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk51bGxMaXRlcmFsXCJcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydExpdGVyYWxOdW1lcmljRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJOdW1lcmljTGl0ZXJhbFwiLFxuICAgIHZhbHVlOiBwYXJzZUZsb2F0KG5vZGUudmFsdWUpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRMaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkxpdGVyYWxcIixcbiAgICB2YWx1ZTogMSAvIDBcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydExpdGVyYWxSZWdFeHBFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlJlZ0V4cExpdGVyYWxcIixcbiAgICB2YWx1ZTogdW5kZWZpbmVkLFxuICAgIHBhdHRlcm46IG5vZGUucGF0dGVybixcbiAgICBmbGFnczogbm9kZS5mbGFnc1xuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiU3RyaW5nTGl0ZXJhbFwiLFxuICAgIHZhbHVlOiBub2RlLnZhbHVlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRBcnJheUV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQXJyYXlFeHByZXNzaW9uXCIsXG4gICAgZWxlbWVudHM6IG5vZGUuZWxlbWVudHMubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRBc3NpZ25tZW50RXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiLFxuICAgIG9wZXJhdG9yOiBcIj1cIixcbiAgICBsZWZ0OiBjb252ZXJ0KG5vZGUuYmluZGluZyksXG4gICAgcmlnaHQ6IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U2VxdWVuY2VFeHByZXNzaW9uVG9BcnJheShub2RlKSB7XG4gIGxldCBhcnJheSA9IFtdO1xuICBpZiAobm9kZS5sZWZ0LnR5cGUgPT09IFwiQmluYXJ5RXhwcmVzc2lvblwiICYmIG5vZGUubGVmdC5vcGVyYXRvciA9PT0gXCIsXCIpIHtcbiAgICBhcnJheSA9IGNvbnZlcnRTZXF1ZW5jZUV4cHJlc3Npb25Ub0FycmF5KG5vZGUubGVmdCk7XG4gIH0gZWxzZSB7XG4gICAgYXJyYXkgPSBbY29udmVydChub2RlLmxlZnQpXTtcbiAgfVxuICBhcnJheS5wdXNoKGNvbnZlcnQobm9kZS5yaWdodCkpO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCaW5hcnlFeHByZXNzaW9uKG5vZGUpIHtcbiAgaWYgKG5vZGUub3BlcmF0b3IgPT09IFwiLFwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiU2VxdWVuY2VFeHByZXNzaW9uXCIsXG4gICAgICBleHByZXNzaW9uczogY29udmVydFNlcXVlbmNlRXhwcmVzc2lvblRvQXJyYXkobm9kZSlcbiAgICB9O1xuICB9XG4gIHJldHVybiB7XG4gICAgdHlwZTogbm9kZS5vcGVyYXRvciA9PT0gXCJ8fFwiIHx8IG5vZGUub3BlcmF0b3IgPT09IFwiJiZcIiA/IFwiTG9naWNhbEV4cHJlc3Npb25cIiA6IFwiQmluYXJ5RXhwcmVzc2lvblwiLFxuICAgIG9wZXJhdG9yOiBub2RlLm9wZXJhdG9yLFxuICAgIGxlZnQ6IGNvbnZlcnQobm9kZS5sZWZ0KSxcbiAgICByaWdodDogY29udmVydChub2RlLnJpZ2h0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2FsbEV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQ2FsbEV4cHJlc3Npb25cIixcbiAgICBjYWxsZWU6IGNvbnZlcnQobm9kZS5jYWxsZWUpLFxuICAgIGFyZ3VtZW50czogbm9kZS5hcmd1bWVudHMubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDb21wdXRlZE1lbWJlckV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgIG9iamVjdDogY29udmVydChub2RlLm9iamVjdCksXG4gICAgcHJvcGVydHk6IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKSxcbiAgICBjb21wdXRlZDogdHJ1ZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q29uZGl0aW9uYWxFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiLFxuICAgIHRlc3Q6IGNvbnZlcnQobm9kZS50ZXN0KSxcbiAgICBhbHRlcm5hdGU6IGNvbnZlcnQobm9kZS5hbHRlcm5hdGUpLFxuICAgIGNvbnNlcXVlbnQ6IGNvbnZlcnQobm9kZS5jb25zZXF1ZW50KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVJZGVudGlmaWVyKG5hbWUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIklkZW50aWZpZXJcIixcbiAgICBuYW1lOiBuYW1lXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJZGVudGlmaWVyRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiBjcmVhdGVJZGVudGlmaWVyKG5vZGUubmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnROZXdFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk5ld0V4cHJlc3Npb25cIixcbiAgICBjYWxsZWU6IGNvbnZlcnQobm9kZS5jYWxsZWUpLFxuICAgIGFyZ3VtZW50czogbm9kZS5hcmd1bWVudHMubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTdGF0aWNNZW1iZXJFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk1lbWJlckV4cHJlc3Npb25cIixcbiAgICBvYmplY3Q6IGNvbnZlcnQobm9kZS5vYmplY3QpLFxuICAgIHByb3BlcnR5OiBjcmVhdGVJZGVudGlmaWVyKG5vZGUucHJvcGVydHkpLFxuICAgIGNvbXB1dGVkOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0VGhpc0V4cHJlc3Npb24oKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUaGlzRXhwcmVzc2lvblwiXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCbG9ja1N0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiBjb252ZXJ0QmxvY2sobm9kZS5ibG9jayk7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCcmVha1N0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJCcmVha1N0YXRlbWVudFwiLFxuICAgIGxhYmVsOiBjcmVhdGVJZGVudGlmaWVyKG5vZGUubGFiZWwpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDb250aW51ZVN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJDb250aW51ZVN0YXRlbWVudFwiLFxuICAgIGxhYmVsOiBub2RlLmxhYmVsID8gY3JlYXRlSWRlbnRpZmllcihub2RlLmxhYmVsKSA6IG51bGxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydERlYnVnZ2VyU3RhdGVtZW50KCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRGVidWdnZXJTdGF0ZW1lbnRcIlxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RG9XaGlsZVN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJEb1doaWxlU3RhdGVtZW50XCIsXG4gICAgdGVzdDogY29udmVydChub2RlLnRlc3QpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RW1wdHlTdGF0ZW1lbnQoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJFbXB0eVN0YXRlbWVudFwiXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHByZXNzaW9uU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIixcbiAgICBleHByZXNzaW9uOiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbilcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZvckluU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkZvckluU3RhdGVtZW50XCIsXG4gICAgbGVmdDogY29udmVydChub2RlLmxlZnQpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUucmlnaHQpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEZvclN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJGb3JTdGF0ZW1lbnRcIixcbiAgICBpbml0OiBjb252ZXJ0KG5vZGUuaW5pdCksXG4gICAgdGVzdDogY29udmVydChub2RlLnRlc3QpLFxuICAgIHVwZGF0ZTogY29udmVydChub2RlLnVwZGF0ZSksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJZlN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJJZlN0YXRlbWVudFwiLFxuICAgIHRlc3Q6IGNvbnZlcnQobm9kZS50ZXN0KSxcbiAgICBjb25zZXF1ZW50OiBjb252ZXJ0KG5vZGUuY29uc2VxdWVudCksXG4gICAgYWx0ZXJuYXRlOiBjb252ZXJ0KG5vZGUuYWx0ZXJuYXRlKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0TGFiZWxlZFN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJMYWJlbGVkU3RhdGVtZW50XCIsXG4gICAgbGFiZWw6IGNyZWF0ZUlkZW50aWZpZXIobm9kZS5sYWJlbCksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRSZXR1cm5TdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiUmV0dXJuU3RhdGVtZW50XCIsXG4gICAgYXJndW1lbnQ6IGNvbnZlcnQobm9kZS5leHByZXNzaW9uKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0U3dpdGNoU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlN3aXRjaFN0YXRlbWVudFwiLFxuICAgIGRpc2NyaW1pbmFudDogY29udmVydChub2RlLmRpc2NyaW1pbmFudCksXG4gICAgY2FzZXM6IG5vZGUuY2FzZXMubWFwKGNvbnZlcnQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTd2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJTd2l0Y2hTdGF0ZW1lbnRcIixcbiAgICBkaXNjcmltaW5hbnQ6IGNvbnZlcnQobm9kZS5kaXNjcmltaW5hbnQpLFxuICAgIGNhc2VzOiBub2RlLnByZURlZmF1bHRDYXNlcy5tYXAoY29udmVydCkuXG4gICAgICAgIGNvbmNhdChjb252ZXJ0KG5vZGUuZGVmYXVsdENhc2UpKS5cbiAgICAgICAgY29uY2F0KG5vZGUucG9zdERlZmF1bHRDYXNlcy5tYXAoY29udmVydCkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUaHJvd1N0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJUaHJvd1N0YXRlbWVudFwiLFxuICAgIGFyZ3VtZW50OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbilcbiAgfTtcbn1cblxuZnVuY3Rpb24gdG9UcnlTdGF0ZW1lbnQoY29udmVydEZpbmFsaXplciwgbm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVHJ5U3RhdGVtZW50XCIsXG4gICAgYmxvY2s6IGNvbnZlcnRCbG9jayhub2RlLmJvZHkpLFxuICAgIGhhbmRsZXI6IGNvbnZlcnQobm9kZS5jYXRjaENsYXVzZSksXG4gICAgZ3VhcmRlZEhhbmRsZXJzOiBbXSxcbiAgICBmaW5hbGl6ZXI6IGNvbnZlcnRGaW5hbGl6ZXIobm9kZS5maW5hbGl6ZXIpXG4gIH07XG59XG5cbmxldCBjb252ZXJ0VHJ5Q2F0Y2hTdGF0ZW1lbnQgPSB0b1RyeVN0YXRlbWVudC5iaW5kKG51bGwsICgpPT5udWxsKTtcblxubGV0IGNvbnZlcnRUcnlGaW5hbGx5U3RhdGVtZW50ID0gdG9UcnlTdGF0ZW1lbnQuYmluZChudWxsLCBjb252ZXJ0KTtcblxuZnVuY3Rpb24gY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4gY29udmVydChub2RlLmRlY2xhcmF0aW9uKTtcbn1cblxuZnVuY3Rpb24gY29udmVydFdoaWxlU3RhdGVtZW50KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIldoaWxlU3RhdGVtZW50XCIsXG4gICAgdGVzdDogY29udmVydChub2RlLnRlc3QpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0V2l0aFN0YXRlbWVudChub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJXaXRoU3RhdGVtZW50XCIsXG4gICAgb2JqZWN0OiBjb252ZXJ0KG5vZGUub2JqZWN0KSxcbiAgICBib2R5OiBjb252ZXJ0KG5vZGUuYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJsb2NrKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgZGlyZWN0aXZlczogW10sXG4gICAgYm9keTogbm9kZS5zdGF0ZW1lbnRzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2F0Y2hDbGF1c2Uobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQ2F0Y2hDbGF1c2VcIixcbiAgICBwYXJhbTogY29udmVydChub2RlLmJpbmRpbmcpLFxuICAgIGJvZHk6IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiB0b0ZpbGUoc291cmNlVHlwZSwgYm9keVByb3AsIG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkZpbGVcIixcbiAgICBwcm9ncmFtOiB7XG4gICAgICB0eXBlOiBcIlByb2dyYW1cIixcbiAgICAgIGRpcmVjdGl2ZXM6IG5vZGUuZGlyZWN0aXZlcy5tYXAoY29udmVydCksXG4gICAgICBib2R5OiBub2RlW2JvZHlQcm9wXS5tYXAoY29udmVydCksXG4gICAgICBzb3VyY2VUeXBlOiBzb3VyY2VUeXBlXG4gICAgfVxuICB9O1xufVxuXG5sZXQgY29udmVydFNjcmlwdCA9IHRvRmlsZS5iaW5kKG51bGwsIFwic2NyaXB0XCIsIFwic3RhdGVtZW50c1wiKTtcblxubGV0IGNvbnZlcnRNb2R1bGUgPSB0b0ZpbGUuYmluZChudWxsLCBcIm1vZHVsZVwiLCBcIml0ZW1zXCIpO1xuXG5mdW5jdGlvbiB0b1N3aXRjaENhc2UoY29udmVydENhc2UsIG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlN3aXRjaENhc2VcIixcbiAgICB0ZXN0OiBjb252ZXJ0Q2FzZShub2RlLnRlc3QpLFxuICAgIGNvbnNlcXVlbnQ6IG5vZGUuY29uc2VxdWVudC5tYXAoY29udmVydClcbiAgfTtcbn1cblxubGV0IGNvbnZlcnRTd2l0Y2hDYXNlID0gdG9Td2l0Y2hDYXNlLmJpbmQobnVsbCwgY29udmVydCk7XG5cbmxldCBjb252ZXJ0U3dpdGNoRGVmYXVsdCA9IHRvU3dpdGNoQ2FzZS5iaW5kKG51bGwsICgpPT5udWxsKTtcblxuZnVuY3Rpb24gY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiLFxuICAgIGRlY2xhcmF0aW9uczogbm9kZS5kZWNsYXJhdG9ycy5tYXAoY29udmVydCksXG4gICAga2luZDogbm9kZS5raW5kXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0b3Iobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdG9yXCIsXG4gICAgaWQ6IGNvbnZlcnQobm9kZS5iaW5kaW5nKSxcbiAgICBpbml0OiBjb252ZXJ0KG5vZGUuaW5pdClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpbmRpbmdJZGVudGlmaWVyKG5vZGUpIHtcbiAgcmV0dXJuIGNyZWF0ZUlkZW50aWZpZXIobm9kZS5uYW1lKTtcbn1cblxuZnVuY3Rpb24gY29udmVydERpcmVjdGl2ZShub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJEaXJlY3RpdmVcIixcbiAgICB2YWx1ZToge1xuICAgICAgdHlwZTogXCJEaXJlY3RpdmVMaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogbm9kZS5yYXdWYWx1ZVxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFVwZGF0ZUV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVXBkYXRlRXhwcmVzc2lvblwiLFxuICAgIHByZWZpeDogbm9kZS5pc1ByZWZpeCxcbiAgICBvcGVyYXRvcjogbm9kZS5vcGVyYXRvcixcbiAgICBhcmd1bWVudDogY29udmVydChub2RlLm9wZXJhbmQpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRVbmFyeUV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVW5hcnlFeHByZXNzaW9uXCIsXG4gICAgb3BlcmF0b3I6IG5vZGUub3BlcmF0b3IsXG4gICAgYXJndW1lbnQ6IGNvbnZlcnQobm9kZS5vcGVyYW5kKSxcbiAgICBwcmVmaXg6IHRydWVcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN0YXRpY1Byb3BlcnR5TmFtZShub2RlKSB7XG4gIGxldCB2YWx1ZSA9IHBhcnNlRmxvYXQobm9kZS52YWx1ZSkgfHwgbm9kZS52YWx1ZSxcbiAgICAgIHR5cGUgPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyBcIk51bWVyaWNMaXRlcmFsXCIgOiBcIlN0cmluZ0xpdGVyYWxcIjtcbiAgcmV0dXJuIHsgdHlwZSwgdmFsdWUgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydE5ld1RhcmdldEV4cHJlc3Npb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiTWV0YVByb3BlcnR5XCIsXG4gICAgbWV0YTogY3JlYXRlSWRlbnRpZmllcihcIm5ld1wiKSxcbiAgICBwcm9wZXJ0eTogY3JlYXRlSWRlbnRpZmllcihcInRhcmdldFwiKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Rm9yT2ZTdGF0ZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRm9yT2ZTdGF0ZW1lbnRcIixcbiAgICBsZWZ0OiBjb252ZXJ0KG5vZGUubGVmdCksXG4gICAgcmlnaHQ6IGNvbnZlcnQobm9kZS5yaWdodCksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUpIHtcbiAgbGV0IGtleSA9IGNvbnZlcnQobm9kZS5iaW5kaW5nKTtcbiAgbGV0IHZhbHVlID0gIW5vZGUuaW5pdCA/IGtleSA6XG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwiQXNzaWdubWVudFBhdHRlcm5cIixcbiAgICAgICAgbGVmdDoga2V5LFxuICAgICAgICByaWdodDogY29udmVydChub2RlLmluaXQpXG4gICAgICB9O1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiT2JqZWN0UHJvcGVydHlcIixcbiAgICBtZXRob2Q6IGZhbHNlLFxuICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICBzaG9ydGhhbmQ6IHRydWUsXG4gICAga2V5LFxuICAgIHZhbHVlXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRPYmplY3RCaW5kaW5nKG5vZGUpIHtcbiByZXR1cm4ge1xuICAgIHR5cGU6IFwiT2JqZWN0UGF0dGVyblwiLFxuICAgIHByb3BlcnRpZXM6IG5vZGUucHJvcGVydGllcy5tYXAoY29udmVydClcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydENsYXNzRGVjbGFyYXRpb24obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiQ2xhc3NEZWNsYXJhdGlvblwiLFxuICAgIGlkOiBjb252ZXJ0KG5vZGUubmFtZSksXG4gICAgc3VwZXJDbGFzczogY29udmVydChub2RlLnN1cGVyKSxcbiAgICBib2R5OiB7XG4gICAgICB0eXBlOiBcIkNsYXNzQm9keVwiLFxuICAgICAgYm9keTogbm9kZS5lbGVtZW50cy5tYXAoY29udmVydClcbiAgICB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDbGFzc0V4cHJlc3Npb24obm9kZSkge1xuICBsZXQgZXhwcmVzc2lvbiA9IGNvbnZlcnRDbGFzc0RlY2xhcmF0aW9uKG5vZGUpO1xuICBleHByZXNzaW9uLnR5cGUgPSBcIkNsYXNzRXhwcmVzc2lvblwiO1xuICByZXR1cm4gZXhwcmVzc2lvbjtcbn1cblxuZnVuY3Rpb24gY29udmVydEFycmF5QmluZGluZyhub2RlKSB7XG4gIGxldCBlbHRzID0gbm9kZS5lbGVtZW50cy5tYXAodiA9PiB7XG4gICAgaWYodi50eXBlID09PSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiKSB7XG4gICAgICByZXR1cm4gY29udmVydEJpbmRpbmdXaXRoRGVmYXVsdCh2KTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnZlcnQodik7XG4gIH0pO1xuICBpZihub2RlLnJlc3RFbGVtZW50KSBlbHRzLnB1c2goe1xuICAgIHR5cGU6IFwiUmVzdEVsZW1lbnRcIixcbiAgICBhcmd1bWVudDogY29udmVydChub2RlLnJlc3RFbGVtZW50KVxuICB9KTtcbiAgcmV0dXJuIHsgdHlwZTogXCJBcnJheVBhdHRlcm5cIiwgZWxlbWVudHM6IGVsdHMgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIk9iamVjdFByb3BlcnR5XCIsXG4gICAgY29tcHV0ZWQ6IGZhbHNlLFxuICAgIG1ldGhvZDogZmFsc2UsXG4gICAgc2hvcnRoYW5kOiBmYWxzZSxcbiAgICBrZXk6IGNvbnZlcnQobm9kZS5uYW1lKSxcbiAgICB2YWx1ZTogY29udmVydChub2RlLmJpbmRpbmcpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRBcnJvd0V4cHJlc3Npb24obm9kZSkgIHtcbiAgbGV0IGJvZHkgPSBjb252ZXJ0KG5vZGUuYm9keSk7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiLFxuICAgIGlkOiBudWxsLFxuICAgIGdlbmVyYXRvcjogZmFsc2UsXG4gICAgZXhwcmVzc2lvbjogYm9keS50eXBlICE9PSBcIkJsb2NrU3RhdGVtZW50XCIsXG4gICAgcGFyYW1zOiBjb252ZXJ0Rm9ybWFsUGFyYW1ldGVycyhub2RlLnBhcmFtcyksXG4gICAgYm9keTogY29udmVydChub2RlLmJvZHkpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRGb3JtYWxQYXJhbWV0ZXJzKHBzKSB7XG4gIGxldCBwYXJhbXMgPSBwcy5pdGVtcy5tYXAoY29udmVydCk7XG4gIGlmKHBzLml0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICBpZihwcy5yZXN0ICE9IG51bGwpIHtcbiAgICAgIHBhcmFtcy5wdXNoKHsgdHlwZTogXCJSZXN0RWxlbWVudFwiLCBhcmd1bWVudDogY29udmVydChwcy5yZXN0KSB9KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHBhcmFtcztcbn1cblxuZnVuY3Rpb24gY29udmVydENsYXNzRWxlbWVudChub2RlKSB7XG4gIGxldCBtID0gbm9kZS5tZXRob2Q7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJDbGFzc01ldGhvZFwiLFxuICAgIGtleTogY29udmVydChtLm5hbWUpLFxuICAgIGNvbXB1dGVkOiBtLm5hbWUudHlwZSA9PT0gXCJDb21wdXRlZFByb3BlcnR5TmFtZVwiLFxuICAgIGtpbmQ6IG0ubmFtZS52YWx1ZSA9PT0gXCJjb25zdHJ1Y3RvclwiID8gXCJjb25zdHJ1Y3RvclwiIDogXCJpbml0XCIsXG4gICAgc3RhdGljOiBub2RlLmlzU3RhdGljLFxuICAgIGlkOiBudWxsLFxuICAgIHBhcmFtczogY29udmVydEZvcm1hbFBhcmFtZXRlcnMobS5wYXJhbXMpLFxuICAgIGdlbmVyYXRvcjogbS5pc0dlbmVyYXRvcixcbiAgICBleHByZXNzaW9uOiBmYWxzZSxcbiAgICBib2R5OiBjb252ZXJ0KG0uYm9keSlcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFNwcmVhZEVsZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiU3ByZWFkRWxlbWVudFwiLFxuICAgIGFyZ3VtZW50OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbilcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFN1cGVyKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIlN1cGVyXCJcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFRlbXBsYXRlRXhwcmVzc2lvbihub2RlKSB7XG4gIGxldCBxdWFzaXMgPSBbXSxcbiAgICAgIGV4cHJlc3Npb25zID0gW107XG4gIG5vZGUuZWxlbWVudHMuZm9yRWFjaCgodixpKSA9PiB7XG4gICAgaWYoaSAlIDIgPT09IDApIHF1YXNpcy5wdXNoKGNvbnZlcnQodikpO1xuICAgIGVsc2UgZXhwcmVzc2lvbnMucHVzaChjb252ZXJ0KHYpKTtcbiAgfSk7XG4gIHF1YXNpc1txdWFzaXMubGVuZ3RoLTFdLnRhaWwgPSB0cnVlO1xuXG4gIGlmKG5vZGUudGFnICE9IG51bGwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJUYWdnZWRUZW1wbGF0ZUV4cHJlc3Npb25cIixcbiAgICAgIHRhZzogY29udmVydChub2RlLnRhZyksXG4gICAgICBxdWFzaToge1xuICAgICAgICB0eXBlOiBcIlRlbXBsYXRlTGl0ZXJhbFwiLFxuICAgICAgICBxdWFzaXMsXG4gICAgICAgIGV4cHJlc3Npb25zXG4gICAgICB9XG4gICAgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVGVtcGxhdGVMaXRlcmFsXCIsXG4gICAgcXVhc2lzLFxuICAgIGV4cHJlc3Npb25zXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRUZW1wbGF0ZUVsZW1lbnQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiVGVtcGxhdGVFbGVtZW50XCIsXG4gICAgdmFsdWU6IHtcbiAgICAgIHJhdzogbm9kZS5yYXdWYWx1ZSxcbiAgICAgIGNvb2tlZDogbm9kZS5yYXdWYWx1ZVxuICAgIH0sXG4gICAgdGFpbDogZmFsc2VcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydFlpZWxkRXhwcmVzc2lvbihub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJZaWVsZEV4cHJlc3Npb25cIixcbiAgICBhcmd1bWVudDogY29udmVydChub2RlLmV4cHJlc3Npb24pLFxuICAgIGRlbGVnYXRlOiBmYWxzZVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0WWllbGRHZW5lcmF0b3JFeHByZXNzaW9uKG5vZGUpIHtcbiAgbGV0IGV4cHIgPSBjb252ZXJ0WWllbGRFeHByZXNzaW9uKG5vZGUpO1xuICBleHByLmRlbGVnYXRlID0gdHJ1ZTtcbiAgcmV0dXJuIGV4cHI7XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRFeHBvcnRBbGxGcm9tKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkV4cG9ydEFsbERlY2xhcmF0aW9uXCIsXG4gICAgc291cmNlOiB7XG4gICAgICB0eXBlOiBcIlN0cmluZ0xpdGVyYWxcIixcbiAgICAgIHZhbHVlOiBub2RlLm1vZHVsZVNwZWNpZmllclxuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cG9ydEZyb20obm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwb3J0TmFtZWREZWNsYXJhdGlvblwiLFxuICAgIGRlY2xhcmF0aW9uOiBudWxsLFxuICAgIHNvdXJjZToge1xuICAgICAgdHlwZTogXCJTdHJpbmdMaXRlcmFsXCIsXG4gICAgICB2YWx1ZTogbm9kZS5tb2R1bGVTcGVjaWZpZXJcbiAgICB9LFxuICAgIHNwZWNpZmllcnM6IG5vZGUubmFtZWRFeHBvcnRzLm1hcChjb252ZXJ0KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0U3BlY2lmaWVyKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkV4cG9ydFNwZWNpZmllclwiLFxuICAgIGV4cG9ydGVkOiBjcmVhdGVJZGVudGlmaWVyKG5vZGUuZXhwb3J0ZWROYW1lKSxcbiAgICBsb2NhbDogY3JlYXRlSWRlbnRpZmllcihub2RlLm5hbWUgIT0gbnVsbCA/IG5vZGUubmFtZSA6IG5vZGUuZXhwb3J0ZWROYW1lKVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0RXhwb3J0KG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkV4cG9ydE5hbWVkRGVjbGFyYXRpb25cIixcbiAgICBkZWNsYXJhdGlvbjogY29udmVydChub2RlLmRlY2xhcmF0aW9uKSxcbiAgICBzcGVjaWZpZXJzOiBbXSxcbiAgICBzb3VyY2U6IG51bGxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY29udmVydEV4cG9ydERlZmF1bHQobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uXCIsXG4gICAgZGVjbGFyYXRpb246IGNvbnZlcnQobm9kZS5ib2R5KVxuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1wb3J0KG5vZGUpIHtcbiAgbGV0IHNwZWNpZmllcnMgPSBub2RlLm5hbWVkSW1wb3J0cy5tYXAoY29udmVydCk7XG4gIGlmKG5vZGUuZGVmYXVsdEJpbmRpbmcpXG4gICAgc3BlY2lmaWVycy51bnNoaWZ0KHtcbiAgICAgIHR5cGU6IFwiSW1wb3J0RGVmYXVsdFNwZWNpZmllclwiLFxuICAgICAgbG9jYWw6IGNvbnZlcnQobm9kZS5kZWZhdWx0QmluZGluZylcbiAgICB9KTtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkltcG9ydERlY2xhcmF0aW9uXCIsXG4gICAgc291cmNlOiB7XG4gICAgICB0eXBlOiBcIlN0cmluZ0xpdGVyYWxcIixcbiAgICAgIHZhbHVlOiBub2RlLm1vZHVsZVNwZWNpZmllclxuICAgIH0sXG4gICAgc3BlY2lmaWVyc1xuICB9O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0SW1wb3J0TmFtZXNwYWNlKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkltcG9ydERlY2xhcmF0aW9uXCIsXG4gICAgc291cmNlOiB7XG4gICAgICB0eXBlOiBcIlN0cmluZ0xpdGVyYWxcIixcbiAgICAgIHZhbHVlOiBub2RlLm1vZHVsZVNwZWNpZmllclxuICAgIH0sXG4gICAgc3BlY2lmaWVyczogW3tcbiAgICAgIHR5cGU6IFwiSW1wb3J0RGVmYXVsdFNwZWNpZmllclwiLFxuICAgICAgbG9jYWw6IGNvbnZlcnQobm9kZS5kZWZhdWx0QmluZGluZylcbiAgICB9LCB7XG4gICAgICB0eXBlOiBcIkltcG9ydE5hbWVzcGFjZVNwZWNpZmllclwiLFxuICAgICAgbG9jYWw6IGNvbnZlcnQobm9kZS5uYW1lc3BhY2VCaW5kaW5nKVxuICAgIH1dXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRJbXBvcnRTcGVjaWZpZXIobm9kZSkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6IFwiSW1wb3J0U3BlY2lmaWVyXCIsXG4gICAgbG9jYWw6IGNvbnZlcnQobm9kZS5iaW5kaW5nKSxcbiAgICBpbXBvcnRlZDogY3JlYXRlSWRlbnRpZmllcihub2RlLm5hbWUgfHwgbm9kZS5iaW5kaW5nLm5hbWUpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRTaG9ydGhhbmRQcm9wZXJ0eShub2RlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogXCJPYmplY3RQcm9wZXJ0eVwiLFxuICAgIHNob3J0aGFuZDogdHJ1ZSxcbiAgICBtZXRob2Q6IGZhbHNlLFxuICAgIGNvbXB1dGVkOiBmYWxzZSxcbiAgICBrZXk6IGNyZWF0ZUlkZW50aWZpZXIobm9kZS5uYW1lKSxcbiAgICB2YWx1ZTogY3JlYXRlSWRlbnRpZmllcihub2RlLm5hbWUpXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRDb21wb3VuZEFzc2lnbm1lbnRFeHByZXNzaW9uKG5vZGUpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCIsXG4gICAgb3BlcmF0b3I6IG5vZGUub3BlcmF0b3IsXG4gICAgbGVmdDogY29udmVydChub2RlLmJpbmRpbmcpLFxuICAgIHJpZ2h0OiBjb252ZXJ0KG5vZGUuZXhwcmVzc2lvbilcbiAgfTtcbn1cblxuY29uc3QgQ29udmVydCA9IHtcbiAgLy8gYmluZGluZ3NcbiAgQmluZGluZ1dpdGhEZWZhdWx0OiBjb252ZXJ0QmluZGluZ1dpdGhEZWZhdWx0LFxuICBCaW5kaW5nSWRlbnRpZmllcjogY29udmVydEJpbmRpbmdJZGVudGlmaWVyLFxuICBBcnJheUJpbmRpbmc6IGNvbnZlcnRBcnJheUJpbmRpbmcsXG4gIE9iamVjdEJpbmRpbmc6IGNvbnZlcnRPYmplY3RCaW5kaW5nLFxuICBCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyOiBjb252ZXJ0QmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcixcbiAgQmluZGluZ1Byb3BlcnR5UHJvcGVydHk6IGNvbnZlcnRCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eSxcblxuICAvLyBjbGFzc2VzXG4gIENsYXNzRXhwcmVzc2lvbjogY29udmVydENsYXNzRXhwcmVzc2lvbixcbiAgQ2xhc3NEZWNsYXJhdGlvbjogY29udmVydENsYXNzRGVjbGFyYXRpb24sXG4gIENsYXNzRWxlbWVudDogY29udmVydENsYXNzRWxlbWVudCxcblxuICAvLyBtb2R1bGVzXG4gIE1vZHVsZTogY29udmVydE1vZHVsZSxcbiAgSW1wb3J0OiBjb252ZXJ0SW1wb3J0LFxuICBJbXBvcnROYW1lc3BhY2U6IGNvbnZlcnRJbXBvcnROYW1lc3BhY2UsXG4gIEltcG9ydFNwZWNpZmllcjogY29udmVydEltcG9ydFNwZWNpZmllcixcbiAgRXhwb3J0QWxsRnJvbTogY29udmVydEV4cG9ydEFsbEZyb20sXG4gIEV4cG9ydEZyb206IGNvbnZlcnRFeHBvcnRGcm9tLFxuICBFeHBvcnQ6IGNvbnZlcnRFeHBvcnQsXG4gIEV4cG9ydERlZmF1bHQ6IGNvbnZlcnRFeHBvcnREZWZhdWx0LFxuICBFeHBvcnRTcGVjaWZpZXI6IGNvbnZlcnRFeHBvcnRTcGVjaWZpZXIsXG5cbiAgLy8gcHJvcGVydHkgZGVmaW5pdGlvblxuICBNZXRob2Q6IGNvbnZlcnRNZXRob2QsXG4gIEdldHRlcjogY29udmVydEdldHRlcixcbiAgU2V0dGVyOiBjb252ZXJ0U2V0dGVyLFxuICBEYXRhUHJvcGVydHk6IGNvbnZlcnREYXRhUHJvcGVydHksXG4gIFNob3J0aGFuZFByb3BlcnR5OiBjb252ZXJ0U2hvcnRoYW5kUHJvcGVydHksXG4gIENvbXB1dGVkUHJvcGVydHlOYW1lOiBjb252ZXJ0Q29tcHV0ZWRQcm9wZXJ0eU5hbWUsXG4gIFN0YXRpY1Byb3BlcnR5TmFtZTogY29udmVydFN0YXRpY1Byb3BlcnR5TmFtZSxcblxuICAvLyBsaXRlcmFsc1xuICBMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24sXG4gIExpdGVyYWxJbmZpbml0eUV4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uLFxuICBMaXRlcmFsTnVsbEV4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsTnVsbEV4cHJlc3Npb24sXG4gIExpdGVyYWxOdW1lcmljRXhwcmVzc2lvbjogY29udmVydExpdGVyYWxOdW1lcmljRXhwcmVzc2lvbixcbiAgTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsUmVnRXhwRXhwcmVzc2lvbixcbiAgTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb246IGNvbnZlcnRMaXRlcmFsU3RyaW5nRXhwcmVzc2lvbixcblxuICAvLyBvdGhlciBleHByZXNzaW9uc1xuICBBcnJheUV4cHJlc3Npb246IGNvbnZlcnRBcnJheUV4cHJlc3Npb24sXG4gIEFycm93RXhwcmVzc2lvbjogY29udmVydEFycm93RXhwcmVzc2lvbixcbiAgQXNzaWdubWVudEV4cHJlc3Npb246IGNvbnZlcnRBc3NpZ25tZW50RXhwcmVzc2lvbixcbiAgQmluYXJ5RXhwcmVzc2lvbjogY29udmVydEJpbmFyeUV4cHJlc3Npb24sXG4gIENhbGxFeHByZXNzaW9uOiBjb252ZXJ0Q2FsbEV4cHJlc3Npb24sXG4gIENvbXBvdW5kQXNzaWdubWVudEV4cHJlc3Npb246IGNvbnZlcnRDb21wb3VuZEFzc2lnbm1lbnRFeHByZXNzaW9uLFxuICBDb21wdXRlZE1lbWJlckV4cHJlc3Npb246IGNvbnZlcnRDb21wdXRlZE1lbWJlckV4cHJlc3Npb24sXG4gIENvbmRpdGlvbmFsRXhwcmVzc2lvbjogY29udmVydENvbmRpdGlvbmFsRXhwcmVzc2lvbixcbiAgRnVuY3Rpb25FeHByZXNzaW9uOiBjb252ZXJ0RnVuY3Rpb25FeHByZXNzaW9uLFxuICBJZGVudGlmaWVyRXhwcmVzc2lvbjogY29udmVydElkZW50aWZpZXJFeHByZXNzaW9uLFxuICBOZXdFeHByZXNzaW9uOiBjb252ZXJ0TmV3RXhwcmVzc2lvbixcbiAgTmV3VGFyZ2V0RXhwcmVzc2lvbjogY29udmVydE5ld1RhcmdldEV4cHJlc3Npb24sXG4gIE9iamVjdEV4cHJlc3Npb246IGNvbnZlcnRPYmplY3RFeHByZXNzaW9uLFxuICBVbmFyeUV4cHJlc3Npb246IGNvbnZlcnRVbmFyeUV4cHJlc3Npb24sXG4gIFN0YXRpY01lbWJlckV4cHJlc3Npb246IGNvbnZlcnRTdGF0aWNNZW1iZXJFeHByZXNzaW9uLFxuICBUZW1wbGF0ZUV4cHJlc3Npb246IGNvbnZlcnRUZW1wbGF0ZUV4cHJlc3Npb24sXG4gIFRoaXNFeHByZXNzaW9uOiBjb252ZXJ0VGhpc0V4cHJlc3Npb24sXG4gIFVwZGF0ZUV4cHJlc3Npb246IGNvbnZlcnRVcGRhdGVFeHByZXNzaW9uLFxuICBZaWVsZEV4cHJlc3Npb246IGNvbnZlcnRZaWVsZEV4cHJlc3Npb24sXG4gIFlpZWxkR2VuZXJhdG9yRXhwcmVzc2lvbjogY29udmVydFlpZWxkR2VuZXJhdG9yRXhwcmVzc2lvbixcblxuXG4gIC8vIG90aGVyIHN0YXRlbWVudHNcbiAgQmxvY2tTdGF0ZW1lbnQ6IGNvbnZlcnRCbG9ja1N0YXRlbWVudCxcbiAgQnJlYWtTdGF0ZW1lbnQ6IGNvbnZlcnRCcmVha1N0YXRlbWVudCxcbiAgQ29udGludWVTdGF0ZW1lbnQ6IGNvbnZlcnRDb250aW51ZVN0YXRlbWVudCxcbiAgRGVidWdnZXJTdGF0ZW1lbnQ6IGNvbnZlcnREZWJ1Z2dlclN0YXRlbWVudCxcbiAgRG9XaGlsZVN0YXRlbWVudDogY29udmVydERvV2hpbGVTdGF0ZW1lbnQsXG4gIEVtcHR5U3RhdGVtZW50OiBjb252ZXJ0RW1wdHlTdGF0ZW1lbnQsXG4gIEV4cHJlc3Npb25TdGF0ZW1lbnQ6IGNvbnZlcnRFeHByZXNzaW9uU3RhdGVtZW50LFxuICBGb3JJblN0YXRlbWVudDogY29udmVydEZvckluU3RhdGVtZW50LFxuICBGb3JPZlN0YXRlbWVudDogY29udmVydEZvck9mU3RhdGVtZW50LFxuICBGb3JTdGF0ZW1lbnQ6IGNvbnZlcnRGb3JTdGF0ZW1lbnQsXG4gIElmU3RhdGVtZW50OiBjb252ZXJ0SWZTdGF0ZW1lbnQsXG4gIExhYmVsZWRTdGF0ZW1lbnQ6IGNvbnZlcnRMYWJlbGVkU3RhdGVtZW50LFxuICBSZXR1cm5TdGF0ZW1lbnQ6IGNvbnZlcnRSZXR1cm5TdGF0ZW1lbnQsXG4gIFN3aXRjaFN0YXRlbWVudDogY29udmVydFN3aXRjaFN0YXRlbWVudCxcbiAgU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQ6IGNvbnZlcnRTd2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdCxcbiAgVGhyb3dTdGF0ZW1lbnQ6IGNvbnZlcnRUaHJvd1N0YXRlbWVudCxcbiAgVHJ5Q2F0Y2hTdGF0ZW1lbnQ6IGNvbnZlcnRUcnlDYXRjaFN0YXRlbWVudCxcbiAgVHJ5RmluYWxseVN0YXRlbWVudDogY29udmVydFRyeUZpbmFsbHlTdGF0ZW1lbnQsXG4gIFZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQ6IGNvbnZlcnRWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50LFxuICBXaGlsZVN0YXRlbWVudDogY29udmVydFdoaWxlU3RhdGVtZW50LFxuICBXaXRoU3RhdGVtZW50OiBjb252ZXJ0V2l0aFN0YXRlbWVudCxcblxuICAvLyBvdGhlciBub2Rlc1xuICBCbG9jazogY29udmVydEJsb2NrLFxuICBDYXRjaENsYXVzZTogY29udmVydENhdGNoQ2xhdXNlLFxuICBEaXJlY3RpdmU6IGNvbnZlcnREaXJlY3RpdmUsXG4gIEZvcm1hbFBhcmFtZXRlcnM6IGNvbnZlcnRGb3JtYWxQYXJhbWV0ZXJzLFxuICBGdW5jdGlvbkJvZHk6IGNvbnZlcnRGdW5jdGlvbkJvZHksXG4gIEZ1bmN0aW9uRGVjbGFyYXRpb246IGNvbnZlcnRGdW5jdGlvbkRlY2xhcmF0aW9uLFxuICBTY3JpcHQ6IGNvbnZlcnRTY3JpcHQsXG4gIFNwcmVhZEVsZW1lbnQ6IGNvbnZlcnRTcHJlYWRFbGVtZW50LFxuICBTdXBlcjogY29udmVydFN1cGVyLFxuICBTd2l0Y2hDYXNlOiBjb252ZXJ0U3dpdGNoQ2FzZSxcbiAgU3dpdGNoRGVmYXVsdDogY29udmVydFN3aXRjaERlZmF1bHQsXG4gIFRlbXBsYXRlRWxlbWVudDogY29udmVydFRlbXBsYXRlRWxlbWVudCxcbiAgVmFyaWFibGVEZWNsYXJhdGlvbjogY29udmVydFZhcmlhYmxlRGVjbGFyYXRpb24sXG4gIFZhcmlhYmxlRGVjbGFyYXRvcjogY29udmVydFZhcmlhYmxlRGVjbGFyYXRvclxufTtcblxuIl19
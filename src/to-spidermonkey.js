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

import {Identifier, LiteralStringExpression, LiteralNumericExpression} from "shift-ast";

// convert Shift AST format to SpiderMonkey AST format

export default function convert(ast) {
  if (ast == null) {
    return null;
  }

  if(Convert[ast.type] === convert) throw Error(`convert${ast.type} not implemented.`);

  return Convert[ast.type](ast);
}

function convertFunctionBody(node) {
  return node.directives.map(convert).concat(node.statements.map(convert));
}

function convertFunctionDeclaration(node) {
  return {
    type: "FunctionDeclaration",
    id: convert(node.name),
    params: node.params.map(convert),
    defaults: [],
    body: {
      type: "BlockStatement",
      body: convert(node.body)
    },
    generator: false,
    expression: false
  };
}

function convertFunctionExpression(node) {
  return {
    type: "FunctionExpression",
    id: convert(node.name),
    params: node.params.map(convert),
    defaults: [],
    body: {
      type: "BlockStatement",
      body: convert(node.body)
    },
    generator: false,
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
    type: "Property",
    key: convert(node.name),
    computed: false,
    value: convert(node.body),
    method: false,
    shorthand: false,
    kind: "get"
  };
}

function convertSetter(node) {
  return {
    type: "Property",
    key: convert(node.name),
    computed: false,
    value: convert(node.body),
    method: false,
    shorthand: false,
    kind: "set"
  };
}

function convertDataProperty(node) {
  return {
    type: "Property",
    key: convert(node.name),
    value: convert(node.expression),
    kind: "init",
    computed: node.name.type === "ComputedPropertyName",
    method: false,
    shorthand: false
  };
}

function convertComputedPropertyName(node) {
  return {
  };
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
    type: "Literal",
    value: node.value,
  };
}

function convertLiteralNullExpression() {
  return {
    type: "Literal",
    value: null,
  };
}

function convertLiteralNumericExpression(node) {
  return {
    type: "Literal",
    value: node.value,
  };
}

function convertLiteralInfinityExpression(node) {
  return {
    type: "Literal",
    value: 1 / 0,
  };
}

function convertLiteralRegExpExpression(node) {
  return {
    type: "Literal",
    value: RegExp(node.pattern, node.flags),
    regex: {
      pattern: node.pattern,
      flags: node.flags
    }
  };
}

function convertLiteralStringExpression(node) {
  return {
    type: "Literal",
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
  let array = [];
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

function convertIdentifierExpression(node) {
  return convert(node.name);
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
    property: convert(node.property),
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
    label: convert(node.label)
  };
}

function convertContinueStatement(node) {
  return {
    type: "ContinueStatement",
    label: convert(node.label)
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
    body: convert(node.body),
    each: false
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
    label: convertIdentifier(node.label),
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
    cases: node.preDefaultCases.map(convert).
        concat(convert(node.defaultCase)).
        concat(node.postDefaultCases.map(convert))
  };
}

function convertThrowStatement(node) {
  return {
    type: "ThrowStatement",
    argument: convert(node.expression)
  };
}

function convertTryCatchStatement(node) {
  let catchClause = convert(node.catchClause);
  return {
    type: "TryStatement",
    block: convertBlock(node.body),
    handlers: [catchClause],
    handler: catchClause,
    guardedHandlers: [],
    finalizer: null
  };
}

function convertTryFinallyStatement(node) {
  let catchClause = convert(node.catchClause);
  return {
    type: "TryStatement",
    block: convertBlock(node.body),
    handlers: [catchClause],
    handler: catchClause,
    guardedHandlers: [],
    finalizer: convert(node.finalizer)
  };
}

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

function convertIdentifier(node) {
  return {
    type: "Identifier",
    name: node.name
  };
}

function convertScript(node) {
  return {
    type: "Program",
    body: convertFunctionBody(node.statements),
    sourceType: node.scriptType === "module" ? "module" : "script"
  };
}

function convertSwitchCase(node) {
  return {
    type: "SwitchCase",
    test: convert(node.test),
    consequent: node.consequent.map(convert)
  };
}

function convertSwitchDefault(node) {
  return {
    type: "SwitchCase",
    test: null,
    consequent: node.consequent.map(convert)
  };
}

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
  return {
    type: "Identifier",
    name: node.name
  };
}

function convertDirective(node) {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "Literal",
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
  let valueType = typeof node.value;
  if(valueType === "string" || valueType === "number") {
    return {
      type: "Literal",
      value: node.value
    };
  } else {
    return {
      type: "Identifier",
      name: node.value
    };
  }
}

const Convert = {
  SourceLocation: convert,
  SourceSpan: convert,
  BindingWithDefault: convert,
  BindingIdentifier: convertBindingIdentifier,
  ArrayBinding: convert,
  ObjectBinding: convert,
  BindingPropertyIdentifier: convert,
  BindingPropertyProperty: convert,
  ClassExpression: convert,
  ClassElement: convert,
  Module: convert,
  Import: convert,
  ImportNamespace: convert,
  ImportSpecifier: convert,
  ExportAllFrom: convert,
  ExportFrom: convert,
  Export: convert,
  ExportDefault: convert,
  ExportSpecifier: convert,
  Method: convert,
  FunctionBody: convertFunctionBody,
  FunctionDeclaration: convertFunctionDeclaration,
  FunctionExpression: convertFunctionExpression,
  ObjectExpression: convertObjectExpression,
  Getter: convertGetter,
  Setter: convertSetter,
  DataProperty: convertDataProperty,
  ShorthandProperty: convert,
  ComputedPropertyName: convert,
  StaticPropertyName: convertStaticPropertyName,
  LiteralBooleanExpression: convertLiteralBooleanExpression,
  LiteralNullExpression: convertLiteralNullExpression,
  LiteralNumericExpression: convertLiteralNumericExpression,
  LiteralInfinityExpression: convertLiteralInfinityExpression,
  LiteralRegExpExpression: convertLiteralRegExpExpression,
  LiteralStringExpression: convertLiteralStringExpression,
  ArrayExpression: convertArrayExpression,
  ArrowExpression: convert,
  AssignmentExpression: convertAssignmentExpression,
  BinaryExpression: convertBinaryExpression,
  CallExpression: convertCallExpression,
  CompoundAssignmentExpression: convert,
  ComputedMemberExpression: convertComputedMemberExpression,
  ConditionalExpression: convertConditionalExpression,
  IdentifierExpression: convertIdentifierExpression,
  NewExpression: convertNewExpression,
  NewTargetExpression: convert,
  UnaryExpression: convertUnaryExpression,
  StaticMemberExpression: convertStaticMemberExpression,
  TemplateExpression: convert,
  ThisExpression: convertThisExpression,
  UpdateExpression: convertUpdateExpression,
  YieldExpression: convert,
  YieldGeneratorExpression: convert,
  BlockStatement: convertBlockStatement,
  BreakStatement: convertBreakStatement,
  ContinueStatement: convertContinueStatement,
  DebuggerStatement: convertDebuggerStatement,
  DoWhileStatement: convertDoWhileStatement,
  EmptyStatement: convertEmptyStatement,
  ExpressionStatement: convertExpressionStatement,
  ForInStatement: convertForInStatement,
  ForOfStatement: convert,
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
  Block: convertBlock,
  CatchClause: convertCatchClause,
  Directive: convertDirective,
  FormalParameters: convert,
  Script: convertScript,
  SpreadElement: convert,
  Super: convert,
  SwitchCase: convertSwitchCase,
  SwitchDefault: convertSwitchDefault,
  TemplateElement: convert,
  VariableDeclaration: convertVariableDeclaration,
  VariableDeclarator: convertVariableDeclarator
};

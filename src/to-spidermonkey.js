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
  return Convert[ast.type](ast);
}

function convertFunctionBody(node) {
  return node.directives.map(convert).concat(node.statements.map(convert))
}

function convertFunctionDeclaration(node) {
  return {
    type: "FunctionDeclaration",
    id: convert(node.name),
    params: node.parameters.map(convert),
    defaults: [],
    body: {
      type: "BlockStatement",
      body: convert(node.body)
    },
    rest: null,
    generator: false,
    expression: false
  };
}

function convertFunctionExpression(node) {
  return {
    type: "FunctionExpression",
    id: convert(node.name),
    params: node.parameters.map(convert),
    defaults: [],
    body: {
      type: "BlockStatement",
      body: convert(node.body)
    },
    rest: null,
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
    key: convertPropertyName(node.name),
    value: {
      type: "FunctionExpression",
      id: null,
      params: [],
      defaults: [],
      rest: null,
      body: {
        type: "BlockStatement",
        body: convertFunctionBody(node.body)
      },
      generator: false,
      expression: false
    },
    kind: "get"
  };
}

function convertSetter(node) {
  return {
    type: "Property",
    key: convertPropertyName(node.name),
    value: {
      type: "FunctionExpression",
      id: null,
      params: [convert(node.parameter)],
      defaults: [],
      rest: null,
      body: {
        type: "BlockStatement",
        body: convertFunctionBody(node.body)
      },
      generator: false,
      expression: false
    },
    kind: "set"
  };
}

function convertDataProperty(node) {
  return {
    type: "Property",
    key: convertPropertyName(node.name),
    value: convert(node.expression),
    kind: "init"
  };
}

function convertPropertyName(node) {
  switch (node.kind) {
    case "identifier":
      return convert(new Identifier(node.value));
    case "string":
      return convert(new LiteralStringExpression(node.value));
    case "number":
      return convert(new LiteralNumericExpression(+node.value));
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
  let idx = node.value.lastIndexOf('/');
  return {
    type: "Literal",
    value: RegExp(node.value.slice(1, idx), node.value.slice(idx + 1)),
  };
}

function convertLiteralStringExpression(node) {
  return {
    type: "Literal",
    value: node.value,
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
    operator: node.operator,
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
  return convert(node.identifier);
}

function convertNewExpression(node) {
  return {
    type: "NewExpression",
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  };
}

function convertPostfixExpression(node) {
  return {
    type: "UpdateExpression",
    operator: node.operator,
    argument: convert(node.operand),
    prefix: false
  };
}

function convertPrefixExpression(node) {
  if (node.operator === "++" || node.operator === "--") {
    return {
      type: "UpdateExpression",
      operator: node.operator,
      prefix: true,
      argument: convert(node.operand)
    }
  }
  return {
    type: "UnaryExpression",
    operator: node.operator,
    prefix: true,
    argument: convert(node.operand)
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
  return {
    type: "TryStatement",
    block: convertBlock(node.body),
    handlers: [convert(node.catchClause)],
    guardedHandlers: [],
    finalizer: null
  };
}

function convertTryFinallyStatement(node) {
  return {
    type: "TryStatement",
    block: convertBlock(node.body),
    handlers: [convert(node.catchClause)],
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

function convertUnknownDirective(node) {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "Literal",
      value: node.value,
    }
  };
}

function convertUseStrictDirective() {
  return {
    type: "ExpressionStatement",
    expression: {
      type: "Literal",
      value: "use strict",
    }
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
    body: convertFunctionBody(node.body)
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

const Convert = {
  FunctionBody: convertFunctionBody,
  FunctionDeclaration: convertFunctionDeclaration,
  FunctionExpression: convertFunctionExpression,
  ObjectExpression: convertObjectExpression,
  Getter: convertGetter,
  Setter: convertSetter,
  DataProperty: convertDataProperty,
  PropertyName: convertPropertyName,
  LiteralBooleanExpression: convertLiteralBooleanExpression,
  LiteralNullExpression: convertLiteralNullExpression,
  LiteralNumericExpression: convertLiteralNumericExpression,
  LiteralInfinityExpression: convertLiteralInfinityExpression,
  LiteralRegExpExpression: convertLiteralRegExpExpression,
  LiteralStringExpression: convertLiteralStringExpression,
  ArrayExpression: convertArrayExpression,
  AssignmentExpression: convertAssignmentExpression,
  BinaryExpression: convertBinaryExpression,
  CallExpression: convertCallExpression,
  ComputedMemberExpression: convertComputedMemberExpression,
  ConditionalExpression: convertConditionalExpression,
  IdentifierExpression: convertIdentifierExpression,
  NewExpression: convertNewExpression,
  PostfixExpression: convertPostfixExpression,
  PrefixExpression: convertPrefixExpression,
  StaticMemberExpression: convertStaticMemberExpression,
  ThisExpression: convertThisExpression,
  BlockStatement: convertBlockStatement,
  BreakStatement: convertBreakStatement,
  ContinueStatement: convertContinueStatement,
  DebuggerStatement: convertDebuggerStatement,
  DoWhileStatement: convertDoWhileStatement,
  EmptyStatement: convertEmptyStatement,
  ExpressionStatement: convertExpressionStatement,
  ForInStatement: convertForInStatement,
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
  UnknownDirective: convertUnknownDirective,
  UseStrictDirective: convertUseStrictDirective,
  Block: convertBlock,
  CatchClause: convertCatchClause,
  Identifier: convertIdentifier,
  Script: convertScript,
  SwitchCase: convertSwitchCase,
  SwitchDefault: convertSwitchDefault,
  VariableDeclaration: convertVariableDeclaration,
  VariableDeclarator: convertVariableDeclarator
};

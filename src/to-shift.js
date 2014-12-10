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

import * as Shift from "shift-ast";

// convert SpiderMonkey AST format to Shift AST format

export default function convert(node) {
  if (node == null) {
    return null;
  }
  return Convert[node.type](node);
}

function convertAssignmentExpression(node) {
  return new Shift.AssignmentExpression(node.operator, convert(node.left), convert(node.right));
}

function convertArrayExpression(node) {
  return new Shift.ArrayExpression(node.elements.map(convert));
}

function convertBinaryExpression(node) {
  return new Shift.BinaryExpression(node.operator, convert(node.left), convert(node.right));
}

function convertBlock(node) {
  return new Shift.Block(node.body.map(convert));
}

function convertBlockStatement(node) {
  return new Shift.BlockStatement(convertBlock(node));
}

function convertBreakStatement(node) {
  return new Shift.BreakStatement(convertIdentifier(node.label));
}

function convertCallExpression(node) {
  return new Shift.CallExpression(convert(node.callee), node.arguments.map(convert));
}

function convertCatchClause(node) {
  return new Shift.CatchClause(convertIdentifier(node.param), convertBlock(node.body));
}

function convertConditionalExpression(node) {
  return new Shift.ConditionalExpression(convert(node.test), convert(node.consequent), convert(node.alternate));
}

function convertContinueStatement(node) {
  return new Shift.ContinueStatement(convertIdentifier(node.label));
}

function convertDebuggerStatement() {
  return new Shift.DebuggerStatement();
}

function convertDoWhileStatement(node) {
  return new Shift.DoWhileStatement(convert(node.body), convert(node.test));
}

function convertEmptyStatement() {
  return new Shift.EmptyStatement();
}

function convertExpressionStatement(node) {
  return new Shift.ExpressionStatement(convert(node.expression));
}

function convertForStatement(node) {
  let init = node.init != null && node.init.type === "VariableDeclaration" ?
    convertVariableDeclaration(node.init) :
    convert(node.init);
  return new Shift.ForStatement(init, convert(node.test), convert(node.update), convert(node.body));
}

function convertForInStatement(node) {
  let left = node.left.type === "VariableDeclaration" ?
    convertVariableDeclaration(node.left) :
    convert(node.left);
  return new Shift.ForInStatement(left, convert(node.right), convert(node.body));
}

function convertFunctionDeclaration(node) {
  return new Shift.FunctionDeclaration(convertIdentifier(node.id), node.params.map(convertIdentifier), convertStatementsToFunctionBody(node.body.body));
}

function convertFunctionExpression(node) {
  return new Shift.FunctionExpression(convertIdentifier(node.id), node.params.map(convertIdentifier), convertStatementsToFunctionBody(node.body.body));
}

function convertIdentifier(node) {
  if (node === null) return null;
  return new Shift.Identifier(node.name);
}

function convertIdentifierExpression(node) {
  return new Shift.IdentifierExpression(convertIdentifier(node));
}

function convertIfStatement(node) {
  return new Shift.IfStatement(convert(node.test), convert(node.consequent), convert(node.alternate));
}

function convertLabeledStatement(node) {
  return new Shift.LabeledStatement(convertIdentifier(node.label), convert(node.body));
}

function convertLiteral(node) {
  switch (typeof node.value) {
    case "number":
      return new Shift.LiteralNumericExpression(node.value);
    case "string":
      return new Shift.LiteralStringExpression(node.value);
    case "boolean":
      return new Shift.LiteralBooleanExpression(node.value);
    default:
      if (node.value === null)
        return new Shift.LiteralNullExpression();
      else
        return new Shift.LiteralRegExpExpression(node.value.toString());
  }
}

function convertMemberExpression(node) {
  if (node.computed) {
    return new Shift.ComputedMemberExpression(convert(node.object), convert(node.property));
  } else {
    return new Shift.StaticMemberExpression(convert(node.object), convertIdentifier(node.property));
  }
}

function convertNewExpression(node) {
  return new Shift.NewExpression(convert(node.callee), node.arguments.map(convert));
}

function convertObjectExpression(node) {
  return new Shift.ObjectExpression(node.properties.map(convert));
}

function convertDirective(node) {
  node = node.expression;
  var value = node.value;
  return value === "use strict" ? new Shift.UseStrictDirective() : new Shift.UnknownDirective(value);
}

function convertStatementsToFunctionBody(stmts) {
  for (var i = 0; i < stmts.length; i++) {
    if (!(stmts[i].type === "ExpressionStatement" && stmts[i].expression.type === "Literal" && typeof stmts[i].expression.value === "string")) {
      break;
    }
  }
  return new Shift.FunctionBody(stmts.slice(0, i).map(convertDirective), stmts.slice(i).map(convert));
}

function convertProgram(node) {
  return new Shift.Script(convertStatementsToFunctionBody(node.body));
}

function convertPropertyName(literal) {
  if (literal.type === "Identifier") {
    return new Shift.PropertyName("identifier", literal.name);
  } else {
    return new Shift.PropertyName(typeof literal.value, literal.value.toString());
  }
}

function convertProperty(node) {
  switch (node.kind) {
    case "init":
      return new Shift.DataProperty(convertPropertyName(node.key), convert(node.value));
    case "get":
      return new Shift.Getter(convertPropertyName(node.key), convertStatementsToFunctionBody(node.value.body.body));
    case "set":
      return new Shift.Setter(convertPropertyName(node.key), convertIdentifier(node.value.params[0]), convertStatementsToFunctionBody(node.value.body.body));
  }
}

function convertReturnStatement(node) {
  return new Shift.ReturnStatement(convert(node.argument));
}

function convertSequenceExpression(node) {
  var expr = convert(node.expressions[0]);
  for (var i = 1; i < node.expressions.length; i++) {
    expr = new Shift.BinaryExpression(",", expr, convert(node.expressions[i]));
  }
  return expr;
}

function convertSwitchCase(node) {
  if (node.test) {
    return new Shift.SwitchCase(convert(node.test), node.consequent.map(convert));
  } else {
    return new Shift.SwitchDefault(node.consequent.map(convert));
  }
}

function convertSwitchStatement(node) {
  if (!node.cases.every((c) => c.test != null )) {
    var scs = node.cases.map(convertSwitchCase);
    for (var i = 0; i < scs.length; i++) {
      if (scs[i].type === "SwitchDefault") {
        break;
      }
    }
    return new Shift.SwitchStatementWithDefault(convert(node.discriminant), scs.slice(0, i), scs[i], scs.slice(i + 1));
  } else {
    return new Shift.SwitchStatement(convert(node.discriminant), node.cases.map(convertSwitchCase));
  }
}

function convertThisExpression() {
  return new Shift.ThisExpression();
}

function convertThrowStatement(node) {
  return new Shift.ThrowStatement(convert(node.argument));
}

function convertTryStatement(node) {
  if (node.finalizer != null) {
    return new Shift.TryFinallyStatement(convertBlock(node.block), convert(node.handlers[0]), convertBlock(node.finalizer));
  } else {
    return new Shift.TryCatchStatement(convertBlock(node.block), convert(node.handlers[0]));
  }
}

function convertUpdateExpression(node) {
  if (node.prefix) {
    return new Shift.PrefixExpression(node.operator, convert(node.argument));
  } else {
    return new Shift.PostfixExpression(convert(node.argument), node.operator);
  }
}

function convertUnaryExpression(node) {
  return new Shift.PrefixExpression(node.operator, convert(node.argument));
}

function convertVariableDeclaration(node) {
  return new Shift.VariableDeclaration(node.kind, node.declarations.map(convertVariableDeclarator));
}

function convertVariableDeclarationStatement(node) {
  return new Shift.VariableDeclarationStatement(convertVariableDeclaration(node));
}

function convertVariableDeclarator(node) {
  return new Shift.VariableDeclarator(convertIdentifier(node.id), convert(node.init));
}

function convertWhileStatement(node) {
  return new Shift.WhileStatement(convert(node.test), convert(node.body));
}

function convertWithStatement(node) {
  return new Shift.WithStatement(convert(node.object), convert(node.body));
}

const Convert = {
  AssignmentExpression: convertAssignmentExpression,
  ArrayExpression: convertArrayExpression,
  BlockStatement: convertBlockStatement,
  BinaryExpression: convertBinaryExpression,
  BreakStatement: convertBreakStatement,
  CallExpression: convertCallExpression,
  CatchClause: convertCatchClause,
  ConditionalExpression: convertConditionalExpression,
  ContinueStatement: convertContinueStatement,
  DoWhileStatement: convertDoWhileStatement,
  DebuggerStatement: convertDebuggerStatement,
  EmptyStatement: convertEmptyStatement,
  ExpressionStatement: convertExpressionStatement,
  ForStatement: convertForStatement,
  ForInStatement: convertForInStatement,
  FunctionDeclaration: convertFunctionDeclaration,
  FunctionExpression: convertFunctionExpression,
  Identifier: convertIdentifierExpression,
  IfStatement: convertIfStatement,
  Literal: convertLiteral,
  LabeledStatement: convertLabeledStatement,
  LogicalExpression: convertBinaryExpression,
  MemberExpression: convertMemberExpression,
  NewExpression: convertNewExpression,
  ObjectExpression: convertObjectExpression,
  Program: convertProgram,
  Property: convertProperty,
  ReturnStatement: convertReturnStatement,
  SequenceExpression: convertSequenceExpression,
  SwitchStatement: convertSwitchStatement,
  SwitchCase: convertSwitchCase,
  ThisExpression: convertThisExpression,
  ThrowStatement: convertThrowStatement,
  TryStatement: convertTryStatement,
  UnaryExpression: convertUnaryExpression,
  UpdateExpression: convertUpdateExpression,
  VariableDeclaration: convertVariableDeclarationStatement,
  VariableDeclarator: convertVariableDeclarator,
  WhileStatement: convertWhileStatement,
  WithStatement: convertWithStatement
};

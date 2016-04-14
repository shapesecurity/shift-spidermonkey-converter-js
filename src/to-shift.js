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

  if(Convert[node.type] === convert) throw Error(`convert${node.type} not implemented.`);

  return Convert[node.type](node);
}

function convertAssignmentExpression(node) {
  return new Shift.AssignmentExpression({
    binding: new Shift.BindingIdentifier({ name: node.left.name }),
    expression: convert(node.right)
  });
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
  return new Shift.BreakStatement({ label: convertIdentifier(node.label) });
}

function convertCallExpression(node) {
  return new Shift.CallExpression({
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  });
}

function convertCatchClause(node) {
  return new Shift.CatchClause({
    binding: convertIdentifier(node.param),
    body: convertBlock(node.body)
  });
}

function convertConditionalExpression(node) {
  return new Shift.ConditionalExpression({
    test: convert(node.test),
    consequent: convert(node.consequent),
    alternate: convert(node.alternate)
  });
}

function convertContinueStatement(node) {
  return new Shift.ContinueStatement({ label: convertIdentifier(node.label) });
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
  return new Shift.ExpressionStatement({ expression: convert(node.expression) });
}

function convertForStatement(node) {
  let init = node.init != null && node.init.type === "VariableDeclaration" ?
    convertVariableDeclaration(node.init) :
    convert(node.init);
  return new Shift.ForStatement({
    init: init,
    test: convert(node.test),
    update: convert(node.update),
    body: convert(node.body)
  });
}

function convertForInStatement(node) {
  let left = node.left.type === "VariableDeclaration" ?
    convertVariableDeclaration(node.left) :
    convert(node.left);
  return new Shift.ForInStatement({
    left: left,
    right: convert(node.right),
    body: convert(node.body)
  });
}

function convertFunctionDeclaration(node) {
  return new Shift.FunctionDeclaration({
    isGenerator: node.generator,
    name: convertIdentifier(node.id),
    params: node.params.map(convertIdentifier),
    body: convertStatementsToFunctionBody(node.body.body)
  });
}

function convertFunctionExpression(node) {
  return new Shift.FunctionExpression({
    isGenerator: node.generator,
    name: convertIdentifier(node.id),
    params: node.params.map(convertIdentifier),
    body: convertStatementsToFunctionBody(node.body.body)
  });
}

function convertIdentifier(node) {
  if (node === null) return null;
  return new Shift.BindingIdentifier({ name: node.name });
}

function convertIdentifierExpression(node) {
  return new Shift.IdentifierExpression({ name: convertIdentifier(node) });
}

function convertIfStatement(node) {
  return new Shift.IfStatement({
    test: convert(node.test),
    consequent: convert(node.consequent),
    alternate: convert(node.alternate)
  });
}

function convertLabeledStatement(node) {
  return new Shift.LabeledStatement({
    label: convertIdentifier(node.label),
    body: convert(node.body)
  });
}

function convertLiteral(node) {
  switch (typeof node.value) {
  case "number":
    if (node.value === 1 / 0) {
      return new Shift.LiteralInfinityExpression();
    }
    return new Shift.LiteralNumericExpression({value: node.value});
  case "string":
    return new Shift.LiteralStringExpression({value: node.value});
  case "boolean":
    return new Shift.LiteralBooleanExpression({value: node.value});
  default:
    if (node.value === null)
      return new Shift.LiteralNullExpression();
    else
      return new Shift.LiteralRegExpExpression({
        pattern: node.regex.pattern,
        flags: node.regex.flags
      });
  }
}

function convertMemberExpression(node) {
  if (node.computed) {
    return new Shift.ComputedMemberExpression({
      object: convert(node.object),
      expression: convert(node.property)
    });
  } else {
    return new Shift.StaticMemberExpression({
      object: convert(node.object),
      property: convertIdentifier(node.property)
    });
  }
}

function convertNewExpression(node) {
  return new Shift.NewExpression({
    callee: convert(node.callee),
    arguments: node.arguments.map(convert)
  });
}

function convertObjectExpression(node) {
  return new Shift.ObjectExpression({ properties: node.properties.map(convert) });
}

function convertDirective(node) {
  node = node.expression;
  var value = node.value;
  return new Shift.Directive({rawValue: value});
  //return value === "use strict" ? new Shift.UseStrictDirective() : new Shift.UnknownDirective(value);
}

function convertStatementsToFunctionBody(stmts) {
  for (var i = 0; i < stmts.length; i++) {
    if (!(stmts[i].type === "ExpressionStatement" && stmts[i].expression.type === "Literal" && typeof stmts[i].expression.value === "string")) {
      break;
    }
  }
  return new Shift.FunctionBody({
    directives: stmts.slice(0, i).map(convertDirective),
    statements: stmts.slice(i).map(convert)
  });
}

function convertProgram(node) {
  return new Shift.Script({
    directives: node.directives ? node.directives.map(convertDirective) : [],
    statements: convertStatementsToFunctionBody(node.body)
  });
}

function convertPropertyName(literal) {
  if (literal.type === "Literal") {
    return new Shift.StaticPropertyName({ value: literal.value });
  } else if(literal.type === "Identifier") {
    return new Shift.BindingIdentifier({ name: literal.name });
  } else {
    return new Shift.ComputedPropertyName({ expression: literal.value.toString() });
  }
}

function convertProperty(node) {
  switch (node.kind) {
  case "init":
    return new Shift.DataProperty({
      name: convertPropertyName(node.key),
      expression: convert(node.value)
    });
  case "get":
    return new Shift.Getter({
      name: convertPropertyName(node.key),
      body: convertFunctionExpression(node.value)
    });
  case "set":
    return new Shift.Setter({
      name: convertPropertyName(node.key),
      param: convertIdentifier(node.value.params[0]),
      body: convertFunctionExpression(node.value)
    });
  }
}

function convertReturnStatement(node) {
  return new Shift.ReturnStatement({ expression: convert(node.argument) });
}

function convertSequenceExpression(node) {
  var expr = convert(node.expressions[0]);
  for (var i = 1; i < node.expressions.length; i++) {
    expr = new Shift.BinaryExpression({
      operator: ",",
      left: expr,
      right: convert(node.expressions[i])
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
  } else {
    return new Shift.SwitchDefault({ consequent: node.consequent.map(convert) });
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
    return new Shift.SwitchStatementWithDefault({
      discriminant: convert(node.discriminant),
      preDefaultCases: scs.slice(0, i),
      defaultCase: scs[i],
      postDefaultCases: scs.slice(i + 1)
    });
  } else {
    return new Shift.SwitchStatement({
      discriminant: convert(node.discriminant),
      cases: node.cases.map(convertSwitchCase)
    });
  }
}

function convertThisExpression() {
  return new Shift.ThisExpression();
}

function convertThrowStatement(node) {
  return new Shift.ThrowStatement({ expression: convert(node.argument) });
}

function convertTryStatement(node) {
  if (node.finalizer != null) {
    return new Shift.TryFinallyStatement({
      body: convertBlock(node.block),
      catchClause: convertCatchClause(node.handler),
      finalizer: convertBlockStatement(node.finalizer)
    });
  } else {
    return new Shift.TryCatchStatement({
      body: convertBlock(node.block),
      catchClause: convertCatchClause(node.handler),
      handlers: node.handlers.map(convert)
    });
  }
}

function convertUpdateExpression(node) {
  return new Shift.UpdateExpression({
    isPrefix: node.prefix,
    operator: node.operator,
    operand: convert(node.argument)
  });
}

function convertUnaryExpression(node) {
  /*    return new Shift.UpdateExpression({
        isPrefix: node.prefix,
        operator: node.operator,
        operand: convert(node.argument)
        });*/
  return new Shift.UnaryExpression({
    operator: node.operator,
    operand: convert(node.argument)
  });
}

function convertVariableDeclaration(node) {
  return new Shift.VariableDeclaration({
    kind: node.kind,
    declarators: node.declarations.map(convertVariableDeclarator)
  });
}

function convertVariableDeclarationStatement(node) {
  return new Shift.VariableDeclarationStatement({ declaration: convertVariableDeclaration(node) });
}

function convertVariableDeclarator(node) {
  return new Shift.VariableDeclarator({
    binding: convertIdentifier(node.id),
    init: convert(node.init)
  });
}

function convertWhileStatement(node) {
  return new Shift.WhileStatement({ test: convert(node.test), body: convert(node.body) });
}

function convertWithStatement(node) {
  return new Shift.WithStatement({ object: convert(node.object), body: convert(node.body) });
}

const Convert = {
  AssignmentExpression: convertAssignmentExpression,
  AssignmentPattern: convert,
  ArrayExpression: convertArrayExpression,
  ArrayPattern: convert,
  ArrowFunctionExpression: convert,
  BlockStatement: convertBlockStatement,
  BinaryExpression: convertBinaryExpression,
  BreakStatement: convertBreakStatement,
  CallExpression: convertCallExpression,
  CatchClause: convertCatchClause,
  ClassBody: convert,
  ClassDeclaration: convert,
  ClassExpression: convert,
  ConditionalExpression: convertConditionalExpression,
  ContinueStatement: convertContinueStatement,
  DoWhileStatement: convertDoWhileStatement,
  DebuggerStatement: convertDebuggerStatement,
  EmptyStatement: convertEmptyStatement,
  ExportAllDeclaration: convert,
  ExportDefaultDeclaration: convert,
  ExportNamedDeclaration: convert,
  ExportSpecifier: convert,
  ExpressionStatement: convertExpressionStatement,
  ForStatement: convertForStatement,
  ForOfStatement: convert,
  ForInStatement: convertForInStatement,
  FunctionDeclaration: convertFunctionDeclaration,
  FunctionExpression: convertFunctionExpression,
  Identifier: convertIdentifierExpression,
  IfStatement: convertIfStatement,
  ImportDeclaration: convert,
  ImportDefaultSpecifier: convert,
  ImportNamespaceSpecifier: convert,
  ImportSpecifier: convert,
  Literal: convertLiteral,
  LabeledStatement: convertLabeledStatement,
  LogicalExpression: convertBinaryExpression,
  MemberExpression: convertMemberExpression,
  MetaProperty: convert,
  MethodDefinition: convert,
  NewExpression: convertNewExpression,
  ObjectExpression: convertObjectExpression,
  ObjectPattern: convert,
  Program: convertProgram,
  Property: convertProperty,
  RestElement: convert,
  ReturnStatement: convertReturnStatement,
  SequenceExpression: convertSequenceExpression,
  SpreadElement: convert,
  Super: convert,
  SwitchStatement: convertSwitchStatement,
  SwitchCase: convertSwitchCase,
  TaggedTemplateExpression: convert,
  TemplateElement: convert,
  TemplateLiteral: convert,
  ThisExpression: convertThisExpression,
  ThrowStatement: convertThrowStatement,
  TryStatement: convertTryStatement,
  UnaryExpression: convertUnaryExpression,
  UpdateExpression: convertUpdateExpression,
  VariableDeclaration: convertVariableDeclarationStatement,
  VariableDeclarator: convertVariableDeclarator,
  WhileStatement: convertWhileStatement,
  WithStatement: convertWithStatement,
  YieldExpression: convert
};

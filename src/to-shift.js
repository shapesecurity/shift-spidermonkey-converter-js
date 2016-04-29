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

function toBinding(node) {
  if(node == null) return null;
  switch(node.type) {
    case "Identifier": return new Shift.BindingIdentifier({ name: node.name });
    case "Property": if(node.shorthand) {
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
    default: return convert(node);
  }
}

function convertAssignmentExpression(node) {
  let binding = toBinding(node.left),
      expression = toExpression(node.right),
      operator = node.operator;
  if(operator === "=") return new Shift.AssignmentExpression({ binding, expression });
  else return new Shift.CompoundAssignmentExpression({ binding, expression, operator });
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
  if(node == null) return null;
  switch(node.type) {
    case "Literal": return convertLiteral(node);
    case "Identifier": return new Shift.IdentifierExpression({ name: node.name });
    case "MetaProperty": return new Shift.NewTargetExpression();
    case "TemplateLiteral": return convertTemplateLiteral(node);
    default: return convert(node);
  }
}

function toArgument(node) {
  if(node.type === "SpreadElement") {
    return convertSpreadElement(node);
  }
  return toExpression(node);
}

function convertCallExpression(node) {
  let callee = node.callee.type === "Super" ?
      convertSuper(node.callee) :
      toExpression(node.callee);
  return new Shift.CallExpression({ callee, arguments: node.arguments.map(toArgument) });
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
  let init = (node.init != null && node.init.type === "VariableDeclaration") ?
      convertVariableDeclaration(node.init, true) :
      toExpression(node.init);
  return new Shift.ForStatement({
    init,
    test: toExpression(node.test),
    update: toExpression(node.update),
    body: convert(node.body)
  });
}

function convertForInStatement(node) {
  let left = node.left.type === "VariableDeclaration" ?
      convertVariableDeclaration(node.left, true) :
      toBinding(node.left);
  return new Shift.ForInStatement({
    left,
    right: toExpression(node.right),
    body: convert(node.body)
  });
}

function convertForOfStatement(node) {
  let left = node.left.type === "VariableDeclaration" ?
      convertVariableDeclaration(node.left, true) :
      toBinding(node.left);
  return new Shift.ForOfStatement({
    left,
    right: toExpression(node.right),
    body: convert(node.body)
  });
}

function convertFunctionDeclaration(node) {
  return new Shift.FunctionDeclaration({
    isGenerator: node.generator,
    name: toBinding(node.id),
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: convertStatementsToFunctionBody(node.body.body)
  });
}

function convertFunctionExpression(node) {
  return new Shift.FunctionExpression({
    isGenerator: node.generator,
    name: toBinding(node.id),
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: convertStatementsToFunctionBody(node.body.body)
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
  switch (typeof node.value) {
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
      if (node.value === null)
        return new Shift.LiteralNullExpression();
      else
        return new Shift.LiteralRegExpExpression(node.regex);
  }
}

function convertMemberExpression(node) {
  let obj = node.object.type === "Super" ?
      convertSuper(node.object) :
      toExpression(node.object);

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
  return new Shift.ObjectExpression({ properties: node.properties.map(convert) });
}

function convertDirective(node) {
  node = node.expression;
  var value = node.value;
  return new Shift.Directive({rawValue: value});
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
  let directives = node.directives ? node.directives.map(convertDirective) : [],
      statements = node.body.map(convert);

  if(node.sourceType === "module") {
    return new Shift.Module({ directives, items: statements });
  }
  return new Shift.Script({ directives, statements });
}

function toPropertyName(node, computed) {
  if(computed) {
    return new Shift.ComputedPropertyName({ expression: toExpression(node)});
  } else {
    return new Shift.StaticPropertyName({
      value: (node.type === "Identifier") ? node.name : node.value.toString()
    });
  }
}

function toInitProperty(node) {
  let name = toPropertyName(node.key, node.computed);
  if(node.shorthand) {
    return new Shift.ShorthandProperty({ name: node.key.name });
  }
  return new Shift.DataProperty({ name, expression: toExpression(node.value)});
}

function toMethod(node) {
  return new Shift.Method({
    isGenerator: node.value.generator,
    name: toPropertyName(node.key, node.computed),
    body: convertStatementsToFunctionBody(node.value.body.body),
    params: new Shift.FormalParameters(convertFunctionParams(node.value))
  });
}

function toGetter(node) {
  return new Shift.Getter({
    name: toPropertyName(node.key, node.computed),
    body: convertStatementsToFunctionBody(node.value.body.body)
  });
}

function toSetter(node) {
  let params = convertFunctionParams(node.value);
  return new Shift.Setter({
    name: toPropertyName(node.key, node.computed),
    body: convertStatementsToFunctionBody(node.value.body.body),
    param: params.items[0] || params.rest
  });
}

function convertProperty(node) {
  switch (node.kind) {
    case "init": if(node.method) {
      return toMethod(node);
    } else {
      return toInitProperty(node);
    }
    case "get": return toGetter(node);
    case "set": return toSetter(node);
    default: throw Error(`Unknown kind of Property: ${node.kind}`);
  }
}

function convertReturnStatement(node) {
  return new Shift.ReturnStatement({ expression: convert(node.argument) });
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
  if (!node.cases.every((c) => c.test != null )) {
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
  return new Shift.ThrowStatement({ expression: convert(node.argument) });
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
      handlers: node.handlers.map(convert)
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
  let declaration = new Shift.VariableDeclaration({
    kind: node.kind,
    declarators: node.declarations.map(convertVariableDeclarator)
  });
  if(isDeclaration) return declaration;
  return new Shift.VariableDeclarationStatement({ declaration });
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
  if(node.meta === "new" && node.property === "target") {
    return new Shift.NewTargetExpression();
  }
  return null;
}

function convertObjectPattern(node) {
  return new Shift.ObjectBinding({ properties: node.properties.map(toBinding)});
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
  let {name,super:spr,elements} = convertClassDeclaration(node);
  return new Shift.ClassExpression({ name, super:spr, elements });
}

function convertClassBody(node) {
  return node.body.map(convert);
}

function convertRestElement(node) {
  return toBinding(node.argument);
}

function convertElements(elts) {
  let count = elts.length;
  if(count === 0) {
    return [[], null];
  } else if(elts[count-1].type === "RestElement") {
    return [elts.slice(0,count-1).map(toBinding), toBinding(elts[count-1])];
  } else {
    return [elts.map(toBinding), null];
  }
}

function convertArrayPattern(node) {
  let [elements, restElement] = convertElements(node.elements);
  return new Shift.ArrayBinding({ elements, restElement });
}

function convertArrowFunctionExpression(node) {
  return new Shift.ArrowExpression({
    params: new Shift.FormalParameters(convertFunctionParams(node)),
    body: node.expression ? convert(node.body) : convertStatementsToFunctionBody(node.body.body)
  });
}

function convertFunctionParams(node) {
  let [items, rest] = convertElements(node.params);
  if(node.defaults.length > 0) {
    items = items.map((v,i) => {
      let d = node.defaults[i];
      if(d != null) {
        return new Shift.BindingWithDefault({ binding: v, init: convert(d) });
      }
      return v;
    });
  }
  return { items, rest };
}

function convertMethodDefinition(node) {
  return new Shift.ClassElement({ isStatic: node.static, method: toMethod(node) });
}

function convertSuper(node) {
  return new Shift.Super();
}

function convertTaggedTemplateExpression(node) {
  let elts = [];
  node.quasi.quasis.forEach((e,i) => {
    elts.push(convertTemplateElement(e));
    if(i < node.quasi.expressions.length) elts.push(toExpression(node.quasi.expressions[i]));
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
  let elts = [];
  node.quasis.forEach((e,i) => {
    elts.push(convertTemplateElement(e));
    if(i < node.expressions.length) elts.push(toExpression(node.expressions[i]));
  });
  return new Shift.TemplateExpression({
    tag: tag != null ? convert(tag) : null,
    elements: elts
  });
}

function convertYieldExpression(node) {
  if(node.delegate) return new Shift.YieldGeneratorExpression({ expression: toExpression(node.argument) });
  return new Shift.YieldExpression({ expression: toExpression(node.argument) });
}

function convertExportAllDeclaration(node) {
  return new Shift.ExportAllFrom({ moduleSpecifier: node.source.value });
}

function convertExportNamedDeclaration(node) {
  if(node.declaration != null) {
    return new Shift.Export({
      kind: node.kind,
      declaration: (node.declaration.type === "VariableDeclaration") ?
        convertVariableDeclaration(node.declaration, true) :
        convert(node.declaration)
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
  let hasDefaultSpecifier = node.specifiers.some(s => s.type === "ImportDefaultSpecifier"),
      hasNamespaceSpecifier = node.specifiers.some(s => s.type === "ImportNamespaceSpecifier"),
      defaultBinding = hasDefaultSpecifier ? toBinding(node.specifiers[0]): null;

  if(hasNamespaceSpecifier) {
    return new Shift.ImportNamespace({
      moduleSpecifier: node.source.value,
      namespaceBinding: toBinding(node.specifiers[1]),
      defaultBinding
    });
  }

  let namedImports = node.specifiers.map(convert);
  if(hasDefaultSpecifier) namedImports.shift();
  return new Shift.Import({
    moduleSpecifier: node.source.value,
    namedImports,
    defaultBinding
  });
}

function convertImportDefaultSpecifier(node) {
  return toBinding(node.local);
}

function convertImportNamespaceSpecifier(node) {
  return toBinding(node.local);
}

function convertImportSpecifier(node) {
  return new Shift.ImportSpecifier({ name: node.imported.name, binding: toBinding(node.local) });
}

function convertSpreadElement(node) {
  return new Shift.SpreadElement({ expression: toExpression(node.argument)});
}

const Convert = {
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
  LabeledStatement: convertLabeledStatement,
  LogicalExpression: convertBinaryExpression,
  MemberExpression: convertMemberExpression,
  MetaProperty: convertMetaProperty,
  MethodDefinition: convertMethodDefinition,
  NewExpression: convertNewExpression,
  ObjectExpression: convertObjectExpression,
  ObjectPattern: convertObjectPattern,
  Program: convertProgram,
  Property: convertProperty,
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


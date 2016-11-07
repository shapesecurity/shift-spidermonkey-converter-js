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

const ShiftConverter = {
  convert(node) {
    if (node == null) {
      return null;
    }
    return this[`convert${node.type}`](node);
  },
  convertAssignmentExpression(node) {
    let binding = this.toBinding(node.left),
      expression = this.toExpression(node.right),
      operator = node.operator;
    if (operator === "=") return new Shift.AssignmentExpression({ binding, expression });
    else return new Shift.CompoundAssignmentExpression({ binding, expression, operator });
  },
  convertAssignmentPattern(node) {
    return new Shift.BindingWithDefault({
      binding: this.toBinding(node.left),
      init: this.convert(node.right)
    });
  },
  convertArrayExpression(node) {
    return new Shift.ArrayExpression({ elements: node.elements.map(this.convert.bind(this)) });
  },
  convertArrayPattern(node) {
    let [elements, restElement] = this.convertElements(node.elements);
    return new Shift.ArrayBinding({ elements, restElement });
  },
  convertArrowFunctionExpression(node) {
    return new Shift.ArrowExpression({
      params: new Shift.FormalParameters(this.convertFunctionParams(node)),
      body: node.expression ? this.toExpression(node.body) : this.convertStatementsToFunctionBody(node.body.body)
    });
  },
  convertBlockStatement(node) {
    return new Shift.BlockStatement({ block: this.convertBlock(node) });
  },
  convertBinaryExpression(node) {
    return new Shift.BinaryExpression({
      operator: node.operator,
      left: this.toExpression(node.left),
      right: this.toExpression(node.right)
    });
  },
  convertBreakStatement(node) {
    return new Shift.BreakStatement({ label: node.label ? node.label.name : null });
  },
  convertCallExpression(node) {
    let callee = node.callee.type === "Super" ?
      this.convertSuper(node.callee) :
      this.toExpression(node.callee);
    return new Shift.CallExpression({ callee, arguments: node.arguments.map(this.toArgument.bind(this)) });
  },
  convertCatchClause(node) {
    return new Shift.CatchClause({
      binding: this.toBinding(node.param),
      body: this.convertBlock(node.body)
    });
  },
  convertClassDeclaration(node) {
    return new Shift.ClassDeclaration({
      name: this.toBinding(node.id),
      super: this.toExpression(node.superClass),
      elements: this.convert(node.body)
    });
  },
  convertClassExpression(node) {
    let name = node.id == null ? null : this.toBinding(node.id);
    let spr = this.toExpression(node.superClass);
    let elements = this.convert(node.body);
    return new Shift.ClassExpression({ name, super: spr, elements });
  },
  convertClassBody(node) {
    return node.body.map(this.convert.bind(this));
  },
  convertConditionalExpression(node) {
    return new Shift.ConditionalExpression({
      test: this.toExpression(node.test),
      consequent: this.toExpression(node.consequent),
      alternate: this.toExpression(node.alternate)
    });
  },
  convertContinueStatement(node) {
    return new Shift.ContinueStatement({ label: node.label ? node.label.name : null });
  },
  convertDoWhileStatement(node) {
    return new Shift.DoWhileStatement({
      body: this.convert(node.body),
      test: this.convert(node.test)
    });
  },
  convertDebuggerStatement() {
    return new Shift.DebuggerStatement();
  },
  convertEmptyStatement() {
    return new Shift.EmptyStatement();
  },
  convertExportAllDeclaration(node) {
    return new Shift.ExportAllFrom({ moduleSpecifier: node.source.value });
  },
  convertExportDefaultDeclaration(node) {
    return new Shift.ExportDefault({ body: this.convert(node.declaration) });
  },
  convertExportNamedDeclaration(node) {
    if (node.declaration != null) {
      return new Shift.Export({
        declaration: (node.declaration.type === "VariableDeclaration") ?
          this.convertVariableDeclaration(node.declaration, true) :
          this.convert(node.declaration)
      });
    }

    return new Shift.ExportFrom({
      moduleSpecifier: node.source != null ? node.source.value : null,
      namedExports: node.specifiers.map(this.convert.bind(this))
    });
  },
  convertExportSpecifier(node) {
    return new Shift.ExportSpecifier({
      exportedName: node.exported.name,
      name: node.local.name !== node.exported.name ? node.local.name : null
    });
  },
  convertExpressionStatement(node) {
    return new Shift.ExpressionStatement({ expression: this.toExpression(node.expression) });
  },
  convertForStatement(node) {
    let init = (node.init != null && node.init.type === "VariableDeclaration") ?
      this.convertVariableDeclaration(node.init, true) :
      this.toExpression(node.init);
    return new Shift.ForStatement({
      init,
      test: this.toExpression(node.test),
      update: this.toExpression(node.update),
      body: this.convert(node.body)
    });
  },
  convertForOfStatement(node) {
    let left = node.left.type === "VariableDeclaration" ?
      this.convertVariableDeclaration(node.left, true) :
      this.toBinding(node.left);
    return new Shift.ForOfStatement({
      left,
      right: this.toExpression(node.right),
      body: this.convert(node.body)
    });
  },
  convertForInStatement(node) {
    let left = node.left.type === "VariableDeclaration" ?
      this.convertVariableDeclaration(node.left, true) :
      this.toBinding(node.left);
    return new Shift.ForInStatement({
      left,
      right: this.toExpression(node.right),
      body: this.convert(node.body)
    });
  },
  convertFunctionDeclaration(node) {
    return new Shift.FunctionDeclaration({
      isGenerator: node.generator,
      name: this.toBinding(node.id),
      params: new Shift.FormalParameters(this.convertFunctionParams(node)),
      body: this.convertStatementsToFunctionBody(node.body.body)
    });
  },
  convertFunctionExpression(node) {
    return new Shift.FunctionExpression({
      isGenerator: node.generator,
      name: this.toBinding(node.id),
      params: new Shift.FormalParameters(this.convertFunctionParams(node)),
      body: this.convertStatementsToFunctionBody(node.body.body)
    });
  },
  convertIfStatement(node) {
    return new Shift.IfStatement({
      test: this.toExpression(node.test),
      consequent: this.convert(node.consequent),
      alternate: this.convert(node.alternate)
    });
  },
  convertImportDeclaration(node) {
    let hasDefaultSpecifier = node.specifiers.some(s => s.type === "ImportDefaultSpecifier");
    if (node.specifiers.some(s => s.type === "ImportNamespaceSpecifier"))
      return this.toImportNamespace(node, hasDefaultSpecifier);

    let namedImports = node.specifiers.map(this.convert.bind(this));
    if (hasDefaultSpecifier) namedImports.shift();
    return new Shift.Import({
      moduleSpecifier: node.source.value,
      namedImports,
      defaultBinding: hasDefaultSpecifier ? this.toBinding(node.specifiers[0]) : null
    });
  },
  convertImportDefaultSpecifier(node) {
    return this.toBinding(node.local);
  },
  convertImportNamespaceSpecifier(node) {
    return this.toBinding(node.local);
  },
  convertImportSpecifier(node) {
    return new Shift.ImportSpecifier({ name: node.imported.name, binding: this.toBinding(node.local) });
  },
  convertLiteral(node) {
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
        if (node.hasOwnProperty("regex")) {
          return new Shift.LiteralRegExpExpression(node.regex);
        } else {
          return new Shift.LiteralNullExpression();
        }
    }
  },
  convertLabeledStatement(node) {
    return new Shift.LabeledStatement({
      label: node.label.name,
      body: this.convert(node.body)
    });
  },
  convertLogicalExpression(node) {
    return this.convertBinaryExpression(node);
  },
  convertMemberExpression(node) {
    let obj = node.object.type === "Super" ?
      this.convertSuper(node.object) :
      this.toExpression(node.object);

    if (node.computed) {
      return new Shift.ComputedMemberExpression({
        object: obj,
        expression: this.toExpression(node.property)
      });
    } else {
      return new Shift.StaticMemberExpression({
        object: obj,
        property: node.property.name
      });
    }
  },
  convertMetaProperty(node) {
    if (node.meta === "new" && node.property === "target") {
      return new Shift.NewTargetExpression();
    }
    return null;
  },
  convertMethodDefinition(node) {
    return new Shift.ClassElement({ isStatic: node.static, method: this.toMethod(node) });
  },
  convertNewExpression(node) {
    return new Shift.NewExpression({
      callee: this.toArgument(node.callee),
      arguments: node.arguments.map(this.toArgument.bind(this))
    });
  },
  convertObjectExpression(node) {
    return new Shift.ObjectExpression({ properties: node.properties.map(this.convert.bind(this)) });
  },
  convertObjectPattern(node) {
    return new Shift.ObjectBinding({ properties: node.properties.map(this.toBinding.bind(this)) });
  },
  convertProgram(node) {
    let directives = node.directives ? node.directives.map(this.convertDirective.bind(this)) : [],
      statements = node.body.map(this.convert.bind(this));

    if (node.sourceType === "module") {
      return new Shift.Module({ directives, items: statements });
    }
    return new Shift.Script({ directives, statements });
  },
  convertProperty(node) {
    switch (node.kind) {
      case "init": if (node.method) {
        return this.toMethod(node);
      } else {
        return this.toInitProperty(node);
      }
      case "get": return this.toGetter(node);
      case "set": return this.toSetter(node);
      default: throw Error(`Unknown kind of Property: ${node.kind}`);
    }
  },
  convertRestElement(node) {
    return this.toBinding(node.argument);
  },
  convertReturnStatement(node) {
    return new Shift.ReturnStatement({ expression: this.toExpression(node.argument) });
  },
  convertSequenceExpression(node) {
    var expr = this.toExpression(node.expressions[0]);
    for (var i = 1; i < node.expressions.length; i++) {
      expr = new Shift.BinaryExpression({
        operator: ",",
        left: expr,
        right: this.toExpression(node.expressions[i])
      });
    }
    return expr;
  },
  convertSpreadElement(node) {
    return new Shift.SpreadElement({ expression: this.toExpression(node.argument) });
  },
  convertSuper() {
    return new Shift.Super();
  },
  convertSwitchCase(node) {
    if (node.test) {
      return new Shift.SwitchCase({
        test: this.convert(node.test),
        consequent: node.consequent.map(this.convert.bind(this))
      });
    }
    return new Shift.SwitchDefault({ consequent: node.consequent.map(this.convert.bind(this)) });
  },
  convertSwitchStatement(node) {
    if (!node.cases.every((c) => c.test != null)) {
      var scs = node.cases.map(this.convertSwitchCase.bind(this));
      for (var i = 0; i < scs.length; i++) {
        if (scs[i].type === "SwitchDefault") {
          break;
        }
      }
      return new Shift.SwitchStatementWithDefault({
        discriminant: this.toExpression(node.discriminant),
        preDefaultCases: scs.slice(0, i),
        defaultCase: scs[i],
        postDefaultCases: scs.slice(i + 1)
      });
    } else {
      return new Shift.SwitchStatement({
        discriminant: this.toExpression(node.discriminant),
        cases: node.cases.map(this.convertSwitchCase.bind(this))
      });
    }
  },
  convertTaggedTemplateExpression(node) {
    let elts = [];
    node.quasi.quasis.forEach((e, i) => {
      elts.push(this.convertTemplateElement(e));
      if (i < node.quasi.expressions.length) elts.push(this.toExpression(node.quasi.expressions[i]));
    });
    return new Shift.TemplateExpression({
      tag: this.toExpression(node.tag),
      elements: elts
    });
  },
  convertTemplateElement(node) {
    return new Shift.TemplateElement({ rawValue: node.value.raw });
  },
  convertTemplateLiteral(node, tag) {
    let elts = [];
    node.quasis.forEach((e, i) => {
      elts.push(this.convertTemplateElement(e));
      if (i < node.expressions.length) elts.push(this.toExpression(node.expressions[i]));
    });
    return new Shift.TemplateExpression({
      tag: tag != null ? this.convert(tag) : null,
      elements: elts
    });
  },
  convertThisExpression() {
    return new Shift.ThisExpression();
  },
  convertThrowStatement(node) {
    return new Shift.ThrowStatement({ expression: this.toExpression(node.argument) });
  },
  convertTryStatement(node) {
    if (node.finalizer == null) {
      return new Shift.TryCatchStatement({
        body: this.convertBlock(node.block),
        catchClause: this.convertCatchClause(node.handler)
      });
    } else if (node.handler == null) {
      return new Shift.TryFinallyStatement({
        body: this.convertBlock(node.block),
        catchClause: null,
        finalizer: this.convertBlock(node.finalizer)
      });
    } else {
      return new Shift.TryFinallyStatement({
        body: this.convertBlock(node.block),
        catchClause: this.convertCatchClause(node.handler),
        finalizer: this.convertBlock(node.finalizer)
      });
    }
  },
  convertUnaryExpression(node) {
    return new Shift.UnaryExpression({
      operator: node.operator,
      operand: this.toExpression(node.argument)
    });
  },
  convertUpdateExpression(node) {
    return new Shift.UpdateExpression({
      isPrefix: node.prefix,
      operator: node.operator,
      operand: this.toBinding(node.argument)
    });
  },
  convertVariableDeclaration(node, isDeclaration) {
    let declaration = new Shift.VariableDeclaration({
      kind: node.kind,
      declarators: node.declarations.map(this.convertVariableDeclarator.bind(this))
    });
    if (isDeclaration) return declaration;
    return new Shift.VariableDeclarationStatement({ declaration });
  },
  convertVariableDeclarator(node) {
    return new Shift.VariableDeclarator({
      binding: this.toBinding(node.id),
      init: this.convert(node.init)
    });
  },
  convertWhileStatement(node) {
    return new Shift.WhileStatement({ test: this.convert(node.test), body: this.convert(node.body) });
  },
  convertWithStatement(node) {
    return new Shift.WithStatement({ object: this.convert(node.object), body: this.convert(node.body) });
  },
  convertYieldExpression(node) {
    if (node.delegate) return new Shift.YieldGeneratorExpression({ expression: this.toExpression(node.argument) });
    return new Shift.YieldExpression({ expression: this.toExpression(node.argument) });
  },

  // auxiliary methods
  toBinding(node) {
    if (node == null) return null;
    switch (node.type) {
      case "Identifier": return new Shift.BindingIdentifier({ name: node.name });
      case "Property": if (node.shorthand) {
        return new Shift.BindingPropertyIdentifier({
          binding: this.toBinding(node.key),
          init: this.toExpression(node.value.right)
        });
      } else {
        return new Shift.BindingPropertyProperty({
          name: this.toPropertyName(node.key, node.computed),
          binding: this.toBinding(node.value)
        });
      }
      default: return this.convert(node);
    }
  },
  convertBlock(node) {
    return new Shift.Block({ statements: node.body.map(this.convert.bind(this)) });
  },
  toExpression(node) {
    if (node == null) return null;
    switch (node.type) {
      case "Literal": return this.convertLiteral(node);
      case "Identifier": return new Shift.IdentifierExpression({ name: node.name });
      case "MetaProperty": return new Shift.NewTargetExpression();
      case "TemplateLiteral": return this.convertTemplateLiteral(node);
      default: return this.convert(node);
    }
  },
  toArgument(node) {
    if (node.type === "SpreadElement") {
      return this.convertSpreadElement(node);
    }
    return this.toExpression(node);
  },
  convertDirective(node) {
    node = node.expression;
    return new Shift.Directive({ rawValue: node.value });
  },
  convertStatementsToFunctionBody(stmts) {
    for (var i = 0; i < stmts.length; i++) {
      if (!stmts[i].hasOwnProperty("directive")) {
        break;
      }
    }
    return new Shift.FunctionBody({
      directives: stmts.slice(0, i).map(this.convertDirective.bind(this)),
      statements: stmts.slice(i).map(this.convert.bind(this))
    });
  },
  toPropertyName(node, computed) {
    if (computed) {
      return new Shift.ComputedPropertyName({ expression: this.toExpression(node) });
    } else {
      return new Shift.StaticPropertyName({
        value: (node.type === "Identifier") ? node.name : node.value.toString()
      });
    }
  },
  toInitProperty(node) {
    let name = this.toPropertyName(node.key, node.computed);
    if (node.shorthand) {
      return new Shift.ShorthandProperty({ name: node.key.name });
    }
    return new Shift.DataProperty({ name, expression: this.toExpression(node.value) });
  },
  toMethod(node) {
    let name = this.toPropertyName(node.key, node.computed);
    let body = this.convertStatementsToFunctionBody(node.value.body.body);
    switch (node.kind) {
      case "method":
      case "constructor":
      case "init":
        return new Shift.Method({
          isGenerator: node.value.generator,
          name,
          params: new Shift.FormalParameters(this.convertFunctionParams(node.value)),
          body
        });
      case "get":
        return new Shift.Getter({
          name,
          body
        });
      case "set":
        return new Shift.Setter({
          name,
          param: this.convertFunctionParams(node.value).items[0],
          body
        });
    }
  },
  toGetter(node) {
    return new Shift.Getter({
      name: this.toPropertyName(node.key, node.computed),
      body: this.convertStatementsToFunctionBody(node.value.body.body)
    });
  },
  toSetter(node) {
    let params = this.convertFunctionParams(node.value);
    return new Shift.Setter({
      name: this.toPropertyName(node.key, node.computed),
      body: this.convertStatementsToFunctionBody(node.value.body.body),
      param: params.items[0] || params.rest
    });
  },
  convertElements(elts) {
    let count = elts.length;
    if (count === 0) {
      return [[], null];
    } else if (elts[count - 1] !== null && elts[count - 1].type === "RestElement") {
      return [elts.slice(0, count - 1).map(this.toBinding.bind(this)), this.toBinding(elts[count - 1])];
    } else {
      return [elts.map(this.toBinding.bind(this)), null];
    }
  },
  convertFunctionParams(node) {
    let [items, rest] = this.convertElements(node.params);
    if (node.defaults.length > 0) {
      items = items.map((v, i) => {
        let d = node.defaults[i];
        if (d != null) {
          return new Shift.BindingWithDefault({ binding: v, init: this.convert(d) });
        }
        return v;
      });
    }
    return { items, rest };
  },
  toImportNamespace(node, hasDefaultSpecifier) {
    let firstBinding = this.toBinding(node.specifiers[0]);
    return new Shift.ImportNamespace({
      moduleSpecifier: node.source.value,
      namespaceBinding: hasDefaultSpecifier ? this.toBinding(node.specifiers[1]) : firstBinding,
      defaultBinding: hasDefaultSpecifier ? firstBinding : null
    });
  }
};

export default ShiftConverter;

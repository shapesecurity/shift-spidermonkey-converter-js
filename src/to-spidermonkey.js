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

// convert Shift AST format to SpiderMonkey AST format

const SpiderMonkeyConverter = {
  convert(ast) {
    if (ast == null) {
      return null;
    }
    return this[`convert${ast.type}`](ast);
  },
  // bindings
  convertBindingWithDefault(node) {
    return {
      type: "AssignmentPattern",
      operator: "=",
      left: this.convert(node.binding),
      right: this.convert(node.init)
    };
  },
  convertBindingIdentifier(node) {
    return this.createIdentifier(node.name);
  },
  convertArrayBinding(node) {
    let elts = node.elements.map(v => {
      if (v.type === "BindingWithDefault") {
        return {
          type: "AssignmentPattern",
          operator: "=",
          left: this.convert(v.binding),
          right: this.convert(v.init)
        };
      }
      return this.convert(v);
    });
    if (node.restElement) elts.push({
      type: "RestElement",
      argument: this.convert(node.restElement)
    });
    return { type: "ArrayPattern", elements: elts };
  },
  convertObjectBinding(node) {
    return {
      type: "ObjectPattern",
      properties: node.properties.map(this.convert.bind(this))
    };
  },
  convertBindingPropertyIdentifier(node) {
    let key = this.convert(node.binding);
    let value = !node.init ? key :
      {
        type: "AssignmentPattern",
        left: key,
        right: this.convert(node.init)
      };
    return {
      type: "Property",
      kind: "init",
      method: false,
      computed: false,
      shorthand: true,
      key,
      value
    };
  },
  convertBindingPropertyProperty(node) {
    return {
      type: "Property",
      kind: "init",
      computed: false,
      method: false,
      shorthand: false,
      key: this.convert(node.name),
      value: this.convert(node.binding)
    };
  },

  // classes
  convertClassExpression(node) {
    let expression = this.convertClassDeclaration(node);
    expression.type = "ClassExpression";
    return expression;
  },
  convertClassDeclaration(node) {
    return {
      type: "ClassDeclaration",
      id: this.convert(node.name),
      superClass: this.convert(node.super),
      body: {
        type: "ClassBody",
        body: node.elements.map(this.convert.bind(this))
      }
    };
  },
  convertClassElement(node) {
    let m = node.method,
      [params, defaults] = this.convertFormalParameters(m);
    return {
      type: "MethodDefinition",
      key: this.convert(m.name),
      computed: m.name.type === "ComputedPropertyName",
      kind: m.name.value === "constructor" ? "constructor" : "init",
      static: node.isStatic,
      value: {
        type: "FunctionExpression",
        id: null,
        params,
        defaults,
        generator: m.isGenerator,
        expression: false,
        body: this.convert(m.body)
      }
    };
  },

  // modules
  convertModule(node) {
    return {
      type: "Program",
      body: node.items.map(this.convert.bind(this)),
      sourceType: "module"
    };
  },
  convertImport(node) {
    let specifiers = node.namedImports.map(this.convert.bind(this));
    if (node.defaultBinding)
      specifiers.unshift({
        type: "ImportDefaultSpecifier",
        local: this.convert(node.defaultBinding)
      });
    return {
      type: "ImportDeclaration",
      source: {
        type: "Literal",
        value: node.moduleSpecifier
      },
      specifiers
    };
  },
  convertImportNamespace(node) {
    let specifiers = [{
      type: "ImportNamespaceSpecifier",
      local: this.convert(node.namespaceBinding)
    }];
    if (node.defaultBinding != null) {
      specifiers.unshift({
        type: "ImportDefaultSpecifier",
        local: this.convert(node.defaultBinding)
      });
    }
    return {
      type: "ImportDeclaration",
      source: {
        type: "Literal",
        value: node.moduleSpecifier
      },
      specifiers
    };
  },
  convertImportSpecifier(node) {
    return {
      type: "ImportSpecifier",
      local: this.convert(node.binding),
      imported: this.createIdentifier(node.name)
    };
  },
  convertExportAllFrom(node) {
    return {
      type: "ExportAllDeclaration",
      source: {
        type: "Literal",
        value: node.moduleSpecifier
      }
    };
  },
  convertExportFrom(node) {
    return {
      type: "ExportNamedDeclaration",
      declaration: null,
      source: {
        type: "Literal",
        value: node.moduleSpecifier
      },
      specifiers: node.namedExports.map(this.convert.bind(this))
    };
  },
  convertExport(node) {
    return {
      type: "ExportNamedDeclaration",
      declaration: this.convert(node.declaration),
      specifiers: [],
      source: null
    };
  },
  convertExportDefault(node) {
    return {
      type: "ExportDefaultDeclaration",
      declaration: this.convert(node.body)
    };
  },
  convertExportSpecifier(node) {
    return {
      type: "ExportSpecifier",
      exported: this.createIdentifier(node.exportedName),
      local: this.createIdentifier(node.name != null ? node.name : node.exportedName)
    };
  },

  // property definition
  convertMethod(node) {
    let [params, defaults] = this.convertFormalParameters(node);
    return {
      type: "Property",
      key: this.convert(node.name),
      computed: node.name.type === "ComputedPropertyName",
      kind: "init",
      method: true,
      shorthand: false,
      value: {
        type: "FunctionExpression",
        id: null,
        params,
        defaults,
        generator: node.isGenerator,
        expression: false,
        body: this.convertFunctionBody(node.body)
      }
    };
  },
  convertGetter(node) {
    return {
      type: "Property",
      key: this.convert(node.name),
      computed: false,
      value: {
        type: "FunctionExpression",
        id: null,
        params: [],
        defaults: [],
        body: this.convertFunctionBody(node.body),
        generator: false,
        expression: false
      },
      method: false,
      shorthand: false,
      kind: "get"
    };
  },
  convertSetter(node) {
    let [params, defaults] = this.convertFormalParameters({ params: { items: [node.param] }});//mocking a FormalParameters object
    return {
      type: "Property",
      key: this.convert(node.name),
      computed: false,
      value: {
        type: "FunctionExpression",
        id: null,
        params,
        defaults,
        body: this.convertFunctionBody(node.body),
        generator: false,
        expression: false
      },
      method: false,
      shorthand: false,
      kind: "set"
    };
  },
  convertDataProperty(node) {
    return {
      type: "Property",
      key: this.convert(node.name),
      value: this.convert(node.expression),
      kind: "init",
      computed: node.name.type === "ComputedPropertyName",
      method: false,
      shorthand: false
    };
  },
  convertShorthandProperty(node) {
    return {
      type: "Property",
      shorthand: true,
      kind: "init",
      method: false,
      computed: false,
      key: this.createIdentifier(node.name),
      value: this.createIdentifier(node.name)
    };
  },
  convertComputedPropertyName(node) {
    return this.convert(node.expression);
  },
  convertStaticPropertyName(node) {
    return {
      type: "Literal",
      value: parseFloat(node.value) || node.value
    };
  },

  // literals
  convertLiteralBooleanExpression(node) {
    return {
      type: "Literal",
      value: node.value,
    };
  },
  convertLiteralInfinityExpression() {
    return {
      type: "Literal",
      value: 1 / 0,
    };
  },
  convertLiteralNullExpression() {
    return {
      type: "Literal",
      value: null,
    };
  },
  convertLiteralNumericExpression(node) {
    return {
      type: "Literal",
      value: parseFloat(node.value),
    };
  },
  convertLiteralRegExpExpression(node) {
    return {
      type: "Literal",
      value: RegExp(node.pattern, node.flags),
      regex: {
        pattern: node.pattern,
        flags: node.flags
      }
    };
  },
  convertLiteralStringExpression(node) {
    return {
      type: "Literal",
      value: node.value
    };
  },

  // other expressions
  convertArrayExpression(node) {
    return {
      type: "ArrayExpression",
      elements: node.elements.map(this.convert.bind(this))
    };
  },
  convertArrowExpression(node) {
    let [params, defaults] = this.convertFormalParameters(node),
      body = this.convert(node.body);
    return {
      type: "ArrowFunctionExpression",
      id: null,
      generator: false,
      expression: body.type !== "BlockStatement",
      params,
      defaults,
      body: this.convert(node.body)
    };
  },
  convertAssignmentExpression(node) {
    return {
      type: "AssignmentExpression",
      operator: "=",
      left: this.convert(node.binding),
      right: this.convert(node.expression)
    };
  },
  convertBinaryExpression(node) {
    if (node.operator === ",") {
      return {
        type: "SequenceExpression",
        expressions: this.convertSequenceExpressionToArray(node)
      };
    }
    return {
      type: node.operator === "||" || node.operator === "&&" ? "LogicalExpression" : "BinaryExpression",
      operator: node.operator,
      left: this.convert(node.left),
      right: this.convert(node.right)
    };
  },
  convertCallExpression(node) {
    return {
      type: "CallExpression",
      callee: this.convert(node.callee),
      arguments: node.arguments.map(this.convert.bind(this))
    };
  },
  convertCompoundAssignmentExpression(node) {
    return {
      type: "AssignmentExpression",
      operator: node.operator,
      left: this.convert(node.binding),
      right: this.convert(node.expression)
    };
  },
  convertComputedMemberExpression(node) {
    return {
      type: "MemberExpression",
      object: this.convert(node.object),
      property: this.convert(node.expression),
      computed: true
    };
  },
  convertConditionalExpression(node) {
    return {
      type: "ConditionalExpression",
      test: this.convert(node.test),
      alternate: this.convert(node.alternate),
      consequent: this.convert(node.consequent)
    };
  },
  convertFunctionExpression(node) {
    let [params, defaults] = this.convertFormalParameters(node);
    return {
      type: "FunctionExpression",
      id: this.convert(node.name),
      params,
      defaults,
      body: this.convert(node.body),
      generator: node.isGenerator,
      expression: false
    };
  },
  convertIdentifierExpression(node) {
    return this.createIdentifier(node.name);
  },
  convertNewExpression(node) {
    return {
      type: "NewExpression",
      callee: this.convert(node.callee),
      arguments: node.arguments.map(this.convert.bind(this))
    };
  },
  convertNewTargetExpression() {
    return {
      type: "MetaProperty",
      meta: "new",
      property: "target"
    };
  },
  convertObjectExpression(node) {
    return {
      type: "ObjectExpression",
      properties: node.properties.map(this.convert.bind(this))
    };
  },
  convertUnaryExpression(node) {
    return {
      type: "UnaryExpression",
      operator: node.operator,
      argument: this.convert(node.operand),
      prefix: true
    };
  },
  convertStaticMemberExpression(node) {
    return {
      type: "MemberExpression",
      object: this.convert(node.object),
      property: this.createIdentifier(node.property),
      computed: false
    };
  },
  convertTemplateExpression(node) {
    let quasis = [],
      expressions = [];
    node.elements.forEach((v, i) => {
      if (i % 2 === 0) quasis.push(this.convert(v));
      else expressions.push(this.convert(v));
    });
    quasis[quasis.length - 1].tail = true;

    if (node.tag != null) {
      return {
        type: "TaggedTemplateExpression",
        tag: this.convert(node.tag),
        quasi: {
          type: "TemplateLiteral",
          quasis,
          expressions
        }
      };
    }
    return {
      type: "TemplateLiteral",
      quasis,
      expressions
    };
  },
  convertThisExpression() {
    return {
      type: "ThisExpression"
    };
  },
  convertUpdateExpression(node) {
    return {
      type: "UpdateExpression",
      prefix: node.isPrefix,
      operator: node.operator,
      argument: this.convert(node.operand)
    };
  },
  convertYieldExpression(node) {
    return {
      type: "YieldExpression",
      argument: this.convert(node.expression),
      delegate: false
    };
  },
  convertYieldGeneratorExpression(node) {
    let expr = this.convertYieldExpression(node);
    expr.delegate = true;
    return expr;
  },

  // other statements
  convertBlockStatement(node) {
    return this.convertBlock(node.block);
  },
  convertBreakStatement(node) {
    return {
      type: "BreakStatement",
      label: node.label ? this.createIdentifier(node.label) : null
    };
  },
  convertContinueStatement(node) {
    return {
      type: "ContinueStatement",
      label: node.label ? this.createIdentifier(node.label) : null
    };
  },
  convertDebuggerStatement() {
    return {
      type: "DebuggerStatement"
    };
  },
  convertDoWhileStatement(node) {
    return {
      type: "DoWhileStatement",
      test: this.convert(node.test),
      body: this.convert(node.body)
    };
  },
  convertEmptyStatement() {
    return {
      type: "EmptyStatement"
    };
  },
  convertExpressionStatement(node) {
    return {
      type: "ExpressionStatement",
      expression: this.convert(node.expression)
    };
  },
  convertForInStatement(node) {
    return {
      type: "ForInStatement",
      left: this.convert(node.left),
      right: this.convert(node.right),
      body: this.convert(node.body),
      each: false
    };
  },
  convertForOfStatement(node) {
    return {
      type: "ForOfStatement",
      left: this.convert(node.left),
      right: this.convert(node.right),
      body: this.convert(node.body)
    };
  },
  convertForStatement(node) {
    return {
      type: "ForStatement",
      init: this.convert(node.init),
      test: this.convert(node.test),
      update: this.convert(node.update),
      body: this.convert(node.body)
    };
  },
  convertIfStatement(node) {
    return {
      type: "IfStatement",
      test: this.convert(node.test),
      consequent: this.convert(node.consequent),
      alternate: this.convert(node.alternate)
    };
  },
  convertLabeledStatement(node) {
    return {
      type: "LabeledStatement",
      label: this.createIdentifier(node.label),
      body: this.convert(node.body)
    };
  },
  convertReturnStatement(node) {
    return {
      type: "ReturnStatement",
      argument: this.convert(node.expression)
    };
  },
  convertSwitchStatement(node) {
    return {
      type: "SwitchStatement",
      discriminant: this.convert(node.discriminant),
      cases: node.cases.map(this.convert.bind(this))
    };
  },
  convertSwitchStatementWithDefault(node) {
    return {
      type: "SwitchStatement",
      discriminant: this.convert(node.discriminant),
      cases: node.preDefaultCases.map(this.convert.bind(this)).
        concat(this.convert(node.defaultCase)).
        concat(node.postDefaultCases.map(this.convert.bind(this)))
    };
  },
  convertThrowStatement(node) {
    return {
      type: "ThrowStatement",
      argument: this.convert(node.expression)
    };
  },
  convertTryCatchStatement(node) {
    let catchClause = this.convert(node.catchClause);
    return {
      type: "TryStatement",
      block: this.convertBlock(node.body),
      handlers: [catchClause],
      handler: catchClause,
      guardedHandlers: [],
      finalizer: null
    };
  },
  convertTryFinallyStatement(node) {
    let catchClause = this.convert(node.catchClause);
    return {
      type: "TryStatement",
      block: this.convertBlock(node.body),
      handlers: [catchClause],
      handler: catchClause,
      guardedHandlers: [],
      finalizer: this.convert(node.finalizer)
    };
  },
  convertVariableDeclarationStatement(node) {
    return this.convert(node.declaration);
  },
  convertWhileStatement(node) {
    return {
      type: "WhileStatement",
      test: this.convert(node.test),
      body: this.convert(node.body)
    };
  },
  convertWithStatement(node) {
    return {
      type: "WithStatement",
      object: this.convert(node.object),
      body: this.convert(node.body)
    };
  },

  // other nodes
  convertBlock(node) {
    return {
      type: "BlockStatement",
      body: node.statements.map(this.convert.bind(this))
    };
  },
  convertCatchClause(node) {
    return {
      type: "CatchClause",
      param: this.convert(node.binding),
      body: this.convert(node.body)
    };
  },
  convertDirective(node) {
    return {
      type: "ExpressionStatement",
      expression: {
        type: "Literal",
        value: node.rawValue
      }
    };
  },
  convertFormalParameters(node) {
    let ps = node.params;
    let params = [],
      defaults = [];
    if (ps.items.length > 0) {
      let hasDefaultBindings = false;
      ps.items.forEach((v) => {
        if (v.type === "BindingWithDefault") {
          hasDefaultBindings = true;
          params.push(this.convert(v.binding));
          defaults.push(this.convert(v.init));
        } else {
          params.push(this.convert(v));
          defaults.push(null);
        }
      });
      if (ps.rest != null) {
        params.push({ type: "RestElement", argument: this.convert(ps.rest) });
        defaults.push(null);
      }
      if (!hasDefaultBindings) {
        defaults = [];
      }
    }
    return [params, defaults];
  },
  convertFunctionBody(node) {
    let directives = node.directives ? node.directives.map(this.convert.bind(this)) : [],
      statements = node.statements ? node.statements.map(this.convert.bind(this)) : [];
    return {
      type: "BlockStatement",
      body: directives.concat(statements)
    };
  },
  convertFunctionDeclaration(node) {
    let [params, defaults] = this.convertFormalParameters(node);
    return {
      type: "FunctionDeclaration",
      id: this.convert(node.name),
      params,
      defaults,
      body: this.convert(node.body),
      generator: node.isGenerator,
      expression: false
    };
  },
  convertScript(node) {
    let directives = node.directives.map(this.convert.bind(this)),
      statements = node.statements.map(this.convert.bind(this));
    return {
      type: "Program",
      body: directives.concat(statements),
      sourceType: "script"
    };
  },
  convertSpreadElement(node) {
    return {
      type: "SpreadElement",
      argument: this.convert(node.expression)
    };
  },
  convertSuper() {
    return {
      type: "Super"
    };
  },
  convertSwitchCase(node) {
    return {
      type: "SwitchCase",
      test: this.convert(node.test),
      consequent: node.consequent.map(this.convert.bind(this))
    };
  },
  convertSwitchDefault(node) {
    return {
      type: "SwitchCase",
      test: null,
      consequent: node.consequent.map(this.convert.bind(this))
    };
  },
  convertTemplateElement(node) {
    return {
      type: "TemplateElement",
      value: {
        raw: node.rawValue,
        cooked: node.rawValue
      },
      tail: false
    };
  },
  convertVariableDeclaration(node) {
    return {
      type: "VariableDeclaration",
      declarations: node.declarators.map(this.convert.bind(this)),
      kind: node.kind
    };
  },
  convertVariableDeclarator(node) {
    return {
      type: "VariableDeclarator",
      id: this.convert(node.binding),
      init: this.convert(node.init)
    };
  },

  // auxiliary methods
  convertPropertyName(node) {
    switch (node.type) {
      case "StaticPropertyName":
        return this.convertStaticPropertyName(node);
      case "ComputedPropertyName":
        return this.convertComputedPropertyName(node);
      case "ShorthandProperty":
        return this.convertShorthandProperty(node);
    }
  },
  convertSequenceExpressionToArray(node) {
    let array = [];
    if (node.left.type === "BinaryExpression" && node.left.operator === ",") {
      array = this.convertSequenceExpressionToArray(node.left);
    } else {
      array = [this.convert(node.left)];
    }
    array.push(this.convert(node.right));
    return array;
  },
  createIdentifier(name) {
    return {
      type: "Identifier",
      name: name
    };
  },
  convertIdentifier(node) {
    return this.createIdentifier(node.name);
  }
};

export default SpiderMonkeyConverter;

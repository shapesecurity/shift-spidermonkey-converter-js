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

import * as assert from "assert";

import * as Shift from "shift-ast";
import * as convert from "..";

suite("unit", () => {
  suite("toShift", () => {
    test("ForInStatement with VariableDeclaration should generate VariableDeclaration", () => {
      const name = "id";
      const kind = "var";
      const smNode = {type: "ForInStatement", left: {type: "VariableDeclaration", kind, declarations: [{type: "VariableDeclarator", id: {type: "Identifier", name}}]}, right: {type: "Literal", value: null}, body: {type: "EmptyStatement"}};
      const shiftNode = convert.toShift(smNode);
      assert.equal(shiftNode.left.type, "VariableDeclaration");
      assert.equal(shiftNode.left.kind, kind);
      assert.equal(shiftNode.left.declarators.length, 1);
      assert.equal(shiftNode.left.declarators[0].type, "VariableDeclarator");
      assert.equal(shiftNode.left.declarators[0].binding.type, "BindingIdentifier");
      assert.equal(shiftNode.left.declarators[0].binding.name, name);
    });

    test("ForStatement with VariableDeclaration should generate VariableDeclaration", () => {
      const name = "id";
      const kind = "var";
      const smNode = {type: "ForStatement", init: {type: "VariableDeclaration", kind, declarations: [{type: "VariableDeclarator", id: {type: "Identifier", name}}]}, test: null, update: null, body: {type: "EmptyStatement"}};
      const shiftNode = convert.toShift(smNode);
      assert.equal(shiftNode.init.type, "VariableDeclaration");
      assert.equal(shiftNode.init.kind, kind);
      assert.equal(shiftNode.init.declarators.length, 1);
      assert.equal(shiftNode.init.declarators[0].type, "VariableDeclarator");
      assert.equal(shiftNode.init.declarators[0].binding.type, "BindingIdentifier");
      assert.equal(shiftNode.init.declarators[0].binding.name, name);
    });

    test("VariableDeclaration should generate VariableDeclarationStatement", () => {
      const name = "id";
      const kind = "var";
      const smNode = {type: "VariableDeclaration", kind, declarations: [{type: "VariableDeclarator", id: {type: "Identifier", name}}]};
      const shiftNode = convert.toShift(smNode);
      assert.equal(shiftNode.type, "VariableDeclarationStatement");
      assert.equal(shiftNode.declaration.type, "VariableDeclaration");
      assert.equal(shiftNode.declaration.kind, kind);
      assert.equal(shiftNode.declaration.declarators.length, 1);
      assert.equal(shiftNode.declaration.declarators[0].type, "VariableDeclarator");
      assert.equal(shiftNode.declaration.declarators[0].binding.type, "BindingIdentifier");
      assert.equal(shiftNode.declaration.declarators[0].binding.name, name);
    });

    test("ContinueStatement label is Identifier, not IdentifierExpression", () => {
      const name = "label";
      const smNode = {type: "ContinueStatement", label: {type: "Identifier", name}};
      const shiftNode = convert.toShift(smNode);
      assert.equal(shiftNode.type, "ContinueStatement");
      assert.equal(shiftNode.label.type, "BindingIdentifier");
      assert.equal(shiftNode.label.name, name);
    });
    
    test("LiteralInfinityExpression", () => {
      const smNode = {type: "Literal", value: 1 / 0};
      const shiftNode = convert.toShift(smNode);
      assert.equal(shiftNode.type, "LiteralInfinityExpression");
    });
  });
});

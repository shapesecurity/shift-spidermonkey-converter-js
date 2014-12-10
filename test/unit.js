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
      const lbNode = convert.toShift(smNode);
      assert.equal(lbNode.left.type, "VariableDeclaration");
      assert.equal(lbNode.left.kind, kind);
      assert.equal(lbNode.left.declarators.length, 1);
      assert.equal(lbNode.left.declarators[0].type, "VariableDeclarator");
      assert.equal(lbNode.left.declarators[0].binding.type, "Identifier");
      assert.equal(lbNode.left.declarators[0].binding.name, name);
    });

    test("ForStatement with VariableDeclaration should generate VariableDeclaration", () => {
      const name = "id";
      const kind = "var";
      const smNode = {type: "ForStatement", init: {type: "VariableDeclaration", kind, declarations: [{type: "VariableDeclarator", id: {type: "Identifier", name}}]}, test: null, update: null, body: {type: "EmptyStatement"}};
      const lbNode = convert.toShift(smNode);
      assert.equal(lbNode.init.type, "VariableDeclaration");
      assert.equal(lbNode.init.kind, kind);
      assert.equal(lbNode.init.declarators.length, 1);
      assert.equal(lbNode.init.declarators[0].type, "VariableDeclarator");
      assert.equal(lbNode.init.declarators[0].binding.type, "Identifier");
      assert.equal(lbNode.init.declarators[0].binding.name, name);
    });

    test("VariableDeclaration should generate VariableDeclarationStatement", () => {
      const name = "id";
      const kind = "var";
      const smNode = {type: "VariableDeclaration", kind, declarations: [{type: "VariableDeclarator", id: {type: "Identifier", name}}]};
      const lbNode = convert.toShift(smNode);
      assert.equal(lbNode.type, "VariableDeclarationStatement");
      assert.equal(lbNode.declaration.type, "VariableDeclaration");
      assert.equal(lbNode.declaration.kind, kind);
      assert.equal(lbNode.declaration.declarators.length, 1);
      assert.equal(lbNode.declaration.declarators[0].type, "VariableDeclarator");
      assert.equal(lbNode.declaration.declarators[0].binding.type, "Identifier");
      assert.equal(lbNode.declaration.declarators[0].binding.name, name);
    });

    test("ContinueStatement label is Identifier, not IdentifierExpression", () => {
      const name = "label";
      const smNode = {type: "ContinueStatement", label: {type: "Identifier", name}};
      const lbNode = convert.toShift(smNode);
      assert.equal(lbNode.type, "ContinueStatement");
      assert.equal(lbNode.label.type, "Identifier");
      assert.equal(lbNode.label.name, name);
    });
  });
});

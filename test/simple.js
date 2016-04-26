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

import * as esprima from "esprima";
import * as shift from "shift-parser";
import * as convert from "..";

suite("simple", function () {
  function stripRaw(node) {
    if (node.type === "Literal") {
      delete node.raw;
      return;
    }
    for (let p in node)
      if (node[p] != null && typeof node[p] === "object")
        stripRaw(node[p]);
  }

  function roundTrip(type, source, isScript) {
    test(type, function() {
      var smAst = esprima.parse(source, { sourceType: isScript ? "script" : "module" });
      assert.notEqual(null, smAst);
      stripRaw(smAst);
      var lbAst = convert.toShift(smAst);
      var smAst2 = convert.toSpiderMonkey(lbAst);
      assert.deepEqual(smAst2, smAst);

      var shAst = (isScript ? shift.parseScript(source) : shift.parseModule(source));
      assert.notEqual(null, shAst);
      stripRaw(shAst);
      var smAst3 = convert.toSpiderMonkey(shAst);
      var shAst2 = convert.toShift(smAst3);
      assert.deepEqual(shAst, shAst2);
    });
  }

  suite("round-tripping", () => {
    roundTrip("Script", ``);
    roundTrip("IdentifierExpression", `x`);
    roundTrip("LiteralStringExpression", `'x';`);
    roundTrip("LiteralStringExpression", `"x";`);
    roundTrip("LiteralNumericExpression", `0;`);
    roundTrip("LiteralNullExpression", `null;`);
    roundTrip("LiteralRegExpExpression", `/a/g;`);
    roundTrip("BinaryExpression", `1+2;`);
    roundTrip("ArrayExpression", `[,,1,,,3,4,,]`);
    roundTrip("AssignmentExpression", `a=2;`);
    roundTrip("CallExpression", `a(b,c)`);
    roundTrip("NewExpression", `new a(b,c)`);
    roundTrip("PostfixExpression", `a++`);
    roundTrip("PrefixExpression", `!a`);
    roundTrip("StaticMemberExpression", `a.b(b,c)`);
    roundTrip("ComputedMemberExpression", `a[b](b,c)`);
    roundTrip("FunctionDeclaration", `function a(a,b,c) {'use strict';return 0;};`);
    roundTrip("FunctionExpression", `(function(a,b,c) {'use strict';return 0;});`);
    roundTrip("FunctionExpression", `(function a(a,b,c) {'use strict';return 0;});`);
    roundTrip("BreakStatement", `a:{break a;}`);
    roundTrip("TryCatchStatement", `try{}catch(a){}`);
    roundTrip("TryFinallyStatement", `try{}catch(a){}finally{}`);
    roundTrip("ConditionalExpression", `a?b:c`);
    roundTrip("DoWhileStatement", `do continue; while(1);`);
    roundTrip("LabeledStatement", `a: do continue a; while(1);`);
    roundTrip("DebuggerStatement", `debugger`);
    roundTrip("ForStatement", `for(a;b;c);`);
    roundTrip("ForStatement", `for(var a;b;c);`);
    roundTrip("ForStatement", `for(var a = 0;b;c);`);
    roundTrip("ForStatement", `for(;b;c);`);
    roundTrip("ForInStatement", `for(var a in b);`);
    roundTrip("ForInStatement", `for(var a = c in b);`);
    roundTrip("ForInStatement", `for(a in b);`);
    roundTrip("ForInStatement", `for(a.b in b);`);
    roundTrip("IfExpression", `if(a)b;`);
    roundTrip("IfExpression", `if(a)b;else c;`);
    roundTrip("ObjectExpression", `+{a:0, get 'b'(){}, set 3(d){}}`);
    roundTrip("WhileStatement", `while(1);`);
    roundTrip("WithStatement", `with(1);`);
    roundTrip("ThrowStatement", `throw this`);
    roundTrip("SwitchStatement", `switch(a){case 1:}`);
    roundTrip("SwitchStatementWithDefault", `switch(a){case 1:default:case 2:}`);
    roundTrip("SwitchStatementWithDefault", `switch(a){case 1:default:}`);
    roundTrip("SwitchStatementWithDefault", `switch(a){default:case 2:}`);
    roundTrip("VariableDeclarationStatement", `var a;`);

    // SpiderMonkey-specific
    roundTrip("LogicalExpression", `1||2;`);
    roundTrip("LogicalExpression", `true || false;`);
    roundTrip("UpdateExpression", `++a`);
    roundTrip("SequenceExpression", `(a,b,c)`);
    roundTrip("SequenceExpression", `(a,(b,c))`);
  });

});

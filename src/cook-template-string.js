/**
 * Copyright 2016 Shape Security, Inc.
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


// Exports a single function which "cooks" template strings, i.e. interprets any escape sequences and converts \r\n into \n.
// Adapted from shift-parser's scanStringEscape


function getHexValue(rune) {
  if ("0" <= rune && rune <= "9") {
    return rune.charCodeAt(0) - 48;
  }
  if ("a" <= rune && rune <= "f") {
    return rune.charCodeAt(0) - 87;
  }
  if ("A" <= rune && rune <= "F") {
    return rune.charCodeAt(0) - 55;
  }
  return -1;
}

function isLineTerminator(cp) {
  return (cp === 0x0A) || (cp === 0x0D) || (cp === 0x2028) || (cp === 0x2029);
}

function fromCodePoint(cp) {
  if (cp <= 0xFFFF) return String.fromCharCode(cp);
  let cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
  let cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
  return cu1 + cu2;
}


export default function cook(source) {
  // convert a TemplateCharacters into its Template Value
  // https://tc39.github.io/ecma262/#sec-static-semantics-tv-and-trv
  let str = "";
  for (let index = 0; index < source.length; ++index) {
    let ch = source.charAt(index);
    if (ch === "\\") {
      ch = source.charAt(++index);
      if (!isLineTerminator(ch.charCodeAt(0))) {
        switch (ch) {
          case "n":
            str += "\n";
            break;
          case "r":
            str += "\r";
            break;
          case "t":
            str += "\t";
            break;
          case "u":
          case "x":
            let unescaped;
            index++;
            if (ch === "u") {
              if (source.charAt(index) === "{") {
                //\u{HexDigits}
                let i = index + 1;
                let hexDigits = 0, ch;
                while (i < source.length) {
                  ch = source.charAt(i);
                  let hex = getHexValue(ch);
                  if (hex === -1) {
                    break;
                  }
                  hexDigits = (hexDigits << 4) | hex;
                  i++;
                }
                index = i;
                unescaped = hexDigits;
              } else {
                //\uHex4Digits
                let r1 = getHexValue(source.charAt(index));
                let r2 = getHexValue(source.charAt(index + 1));
                let r3 = getHexValue(source.charAt(index + 2));
                let r4 = getHexValue(source.charAt(index + 3));
                index += 3;
                unescaped = r1 << 12 | r2 << 8 | r3 << 4 | r4;
              }
            } else {
              let r1 = getHexValue(source.charAt(index));
              let r2 = getHexValue(source.charAt(index + 1));
              index++;
              unescaped = r1 << 4 | r2;
            }
            str += fromCodePoint(unescaped);
            break;
          case "b":
            str += "\b";
            break;
          case "f":
            str += "\f";
            break;
          case "v":
            str += "\u000B";
            break;
          case "0":
            str += "\0";
            break;
          default:
            str += ch;
        }
      } else {
        if (ch === "\r" && source.charAt(index + 1) === "\n") {
          index++;
        }
      }
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      if (ch === "\r" && source.charAt(index + 1) === "\n") {
        index++;
      }
      str += "\n";
    } else {
      str += ch;
    }
  }
  return str;
}

/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Helper functions for generating Natural for blocks.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Natural code generator.
 * @type {!Blockly.Generator}
 */
Blockly.Natural = new Blockly.Generator('Natural');

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly.Natural.addReservedWords();

/**
 * Order of operation ENUMs.
 * https://developer.mozilla.org/en/Natural/Reference/Operators/Operator_Precedence
 */
Blockly.Natural.ORDER_ATOMIC = 0;           // 0 "" ...
Blockly.Natural.ORDER_NEW = 1.1;            // new
Blockly.Natural.ORDER_MEMBER = 1.2;         // . []
Blockly.Natural.ORDER_FUNCTION_CALL = 2;    // ()
Blockly.Natural.ORDER_INCREMENT = 3;        // ++
Blockly.Natural.ORDER_DECREMENT = 3;        // --
Blockly.Natural.ORDER_BITWISE_NOT = 4.1;    // ~
Blockly.Natural.ORDER_UNARY_PLUS = 4.2;     // +
Blockly.Natural.ORDER_UNARY_NEGATION = 4.3; // -
Blockly.Natural.ORDER_LOGICAL_NOT = 4.4;    // !
Blockly.Natural.ORDER_TYPEOF = 4.5;         // typeof
Blockly.Natural.ORDER_VOID = 4.6;           // void
Blockly.Natural.ORDER_DELETE = 4.7;         // delete
Blockly.Natural.ORDER_DIVISION = 5.1;       // /
Blockly.Natural.ORDER_MULTIPLICATION = 5.2; // *
Blockly.Natural.ORDER_MODULUS = 5.3;        // %
Blockly.Natural.ORDER_SUBTRACTION = 6.1;    // -
Blockly.Natural.ORDER_ADDITION = 6.2;       // +
Blockly.Natural.ORDER_BITWISE_SHIFT = 7;    // << >> >>>
Blockly.Natural.ORDER_RELATIONAL = 8;       // < <= > >=
Blockly.Natural.ORDER_IN = 8;               // in
Blockly.Natural.ORDER_INSTANCEOF = 8;       // instanceof
Blockly.Natural.ORDER_EQUALITY = 9;         // == != === !==
Blockly.Natural.ORDER_BITWISE_AND = 10;     // &
Blockly.Natural.ORDER_BITWISE_XOR = 11;     // ^
Blockly.Natural.ORDER_BITWISE_OR = 12;      // |
Blockly.Natural.ORDER_LOGICAL_AND = 13;     // &&
Blockly.Natural.ORDER_LOGICAL_OR = 14;      // ||
Blockly.Natural.ORDER_CONDITIONAL = 15;     // ?:
Blockly.Natural.ORDER_ASSIGNMENT = 16;      // = += -= *= /= %= <<= >>= ...
Blockly.Natural.ORDER_COMMA = 17;           // ,
Blockly.Natural.ORDER_NONE = 99;            // (...)

/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array.<!Array.<number>>}
 */
Blockly.Natural.ORDER_OVERRIDES = [
  // (foo()).bar -> foo().bar
  // (foo())[0] -> foo()[0]
  [Blockly.Natural.ORDER_FUNCTION_CALL, Blockly.Natural.ORDER_MEMBER],
  // (foo())() -> foo()()
  [Blockly.Natural.ORDER_FUNCTION_CALL, Blockly.Natural.ORDER_FUNCTION_CALL],
  // (foo.bar).baz -> foo.bar.baz
  // (foo.bar)[0] -> foo.bar[0]
  // (foo[0]).bar -> foo[0].bar
  // (foo[0])[1] -> foo[0][1]
  [Blockly.Natural.ORDER_MEMBER, Blockly.Natural.ORDER_MEMBER],
  // (foo.bar)() -> foo.bar()
  // (foo[0])() -> foo[0]()
  [Blockly.Natural.ORDER_MEMBER, Blockly.Natural.ORDER_FUNCTION_CALL],

  // !(!foo) -> !!foo
  [Blockly.Natural.ORDER_LOGICAL_NOT, Blockly.Natural.ORDER_LOGICAL_NOT],
  // a * (b * c) -> a * b * c
  [Blockly.Natural.ORDER_MULTIPLICATION, Blockly.Natural.ORDER_MULTIPLICATION],
  // a + (b + c) -> a + b + c
  [Blockly.Natural.ORDER_ADDITION, Blockly.Natural.ORDER_ADDITION],
  // a && (b && c) -> a && b && c
  [Blockly.Natural.ORDER_LOGICAL_AND, Blockly.Natural.ORDER_LOGICAL_AND],
  // a || (b || c) -> a || b || c
  [Blockly.Natural.ORDER_LOGICAL_OR, Blockly.Natural.ORDER_LOGICAL_OR]
];

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.Natural.init = function(workspace) {
  // Create a dictionary of definitions to be printed before the code.
  Blockly.Natural.definitions_ = Object.create(null);
  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly.Natural.functionNames_ = Object.create(null);

  if (!Blockly.Natural.variableDB_) {
    Blockly.Natural.variableDB_ =
        new Blockly.Names(Blockly.Natural.RESERVED_WORDS_);
  } else {
    Blockly.Natural.variableDB_.reset();
  }
/*
  var defvars = [];
  var variables = workspace.getAllVariables();
  if (variables.length) {
    for (var i = 0; i < variables.length; i++) {
      defvars[i] = Blockly.Natural.variableDB_.getName(variables[i].name,
          Blockly.Variables.NAME_TYPE);
    }
    Blockly.Natural.definitions_['variables'] =
        'var ' + defvars.join(', ') + ';';
  }
 */
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Natural.finish = function(code) {
  // Convert the definitions dictionary into a list.
  var definitions = [];
  for (var name in Blockly.Natural.definitions_) {
    definitions.push(Blockly.Natural.definitions_[name]);
  }
  // Clean up temporary data.
  delete Blockly.Natural.definitions_;
  delete Blockly.Natural.functionNames_;
  Blockly.Natural.variableDB_.reset();
  return definitions.join('\n\n') + '\n\n\n' + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Natural.scrubNakedValue = function(line) {
  return line + ';\n';
};

/**
 * Encode a string as a properly escaped Natural string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Natural string.
 * @private
 */
Blockly.Natural.quote_ = function(string) {
  // Can't use goog.string.quote since Google's style guide recommends
  // JS string literals use single quotes.
  string = string.replace(/\\/g, '\\\\')
                 .replace(/\n/g, '\\\n')
                 .replace(/'/g, '\\\'');
  return '\'' + string + '\'';
};

/**
 * Common tasks for generating Natural from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Natural code created for this block.
 * @return {string} Natural code with comments and subsequent blocks added.
 * @private
 */
Blockly.Natural.scrub_ = function(block, code) {
  var commentCode = '';
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    var comment = block.getCommentText();
    comment = Blockly.utils.wrap(comment, Blockly.Natural.COMMENT_WRAP - 3);
    if (comment) {
      if (block.getProcedureDef) {
        // Use a comment block for function comments.
        commentCode += '/**\n' +
                       Blockly.Natural.prefixLines(comment + '\n', ' * ') +
                       ' */\n';
      } else {
        commentCode += Blockly.Natural.prefixLines(comment + '\n', '// ');
      }
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (var i = 0; i < block.inputList.length; i++) {
      if (block.inputList[i].type == Blockly.INPUT_VALUE) {
        var childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          var comment = Blockly.Natural.allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly.Natural.prefixLines(comment, '// ');
          }
        }
      }
    }
  }
  var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  var nextCode = Blockly.Natural.blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

/**
 * Gets a property and adjusts the value while taking into account indexing.
 * @param {!Blockly.Block} block The block.
 * @param {string} atId The property ID of the element to get.
 * @param {number=} opt_delta Value to add.
 * @param {boolean=} opt_negate Whether to negate the value.
 * @param {number=} opt_order The highest order acting on this value.
 * @return {string|number}
 */
Blockly.Natural.getAdjusted = function(block, atId, opt_delta, opt_negate,
    opt_order) {
  var delta = opt_delta || 0;
  var order = opt_order || Blockly.Natural.ORDER_NONE;
  if (block.workspace.options.oneBasedIndex) {
    delta--;
  }
  var defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
  if (delta > 0) {
    var at = Blockly.Natural.valueToCode(block, atId,
        Blockly.Natural.ORDER_ADDITION) || defaultAtIndex;
  } else if (delta < 0) {
    var at = Blockly.Natural.valueToCode(block, atId,
        Blockly.Natural.ORDER_SUBTRACTION) || defaultAtIndex;
  } else if (opt_negate) {
    var at = Blockly.Natural.valueToCode(block, atId,
        Blockly.Natural.ORDER_UNARY_NEGATION) || defaultAtIndex;
  } else {
    var at = Blockly.Natural.valueToCode(block, atId, order) ||
        defaultAtIndex;
  }

  if (Blockly.isNumber(at)) {
    // If the index is a naked number, adjust it right now.
    at = parseFloat(at) + delta;
    if (opt_negate) {
      at = -at;
    }
  } else {
    // If the index is dynamic, adjust it in code.
    if (delta > 0) {
      at = at + ' + ' + delta;
      var innerOrder = Blockly.Natural.ORDER_ADDITION;
    } else if (delta < 0) {
      at = at + ' - ' + -delta;
      var innerOrder = Blockly.Natural.ORDER_SUBTRACTION;
    }
    if (opt_negate) {
      if (delta) {
        at = '-(' + at + ')';
      } else {
        at = '-' + at;
      }
      var innerOrder = Blockly.Natural.ORDER_UNARY_NEGATION;
    }
    innerOrder = Math.floor(innerOrder);
    order = Math.floor(order);
    if (innerOrder && order >= innerOrder) {
      at = '(' + at + ')';
    }
  }
  return at;
};

Blockly.Natural.chaincode_init = function(block) {
  // Text value.
  var code = 'chaincode init: \n';
  var branch = Blockly.Natural.statementToCode(block, 'init_func');
  branch = Blockly.Natural.addLoopTrap(branch, block.id);
  code += branch;
  return code + '\n';
};

Blockly.Natural.chaincode_body = function(block) {
  // TODO: Assemble Natural into code variable.
  var code = 'chaincode body: \n';
  var branch = Blockly.Natural.statementToCode(block, 'body_func');
  branch = Blockly.Natural.addLoopTrap(branch, block.id);
  code += branch;
  return code + '\n';
};

Blockly.Natural.chaincode_init_body = function(block) {
  var statements_init_func = Blockly.Natural.statementToCode(block, 'init_func');
  var statements_body_func = Blockly.Natural.statementToCode(block, 'body_func');
  // TODO: Assemble Natural into code variable.
  var code = 'chaincode init: \n';
  var branch = Blockly.Natural.statementToCode(block, 'init_func');
  branch = Blockly.Natural.addLoopTrap(branch, block.id);  
  code += branch;
  
  code += 'chaincode body: \n';
  branch = Blockly.Natural.statementToCode(block, 'body_func');
  branch = Blockly.Natural.addLoopTrap(branch, block.id);  
  code += branch;
  
  return code + '\n';
};
Blockly.Natural.chaincode_invoke = function(block) {
  var checkbox_check_invoke_security = block.getFieldValue('check_invoke_security') == 'TRUE';
  var usera_name = Blockly.Natural.valueToCode(block, 'user_A', Blockly.Natural.ORDER_ATOMIC);
  var userb_name = Blockly.Natural.valueToCode(block, 'user_B', Blockly.Natural.ORDER_ATOMIC);
  var money = Blockly.Natural.valueToCode(block, 'money_num', Blockly.Natural.ORDER_ATOMIC);
  // TODO: Assemble Natural into code variable.	
  var code = 'Transaction: ';
  code += usera_name + ' gives ' + userb_name + ' ' + money + ' dollar(s). \n';
  return code;
};


Blockly.Natural.chaincode_query = function(block) {
  var checkbox_check_query_security = block.getFieldValue('check_query_security') == 'TRUE';
  var user_name = Blockly.Natural.valueToCode(block, 'user_Query', Blockly.Natural.ORDER_ATOMIC);
  // TODO: Assemble Natural into code variable.
  var code = 'Query: ';
  code += 'query ' + user_name + '\'s account.\n'
  return code;
};


Blockly.Natural.chaincode_delete = function(block) {
  var checkbox_check_delete_security = block.getFieldValue('check_delete_security') == 'TRUE';
  var user_name = Blockly.Natural.valueToCode(block, 'user_Delete', Blockly.Natural.ORDER_ATOMIC);
  // TODO: Assemble Natural into code variable.
  var code = 'Delete: ';
  code += 'delete the user ' + user_name;
  return code;
};
Blockly.Natural.set_value = function(block) {
  var checkbox_flag = block.getFieldValue('check_set_security') == 'TRUE';
  var variable_name = Blockly.Natural.variableDB_.getName(block.getFieldValue('data'), Blockly.Variables.NAME_TYPE);
  var variable_value = Blockly.Natural.valueToCode(block, 'VARIABLE', Blockly.Natural.ORDER_ATOMIC);
  // TODO: Assemble Natural into code variable.
  var valuable_val = variable_name + 'val';
  var valuable_err = 'err_' +  variable_name;
  var code = 'There is ' + variable_value + ' dollar in ' + variable_name + '\'s account.\n';
  return code;
};

Blockly.Natural.controls_if = function(block) {
  // If/elseif/else condition.
  var n = 0;
  var code = '', branchCode, conditionCode;
  do {
    conditionCode = Blockly.Natural.valueToCode(block, 'IF' + n,
      Blockly.Natural.ORDER_NONE) || 'false';
    branchCode = Blockly.Natural.statementToCode(block, 'DO' + n);
    code += (n > 0 ? ' else ' : '') +
        'if  ' + conditionCode + '  \n' + branchCode + '';

    ++n;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE')) {
    branchCode = Blockly.Natural.statementToCode(block, 'ELSE');
    code += ' else \n' + branchCode + '';
  }
  return code + '\n';
};

Blockly.Natural.controls_ifelse = Blockly.Natural['controls_if'];

Blockly.Natural.logic_compare = function(block) {
  // Comparison operator.
  var OPERATORS = {
    'EQ': 'is equal to',
    'NEQ': 'is not equal to',
    'LT': 'less than ',
    'LTE': 'no more than',
    'GT': 'more than',
    'GTE': 'no less than'
  };
  var operator = OPERATORS[block.getFieldValue('OP')];
  var order = (operator == '==' || operator == '!=') ?
      Blockly.Natural.ORDER_EQUALITY : Blockly.Natural.ORDER_RELATIONAL;
  var argument0 = Blockly.Natural.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Natural.valueToCode(block, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Natural.logic_boolean = function(block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Natural.ORDER_ATOMIC];
};

Blockly.Natural.controls_repeat_ext = function(block) {
  // Repeat n times.
  if (block.getField('TIMES')) {
    // Internal number.
    var repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    var repeats = Blockly.Natural.valueToCode(block, 'TIMES',
        Blockly.Natural.ORDER_ASSIGNMENT) || '0';
  }
  var branch = Blockly.Natural.statementToCode(block, 'DO');
  branch = Blockly.Natural.addLoopTrap(branch, block.id);
  var code = '';
  var loopVar = Blockly.Natural.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    var endVar = Blockly.Natural.variableDB_.getDistinctName(
        'repeat_end', Blockly.Variables.NAME_TYPE);
    code += endVar + ' = ' + repeats + ';\n';
  }
  code += 'recycle for ' + endVar + ' times: \n' + branch + '\n';
  return code;
};

Blockly.Natural.controls_whileUntil = function(block) {
  // Do while/until loop.
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Natural.valueToCode(block, 'BOOL',
      until ? Blockly.Natural.ORDER_LOGICAL_NOT :
      Blockly.Natural.ORDER_NONE) || 'false';
  var branch = Blockly.Natural.statementToCode(block, 'DO');
  branch = Blockly.Natural.addLoopTrap(branch, block.id);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'recycle until ' + argument0 + ' \n' + branch + '\n';
};

Blockly.Natural.math_number = function(block) {
  // Numeric value.
  var code = parseFloat(block.getFieldValue('NUM'));
  return [code, Blockly.Natural.ORDER_ATOMIC];
};

Blockly.Natural.math_arithmetic = function(block) {
  // Basic arithmetic operators, and power.
  var OPERATORS = {
    'ADD': [' add ', Blockly.Natural.ORDER_ADDITION],
    'MINUS': [' sub ', Blockly.Natural.ORDER_SUBTRACTION],
    'MULTIPLY': [' multiply ', Blockly.Natural.ORDER_MULTIPLICATION],
    'DIVIDE': [' divide ', Blockly.Natural.ORDER_DIVISION],
    'POWER': [null, Blockly.Natural.ORDER_COMMA]  // Handle power separately.
  };
  var tuple = OPERATORS[block.getFieldValue('OP')];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.Natural.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Natural.valueToCode(block, 'B', order) || '0';
  var code;
  // Power in Natural requires a special case since it has no operator.
  if (!operator) {
    code = 'pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Blockly.Natural.ORDER_FUNCTION_CALL];
  }
  code = argument0 + operator + argument1;
  return [code, order];
};

Blockly.Natural.text = function(block) {
  // Text value.
  var code = Blockly.Natural.quote_(block.getFieldValue('TEXT'));
  return [code, Blockly.Natural.ORDER_ATOMIC];
};

Blockly.Natural.text_print = function(block) {
  // Print statement.
  var msg = Blockly.Natural.valueToCode(block, 'TEXT',
      Blockly.Natural.ORDER_NONE) || '\'\'';
  return 'Output the data of ' + msg + '\n';
};


Blockly.Natural.variables_get = function(block) {
  // Variable getter.
  var code = Blockly.Natural.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Natural.ORDER_ATOMIC];
};

Blockly.Natural.variables_set = function(block) {
  // Variable setter.
  var argument0 = Blockly.Natural.valueToCode(block, 'VALUE',
      Blockly.Natural.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Natural.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + ';\n';
};

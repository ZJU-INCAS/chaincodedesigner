'use strict';
Blockly.Go = new Blockly.Generator('Go');
Blockly.Go.addReservedWords();
Blockly.Go.ORDER_ATOMIC = 0; // 0 "" ...
Blockly.Go.ORDER_NEW = 1.1; // new
Blockly.Go.ORDER_MEMBER = 1.2; // . []
Blockly.Go.ORDER_FUNCTION_CALL = 2; // ()
Blockly.Go.ORDER_INCREMENT = 3; // ++
Blockly.Go.ORDER_DECREMENT = 3; // --
Blockly.Go.ORDER_BITWISE_NOT = 4.1; // ~
Blockly.Go.ORDER_UNARY_PLUS = 4.2; // +
Blockly.Go.ORDER_UNARY_NEGATION = 4.3; // -
Blockly.Go.ORDER_LOGICAL_NOT = 4.4; // !
Blockly.Go.ORDER_TYPEOF = 4.5; // typeof
Blockly.Go.ORDER_VOID = 4.6; // void
Blockly.Go.ORDER_DELETE = 4.7; // delete
Blockly.Go.ORDER_DIVISION = 5.1; // /
Blockly.Go.ORDER_MULTIPLICATION = 5.2; // *
Blockly.Go.ORDER_MODULUS = 5.3; // %
Blockly.Go.ORDER_SUBTRACTION = 6.1; // -
Blockly.Go.ORDER_ADDITION = 6.2; // +
Blockly.Go.ORDER_BITWISE_SHIFT = 7; // << >> >>>
Blockly.Go.ORDER_RELATIONAL = 8; // < <= > >=
Blockly.Go.ORDER_IN = 8; // in
Blockly.Go.ORDER_INSTANCEOF = 8; // instanceof
Blockly.Go.ORDER_EQUALITY = 9; // == != === !==
Blockly.Go.ORDER_BITWISE_AND = 10; // &
Blockly.Go.ORDER_BITWISE_XOR = 11; // ^
Blockly.Go.ORDER_BITWISE_OR = 12; // |
Blockly.Go.ORDER_LOGICAL_AND = 13; // &&
Blockly.Go.ORDER_LOGICAL_OR = 14; // ||
Blockly.Go.ORDER_CONDITIONAL = 15; // ?:
Blockly.Go.ORDER_ASSIGNMENT = 16; // = += -= *= /= %= <<= >>= ...
Blockly.Go.ORDER_COMMA = 17; // ,
Blockly.Go.ORDER_NONE = 99; // (...)
/**
 * List of outer-inner pairings that do NOT require parentheses.
 * @type {!Array.<!Array.<number>>}
 */
Blockly.Go.ORDER_OVERRIDES = [
	// (foo()).bar -> foo().bar
	// (foo())[0] -> foo()[0]
	[Blockly.Go.ORDER_FUNCTION_CALL, Blockly.Go.ORDER_MEMBER],
	// (foo())() -> foo()()
	[Blockly.Go.ORDER_FUNCTION_CALL, Blockly.Go.ORDER_FUNCTION_CALL],
	// (foo.bar).baz -> foo.bar.baz
	// (foo.bar)[0] -> foo.bar[0]
	// (foo[0]).bar -> foo[0].bar
	// (foo[0])[1] -> foo[0][1]
	[Blockly.Go.ORDER_MEMBER, Blockly.Go.ORDER_MEMBER],
	// (foo.bar)() -> foo.bar()
	// (foo[0])() -> foo[0]()
	[Blockly.Go.ORDER_MEMBER, Blockly.Go.ORDER_FUNCTION_CALL],

	// !(!foo) -> !!foo
	[Blockly.Go.ORDER_LOGICAL_NOT, Blockly.Go.ORDER_LOGICAL_NOT],
	// a * (b * c) -> a * b * c
	[Blockly.Go.ORDER_MULTIPLICATION, Blockly.Go.ORDER_MULTIPLICATION],
	// a + (b + c) -> a + b + c
	[Blockly.Go.ORDER_ADDITION, Blockly.Go.ORDER_ADDITION],
	// a && (b && c) -> a && b && c
	[Blockly.Go.ORDER_LOGICAL_AND, Blockly.Go.ORDER_LOGICAL_AND],
	// a || (b || c) -> a || b || c
	[Blockly.Go.ORDER_LOGICAL_OR, Blockly.Go.ORDER_LOGICAL_OR]
];

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly.Go.init = function(workspace) {
	// Create a dictionary of package to be printed before the code.
	Blockly.Go.import_ = Object.create(null);
	// Create a dictionary mapping desired function names in definitions_
	// to actual function names (to avoid collisions with user functions).
	Blockly.Go.functionNames_ = Object.create(null);

	if(!Blockly.Go.variableDB_) {
		Blockly.Go.variableDB_ =
			new Blockly.Names(Blockly.Go.RESERVED_WORDS_);
	} else {
		Blockly.Go.variableDB_.reset();
	}
	
	Blockly.Go.import_['package'] = '  \"fmt\"\n  \"strconv\"\n  \"github.com/hyperledger/fabric/core/chaincode/shim\"\n  pb \"github.com/hyperledger/fabric/protos/peer\"\n';
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly.Go.finish = function(code) {
	// Convert the imports dictionary into a list.
	var imports = [];
	for(var name in Blockly.Go.import_) {
		imports.push(Blockly.Go.import_[name]);
	}
	// Clean up temporary data.
	delete Blockly.Go.import_;
	delete Blockly.Go.functionNames_;
	Blockly.Go.variableDB_.reset();
	return 'package main\n' + 'import(\n' + imports.join('\n') + ')' + '\n\ntype SimpleChaincode struct {}\n'+ '\n\n'  + code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly.Go.scrubNakedValue = function(line) {
	return line + ';\n';
};

/**
 * Encode a string as a properly escaped Go string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Go string.
 * @private
 */
Blockly.Go.quote_ = function(string) {
	// Can't use goog.string.quote since Google's style guide recommends
	// JS string literals use single quotes.
	string = string.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\\n')
		.replace(/'/g, '\\\'');
	return '\'' + string + '\'';
};

/**
 * Common tasks for generating Go from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Go code created for this block.
 * @return {string} Go code with comments and subsequent blocks added.
 * @private
 */
Blockly.Go.scrub_ = function(block, code) {
	var commentCode = '';
	// Only collect comments for blocks that aren't inline.
	if(!block.outputConnection || !block.outputConnection.targetConnection) {
		// Collect comment for this block.
		var comment = block.getCommentText();
		comment = Blockly.utils.wrap(comment, Blockly.Go.COMMENT_WRAP - 3);
		if(comment) {
			if(block.getProcedureDef) {
				// Use a comment block for function comments.
				commentCode += '/**\n' +
					Blockly.Go.prefixLines(comment + '\n', ' * ') +
					' */\n';
			} else {
				commentCode += Blockly.Go.prefixLines(comment + '\n', '// ');
			}
		}
		// Collect comments for all value arguments.
		// Don't collect comments for nested statements.
		for(var i = 0; i < block.inputList.length; i++) {
			if(block.inputList[i].type == Blockly.INPUT_VALUE) {
				var childBlock = block.inputList[i].connection.targetBlock();
				if(childBlock) {
					var comment = Blockly.Go.allNestedComments(childBlock);
					if(comment) {
						commentCode += Blockly.Go.prefixLines(comment, '// ');
					}
				}
			}
		}
	}
	var nextBlock = block.nextConnection && block.nextConnection.targetBlock();
	var nextCode = Blockly.Go.blockToCode(nextBlock);
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
Blockly.Go.getAdjusted = function(block, atId, opt_delta, opt_negate,
	opt_order) {
	var delta = opt_delta || 0;
	var order = opt_order || Blockly.Go.ORDER_NONE;
	if(block.workspace.options.oneBasedIndex) {
		delta--;
	}
	var defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';
	if(delta > 0) {
		var at = Blockly.Go.valueToCode(block, atId,
			Blockly.Go.ORDER_ADDITION) || defaultAtIndex;
	} else if(delta < 0) {
		var at = Blockly.Go.valueToCode(block, atId,
			Blockly.Go.ORDER_SUBTRACTION) || defaultAtIndex;
	} else if(opt_negate) {
		var at = Blockly.Go.valueToCode(block, atId,
			Blockly.Go.ORDER_UNARY_NEGATION) || defaultAtIndex;
	} else {
		var at = Blockly.Go.valueToCode(block, atId, order) ||
			defaultAtIndex;
	}

	if(Blockly.isNumber(at)) {
		// If the index is a naked number, adjust it right now.
		at = parseFloat(at) + delta;
		if(opt_negate) {
			at = -at;
		}
	} else {
		// If the index is dynamic, adjust it in code.
		if(delta > 0) {
			at = at + ' + ' + delta;
			var innerOrder = Blockly.Go.ORDER_ADDITION;
		} else if(delta < 0) {
			at = at + ' - ' + -delta;
			var innerOrder = Blockly.Go.ORDER_SUBTRACTION;
		}
		if(opt_negate) {
			if(delta) {
				at = '-(' + at + ')';
			} else {
				at = '-' + at;
			}
			var innerOrder = Blockly.Go.ORDER_UNARY_NEGATION;
		}
		innerOrder = Math.floor(innerOrder);
		order = Math.floor(order);
		if(innerOrder && order >= innerOrder) {
			at = '(' + at + ')';
		}
	}
	return at;
};

Blockly.Go.chaincode_init = function(block) {
	// TODO: Assemble Go into code variable.
	var code = '';
	code += 'func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {\n';
	code += '  fmt.Println("ex02 Init")\n';
	var branch = Blockly.Go.statementToCode(block, 'init_func');
	branch = Blockly.Go.addLoopTrap(branch, block.id);
	code += branch;
	code += '    return shim.Success(nil)\n}\n';

	return code;
};


Blockly.Go.chaincode_body = function(block) {
	// TODO: Assemble Go into code variable.
	
	var code = 'func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {\n';
	code += '    fmt.Println("ex02 Invoke")\n';
	code += '    if function == "invoke" {\n';
	code += '      fmt.Printf("Function is invoke")\n';
	code += '      return t.invoke(stub, args)\n';
	code += '    } else if function == "init" {\n';
	code += '      fmt.Printf("Function is init")\n';
	code += '      return t.Init(stub, function, args)\n';
	code += '    } else if function == "delete" {\n';
	code += '      fmt.Printf("Function is delete")\n';
	code += '      return t.delete(stub, args)\n';
	code += '    } else if function == "query" {\n';
	code += '      fmt.Printf("Function is query")\n';
	code += '      return t.query(stub, args)\n';
	code += '    }\n';

	code += '    return shim.Error("Invalid invoke function name. Expecting \\\"invoke\\\" \\\"delete\\\" \\\"query\\\"")\n';
	code += '}\n';

	var branch = Blockly.Go.statementToCode(block, 'body_func');
	branch = Blockly.Go.addLoopTrap(branch, block.id);
	code += branch;
	
	code += 'func main() { \n  err := shim.Start(new(SimpleChaincode))\n  if err != nil {\n';
	code += '    fmt.Printf("Error starting Simple chaincode: %s", err)\n  }\n}\n';
	return code + '\n';
	function haFe(){
		code += '    if function ==111111111111111111111 "invoke" {\n';
		code += '      fmt.Printf("Function is invoke")\n';
		code += '      return t.invoke(stub, args)\n';
		code += '    }';
		return ;
	}
	
};


Blockly.Go.chaincode_invoke = function(block) {
	var checkbox_check_invoke_security = block.getFieldValue('check_invoke_security') == 'TRUE';
	var usera_name = Blockly.Go.valueToCode(block, 'user_A', Blockly.Go.ORDER_ATOMIC);
	var userb_name = Blockly.Go.valueToCode(block, 'user_B', Blockly.Go.ORDER_ATOMIC);
	var money = Blockly.Go.valueToCode(block, 'money_num', Blockly.Go.ORDER_ATOMIC);
	if (money[0]=="-"){
		alert("转账金额不能为负");
	}else if(money.length>9){
		alert("金额超限(单笔限额十亿)");
	}
	// TODO: Assemble Go into code variable.	
	var code = 'func (t *SimpleChaincode) invoke(stub shim.ChaincodeStub, args []string) ([]byte, error) {\n';
	code += '    fmt.Printf("Running invoke")\n';
	code += '    var USER_A, USER_B string\n';
	code += '    var Aval, Bval int\n';
	code += '    var MONEY int\n';
	code += '    var err error\n';
	code += '    USER_A = \"' + usera_name + '\"\n';
	code += '    USER_B = \"' + userb_name + '\"\n';
	code += '    USER_A_val_bytes, err := stub.GetState(USER_A) \n';
	code += '    if err != nil {\n';
	code += '      return shim.Error("Failed to get state")\n';
	code += '    }\n';
	code += '    if USER_A_val_bytes == nil {\n';
	code += '      return shim.Error("Entity not found")\n';
	code += '    }\n';
	code += '    Aval, _ = strconv.Atoi(string(USER_A_val_bytes))\n';
	code += '    USER_B_val_bytes, err := stub.GetState(USER_B)\n';
	code += '    if err != nil {\n';
	code += '      return shim.Error("Failed to get state")\n';
	code += '    }\n';
	code += '    if USER_B_val_bytes == nil {\n';
	code += '      return shim.Error("Entity not found")\n';
	code += '    }\n';
	code += '    Bval, _ = strconv.Atoi(string(USER_B_val_bytes))\n';
	code += '    MONEY, err = strconv.Atoi(\"' + money + '\")\n';
	code += '    Aval = Aval -' + money + '\n';
	code += '    Bval = Bval +' + money + '\n';
	code += '    fmt.Printf("Aval = %d, Bval = %d", Aval, Bval)\n';
	code += '    err = stub.PutState(USER_A, []byte(strconv.Itoa(Aval)))\n';
	code += '    if err != nil {\n';
	code += '      return shim.Error(err.Error())\n';
	code += '    }\n';
	code += '    err = stub.PutState(USER_B, []byte(strconv.Itoa(Bval)))\n';
	code += '    if err != nil {\n';
	code += '      return shim.Error(err.Error())\n';
	code += '    }\n';
	code += '    return shim.Success(nil)\n';
	code += '}\n';
	return code;
};
Blockly.Go.chaincode_query = function(block) {
	var checkbox_check_query_security = block.getFieldValue('check_query_security') == 'TRUE';
	var value_user_query = Blockly.Go.valueToCode(block, 'user_Query', Blockly.Go.ORDER_ATOMIC);
	// TODO: Assemble Go into code variable.
	var code = 'func (t *SimpleChaincode) Query(stub shim.ChaincodeStub, args []string) pb.Response {\n';
	code += '    fmt.Printf("Running query")\n';
	code += '    var user_name string \n';
	code += '    var err error \n';
	code += '    user_name = \"' + value_user_query + '\"\n';
	code += '    user_name_val, err := stub.GetState(user_name) \n';
	code += '    if err != nil {\n';
	code += '      jsonResp := "{\\"Error\\":\\"Failed to get state for " + user_name + "\\"}"\n';
	code += '      return shim.Error(jsonResp)\n';
	code += '    }\n';
	if(checkbox_check_query_security == true) {
		code += '    if user_name_val == nil {\n';
		code += '      jsonResp := "{\\"Error\\":\\"Nil amount for " + user_name + "\\"}"\n';
		code += '      return shim.Error(jsonResp)\n';
		code += '    }\n';
	}
	code += '    jsonResp := "{\\"Name\\\":\\"" + user_name + "\\",\\"Amount\\":\\"" + string(user_name_val) + "\\"}" \n';
	code += '    fmt.Printf("Query Response:%s\\n", jsonResp) \n';
	code += '    return shim.Success(user_name_val)\n';
	code += '}\n';
	return code;
};
Blockly.Go.chaincode_delete = function(block) {
	var checkbox_check_delete_security = block.getFieldValue('check_delete_security') == 'TRUE';
	var value_user_delete = Blockly.Go.valueToCode(block, 'user_Delete', Blockly.Go.ORDER_ATOMIC);
	// TODO: Assemble Go into code variable.

	var code = 'func (t *SimpleChaincode) delete(stub shim.ChaincodeStub, args []string) ([]byte, error) {\n';
	code += '    fmt.Printf("Running delete")\n';
	code += '    user_name := \"' + value_user_delete + '\"\n';
	code += '    err := stub.DelState(user_name)\n';
	code += '    if err != nil {\n';
	code += '       return shim.Error("Failed to delete state")\n';
	code += '    }\n';
	code += '    return shim.Success(nil)\n';
	code += '}\n';
	return code;
};
Blockly.Go.set_value = function(block) {
	var checkbox_flag = block.getFieldValue('check_set_security') == 'TRUE';
	var variable_name = Blockly.Go.variableDB_.getName(block.getFieldValue('data'), Blockly.Variables.NAME_TYPE);
	var variable_value = Blockly.Go.valueToCode(block, 'VARIABLE', Blockly.Go.ORDER_ATOMIC);
	// TODO: Assemble Go into code variable.
	var valuable_val = variable_name + 'val';
	var valuable_err = 'err_' + variable_name;

	var code = 'var ' + variable_name + ' string \n';
	code += 'var ' + valuable_val + ' int \n';
	code += 'var ' + valuable_err + ' error \n';

	code += variable_name + ' = ' + '\"' + variable_name + '\"' + '\n';
	code += valuable_val + ',' + valuable_err + ' = strconv.Atoi(\"' + variable_value + '\")\n';
	if(checkbox_flag == true) {
		code += 'if ' + valuable_err + '!= nil { \n	return shim.Error("Expecting integer value for asset holding")\n}\n';
	}
	
	code += valuable_err + ' = stub.PutState(' + variable_name + ', []byte(strconv.Itoa(' + variable_value + ')))\n';
	code += 'if ' + valuable_err + ' != nil {\n  return shim.Error(' + valuable_err + '.Error())\n}\n';
	return code;
};
Blockly.Go.controls_if = function(block) {
  // If/elseif/else condition.
  var n = 0;
  var code = '', branchCode, conditionCode;
  do {
    conditionCode = Blockly.Go.valueToCode(block, 'IF' + n,
      Blockly.Go.ORDER_NONE) || 'false';
    branchCode = Blockly.Go.statementToCode(block, 'DO' + n);
    code += (n > 0 ? ' else ' : '') +
        'if  ' + conditionCode + '  {\n' + branchCode + '}';

    ++n;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE')) {
    branchCode = Blockly.Go.statementToCode(block, 'ELSE');
    code += ' else {\n' + branchCode + '}';
  }
  return code + '\n';
};

Blockly.Go.controls_ifelse = Blockly.Go['controls_if'];

Blockly.Go.logic_compare = function(block) {
  // Comparison operator.
  var OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>='
  };
  var operator = OPERATORS[block.getFieldValue('OP')];
  var order = (operator == '==' || operator == '!=') ?
      Blockly.Go.ORDER_EQUALITY : Blockly.Go.ORDER_RELATIONAL;
  var argument0 = Blockly.Go.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Go.valueToCode(block, 'B', order) || '0';
  var code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

Blockly.Go.logic_boolean = function(block) {
  // Boolean values true and false.
  var code = (block.getFieldValue('BOOL') == 'TRUE') ? 'true' : 'false';
  return [code, Blockly.Go.ORDER_ATOMIC];
};

Blockly.Go.controls_repeat_ext = function(block) {
  // Repeat n times.
  if (block.getField('TIMES')) {
    // Internal number.
    var repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    var repeats = Blockly.Go.valueToCode(block, 'TIMES',
        Blockly.Go.ORDER_ASSIGNMENT) || '0';
  }
  var branch = Blockly.Go.statementToCode(block, 'DO');
  branch = Blockly.Go.addLoopTrap(branch, block.id);
  var code = '';
  var loopVar = Blockly.Go.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    var endVar = Blockly.Go.variableDB_.getDistinctName(
        'repeat_end', Blockly.Variables.NAME_TYPE);
    code += endVar + ' = ' + repeats + ';\n';
  }
  code += 'for ' + loopVar + ' := 0; ' +
      loopVar + ' < ' + endVar + '; ' +
      loopVar + '++ {\n' +
      branch + '}\n';
  return code;
};

Blockly.Go.controls_whileUntil = function(block) {
  // Do while/until loop.
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Go.valueToCode(block, 'BOOL',
      until ? Blockly.Go.ORDER_LOGICAL_NOT :
      Blockly.Go.ORDER_NONE) || 'false';
  var branch = Blockly.Go.statementToCode(block, 'DO');
  branch = Blockly.Go.addLoopTrap(branch, block.id);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'for ' + argument0 + ' {\n' + branch + '}\n';
};

Blockly.Go.controls_for = function(block) {
  // For loop.
  var variable0 = Blockly.Go.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Go.valueToCode(block, 'FROM',
      Blockly.Go.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.Go.valueToCode(block, 'TO',
      Blockly.Go.ORDER_ASSIGNMENT) || '0';
  var increment = Blockly.Go.valueToCode(block, 'BY',
      Blockly.Go.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.Go.statementToCode(block, 'DO');
  branch = Blockly.Go.addLoopTrap(branch, block.id);
  var code;
  if (Blockly.isNumber(argument0) && Blockly.isNumber(argument1) &&
      Blockly.isNumber(increment)) {
    // All arguments are simple numbers.
    var up = parseFloat(argument0) <= parseFloat(argument1);
    code = 'for ' + variable0 + ' = ' + argument0 + '; ' +
        variable0 + (up ? ' <= ' : ' >= ') + argument1 + '; ' +
        variable0;
    var step = Math.abs(parseFloat(increment));
    if (step == 1) {
      code += up ? '++' : '--';
    } else {
      code += (up ? ' += ' : ' -= ') + step;
    }
    code += ' {\n' + branch + '}\n';
  } else {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    var startVar = argument0;
    if (!argument0.match(/^\w+$/) && !Blockly.isNumber(argument0)) {
      startVar = Blockly.Go.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += 'var ' + startVar + ' = ' + argument0 + ';\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !Blockly.isNumber(argument1)) {
      var endVar = Blockly.Go.variableDB_.getDistinctName(
          variable0 + '_end', Blockly.Variables.NAME_TYPE);
      code += 'var ' + endVar + ' = ' + argument1 + ';\n';
    }
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    var incVar = Blockly.Go.variableDB_.getDistinctName(
        variable0 + '_inc', Blockly.Variables.NAME_TYPE);
    code += 'var ' + incVar + ' = ';
    if (Blockly.isNumber(increment)) {
      code += Math.abs(increment) + ';\n';
    } else {
      code += 'Math.abs(' + increment + ');\n';
    }
    code += 'if (' + startVar + ' > ' + endVar + ') {\n';
    code += Blockly.Go.INDENT + incVar + ' = -' + incVar + ';\n';
    code += '}\n';
    code += 'for (' + variable0 + ' = ' + startVar + '; ' +
        incVar + ' >= 0 ? ' +
        variable0 + ' <= ' + endVar + ' : ' +
        variable0 + ' >= ' + endVar + '; ' +
        variable0 + ' += ' + incVar + ') {\n' +
        branch + '}\n';
  }
  return code;
};

Blockly.Go.math_number = function(block) {
  // Numeric value.
  var code = parseFloat(block.getFieldValue('NUM'));
  return [code, Blockly.Go.ORDER_ATOMIC];
};

Blockly.Go.math_arithmetic = function(block) {
  // Basic arithmetic operators, and power.
  var OPERATORS = {
    'ADD': [' + ', Blockly.Go.ORDER_ADDITION],
    'MINUS': [' - ', Blockly.Go.ORDER_SUBTRACTION],
    'MULTIPLY': [' * ', Blockly.Go.ORDER_MULTIPLICATION],
    'DIVIDE': [' / ', Blockly.Go.ORDER_DIVISION],
    'POWER': [null, Blockly.Go.ORDER_COMMA]  // Handle power separately.
  };
  var tuple = OPERATORS[block.getFieldValue('OP')];
  var operator = tuple[0];
  var order = tuple[1];
  var argument0 = Blockly.Go.valueToCode(block, 'A', order) || '0';
  var argument1 = Blockly.Go.valueToCode(block, 'B', order) || '0';
  var code;
  // Power in Go requires a special case since it has no operator.
  if (!operator) {
    code = 'Math.pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Blockly.Go.ORDER_FUNCTION_CALL];
  }
  code = argument0 + operator + argument1;
  return [code, order];
};

Blockly.Go.text  = function(block) {
  // Text value.
  var code = Blockly.Go.quote_(block.getFieldValue('TEXT'));
  return [code, Blockly.Go.ORDER_ATOMIC];
};

Blockly.Go.text_print = function(block) {
  // Print statement.
  var msg = Blockly.Go.valueToCode(block, 'TEXT',
      Blockly.Go.ORDER_NONE) || '\'\'';
  return 'fmt.Printf(\"' + msg.slice(1,msg.length-1) + '\");\\n';
};

Blockly.Go.variables_get  = function(block) {
  // Variable getter.
  var code = Blockly.Go.variableDB_.getName(block.getFieldValue('VAR'),
      Blockly.Variables.NAME_TYPE);
  return [code, Blockly.Go.ORDER_ATOMIC];
};

Blockly.Go.variables_set = function(block) {
  // Variable setter.
  var argument0 = Blockly.Go.valueToCode(block, 'VALUE',
      Blockly.Go.ORDER_ASSIGNMENT) || '0';
  var varName = Blockly.Go.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  return varName + ' = ' + argument0 + ';\n';
};

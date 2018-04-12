
'use strict';

goog.provide('Blockly.Blocks.natural');  // Deprecated
goog.provide('Blockly.Constants.Natural');

goog.require('Blockly.Blocks');


/**
 * Common HSV hue for all blocks in this category.
 * This should be the same as Blockly.Msg.COLOUR_HUE.
 * @readonly
 */
Blockly.Constants.Natural.HUE = 200;
/** @deprecated Use Blockly.Constants.Colour.HUE */
Blockly.Blocks.natural.HUE = Blockly.Constants.Natural.HUE;


Blockly.defineBlocksWithJsonArray([
	{
	  "type": "chaincode_init",
	  "message0": "Init %1 %2",
	  "args0": [
		{
		  "type": "input_dummy"
		},
		{
		  "type": "input_statement",
		  "name": "init_func"
		}
	  ],
	  "nextStatement": null,
	  "colour": 330,
	  "tooltip": "Init: Set the user and their account. 初始化：设置用户及其账本",
	  "helpUrl": "www.baidu.com"
	},
	{
	  "type": "chaincode_body",
	  "message0": "Body %1 %2",
	  "args0": [
		{
		  "type": "input_dummy"
		},
		{
		  "type": "input_statement",
		  "name": "body_func"
		}
	  ],
	  "previousStatement": null,
	  "colour": 230,
	  "tooltip": "Body: Implement the terms of the smart contract. ",
	  "helpUrl": ""
	},
	{
	  "type": "chaincode_init_body",
	  "message0": "Init %1 %2 body %3 %4",
	  "args0": [
		{
		  "type": "input_dummy"
		},
		{
		  "type": "input_statement",
		  "name": "init_func"
		},
		{
		  "type": "input_dummy"
		},
		{
		  "type": "input_statement",
		  "name": "body_func"
		}
	  ],
	  "nextStatement": null,
	  "colour": 330,
	  "tooltip": "init_body: This is a block for init and realize the smart contract ",
	  "helpUrl": ""
	},
	{
	  "type": "chaincode_invoke",
	  "message0": "invoke %1 payer %2 payee %3 money %4 security %5",
	  "args0": [
		{
		  "type": "input_dummy"
		},
		{
		  "type": "input_value",
		  "name": "user_A",
		  "check": "String",
		  "align": "RIGHT"
		},
		{
		  "type": "input_value",
		  "name": "user_B",
		  "check": "String",
		  "align": "RIGHT"
		},
		{
		  "type": "input_value",
		  "name": "money_num",
		  "check": "Number",
		  "align": "RIGHT"
		},
		{
		  "type": "field_checkbox",
		  "name": "check_invoke_security",
		  "checked": true
		}
	  ],
	  "inputsInline": false,
	  "previousStatement": null,
	  "nextStatement": null,
	  "colour": 0,
	  "tooltip": "",
	  "helpUrl": ""
	},
	{
	  "type": "chaincode_query",
	  "message0": "Query security %1   %2 user %3",
	  "args0": [
		{
		  "type": "field_checkbox",
		  "name": "check_query_security",
		  "checked": true
		},
		{
		  "type": "input_dummy"
		},
		{
		  "type": "input_value",
		  "name": "user_Query",
		  "check": "String",
		  "align": "RIGHT"
		}
	  ],
	  "inputsInline": true,
	  "previousStatement": null,
	  "nextStatement": null,
	  "colour": 165,
	  "tooltip": "Query: This is used for query the account of the user.",
	  "helpUrl": ""
	},
	{
	  "type": "chaincode_delete",
	  "message0": "Delete Security %1   %2 user %3",
	  "args0": [
		{
		  "type": "field_checkbox",
		  "name": "check_delete_security",
		  "checked": true
		},
		{
		  "type": "input_dummy"
		},
		{
		  "type": "input_value",
		  "name": "user_Delete",
		  "align": "RIGHT"
		}
	  ],
	  "inputsInline": true,
	  "previousStatement": null,
	  "nextStatement": null,
	  "colour": 65,
	  "tooltip": "Delete: Delete the user with his account.",
	  "helpUrl": ""
	},
	{
	  "type": "set_value",
	  "message0": "set  security %1 %2 %3 %4",
	  "args0": [
		{
		  "type": "field_checkbox",
		  "name": "check_set_security",
		  "checked": true
		},
		{
		  "type": "input_dummy"
		},
		{
		  "type": "field_variable",
		  "name": "data",
		  "variable": "variable"
		},
		{
		  "type": "input_value",
		  "name": "VARIABLE",
		  "check": "Number"
		}
	  ],
	  "inputsInline": true,
	  "previousStatement": null,
	  "nextStatement": null,
	  "colour": 330,
	  "tooltip": "set_value: init user's account.",
	  "helpUrl": ""
	}
]);  // END JSON EXTRACT (Do not delete this comment.)

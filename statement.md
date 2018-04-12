#not a full version
This is the copy from Incas.old\
a branch from smileweiwei/ChaincodeDesigner

#The old version readme.md is as follow:
# ChaincodeDesigner

***September 12, 2017***

***HIP Identifier: Chaincode Designer v0.6.2***

# Sponsors: 

Bei Wang -- Yunphant (wangbei@yunphant.com)

Qingpeng Cai -- Yunphant (qingpengcai@yunphant.com)

# Abstract:

For financial staffs, it will take long time to design and test a smart contract-- Chaincode. So we especially develop a Chaincode Designer for fintech. 

The general operation sequence in a Chaincode Designer is as follows:

1. Only by dragging or dropping controls, changing some parameters
2. making the transactions in order, everyone can finish a financial contract.
3. After that, export the code and run it in the channel, a transaction is finished.

Now, we have already finished the following advantages:

 - Workspace synchronize with code area
 - Workspace can be imported and exported
 - Save the transaction code using the go language
 - Work with natural language
 - Support multiply functions, such as Undo, Redo, Zoom in, Zoom out, Center and so on.


# Context :

This project is derived from the financial contract. Most contract is based on the template, so can code. There are some examples in the official code in fabric v1.0.0, such as example02 in Chaincode example. It’s a simple transaction which includes init, query, invoke, delete and so on. Based on it, we find that we can make a Chaincode designer to simplify our work in coding.


# Dependent Projects:

This demo is based on an Open Source Software called [Google Blockly](https://developers.google.com/blockly). Blockly is a client-side JavaScript library for creating visual block programming languages and editors. It is a project of Google and is open-source under the Apache 2.0 License.

Based on the engine, we make some new design and improvement. We are perfecting the language for go and natural which is still under test. And we add some new function in our interface.

# Motivation:

The Hyperledger project is an open source collaborative effort created to advance cross-industry distributed ledger technologies. It is a global collaboration including leaders in finance, banking, the IoT, supply chain, manufacturing and technology.

This Chaincode Designer is developed for those financial staffs who don’t know how to write the code. In my opinion, it will be a useful tool for them to participate in the Hyperledger finance. Besides, we didn't see the similar projects in the fabric or others temporarily which is also the reason why we want the committee to pass this proposal.

We use html, javascript and other web languages to keep on developing this project. And we propose Chaincode Designer to become a new project for Hyperledger Projects, because we believe chaincode designer can save the time in programing, reduce the difficulty in engaging in financial transaction, and promote the development and application of Hyperledger in the financial field.

# Status:
    
proposal

# Solution:

The following project workflows to be considered:

 - The creation of detailed Product Brochures
 - The creation of detailed User Manuals
 - More controls for financial transaction
 - More templates for financial transaction
 - Development of code security examining tool

# Effort and resources:

Yunphant company are committing full-time engineering resource to prefect this project. And we are trying to seek to work with other Hyperledger projects. The following would be the initial set of maintainers for the project: Bei Wang, Qingpeng Cai.

In addition, other engineers from Yunphant will also contribute to the project over time. Members of CCNT Lab in Zhejiang University have also shown interest in contributing to the development of this Chaincode Designer implementation.



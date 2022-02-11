const { isCommand } = require('../utils/helpers')

module.exports = {
    rules : {
        'no-debug' : {
            meta : {
                type : 'problem',
                docs : {
                    description : 'Disallow browser.debug() in tests',
                    category    : 'Possible Errors',
                    url         : 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/no-debug.md',
                    recommended : true,
                },
                messages : {
                    unexpectedDebug : 'Unexpected browser.debug() not allowed'
                },
                hasSuggestions : true
            },
            create : function(context) {
                return {
                    CallExpression(node) {
                        if (isCommand(node.callee, 'debug')) {
                            context.report({
                                node,
                                messageId : 'unexpectedDebug'
                            })
                        }
                    }
                }
            }
        }
    }
}

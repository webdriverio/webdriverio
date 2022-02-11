const { isCommand } = require('../utils/helpers')

module.exports = {
    rules : {
        'no-pause' : {
            meta : {
                type : 'problem',
                docs : {
                    description : 'Disallow browser.pause() in tests',
                    category    : 'Possible Errors',
                    url         : 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/no-pause.md',
                },
                messages : {
                    unexpectedPause : 'Unexpected browser.pause() not allowed'
                },
                hasSuggestions : true
            },
            create : function(context) {
                return {
                    CallExpression(node) {
                        if (isCommand(node.callee, 'pause')) {
                            context.report({
                                node,
                                messageId : 'unexpectedPause'
                            })
                        }
                    }
                }
            }
        }
    }
}

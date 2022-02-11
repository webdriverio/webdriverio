module.exports = {
    rules : {
        'await-expect' : {
            meta   : {
                type : 'problem',
                docs : {
                    description : 'expect must be prefixed with await',
                    category    : 'Possible Errors',
                    url         : 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/await-expect.md',
                    recommended : true,
                },
                messages : {
                    missingAwait : 'Missing await before an expect statement'
                },
                hasSuggestions : true
            },
            create : function(context) {
                return {
                    CallExpression(node) {
                        const name = node.callee.name

                        if (name === 'expect') {
                            const parentType = node.parent && node.parent.parent && node.parent.parent.parent ? node.parent.parent.parent.type : false

                            if (parentType && parentType !== 'AwaitExpression') {
                                context.report({
                                    node,
                                    messageId : 'missingAwait',
                                })
                            }
                        }
                    }
                }
            }
        }
    }
}

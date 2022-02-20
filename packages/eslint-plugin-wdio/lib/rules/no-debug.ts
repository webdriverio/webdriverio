import type { TSESTree, TSESLint } from '@typescript-eslint/utils'
import { isCommand } from '../utils/helpers'

const rule: any = {
    meta : {
        type : 'problem',
        docs : {
            description : 'Disallow browser.debug() in tests',
            category    : 'Possible Errors',
            url         : 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/no-debug.md',
            recommended : false,
        },
        messages : {
            unexpectedDebug : 'Unexpected browser.debug() not allowed'
        },
        hasSuggestions : true,
        schema : [],
    },

    create : function(context: TSESLint.RuleContext<string, unknown[]>) {
        return {
            CallExpression(node: TSESTree.CallExpression): void {
                if (isCommand(node, 'debug')) {
                    context.report({
                        node,
                        messageId : 'unexpectedDebug'
                    })
                }
            }
        }
    }
}

export default rule

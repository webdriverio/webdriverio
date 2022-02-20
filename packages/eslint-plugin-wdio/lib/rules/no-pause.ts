import type { TSESTree, TSESLint } from '@typescript-eslint/utils'
import { isCommand } from '../utils/helpers'

const rule: any = {
    meta : {
        type : 'problem',
        docs : {
            description : 'Disallow browser.pause() in tests',
            category    : 'Possible Errors',
            url         : 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/no-pause.md',
            recommended : false,
        },
        messages : {
            unexpectedPause : 'Unexpected browser.pause() not allowed'
        },
        hasSuggestions : true,
        schema : [],
    },

    create : function(context: TSESLint.RuleContext<string, unknown[]>) {
        return {
            CallExpression(node: TSESTree.CallExpression): void {
                if (isCommand(node, 'pause')) {
                    context.report({
                        node,
                        messageId : 'unexpectedPause'
                    })
                }
            }
        }
    }
}

export default rule

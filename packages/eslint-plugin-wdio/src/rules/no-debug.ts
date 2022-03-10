import { Rule } from 'eslint'
import { isCommand } from '../utils/helpers'

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow browser.debug() in tests',
            category: 'Possible Errors',
            url: 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/no-debug.md',
            recommended: false,
        },
        messages: {
            unexpectedDebug: 'Unexpected browser.debug() not allowed'
        },
        hasSuggestions: true,
        schema: [],
    },

    create: function (context: Rule.RuleContext): Rule.RuleListener {
        return {
            CallExpression(node): void {
                if (isCommand(node, 'debug')) {
                    context.report({ node, messageId: 'unexpectedDebug' })
                }
            }
        }
    }
}

export default rule

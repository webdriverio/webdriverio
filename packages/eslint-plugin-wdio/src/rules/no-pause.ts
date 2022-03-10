import { Rule } from 'eslint'
import { isCommand } from '../utils/helpers'

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow browser.pause() in tests',
            category: 'Possible Errors',
            url: 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/no-pause.md',
            recommended: false,
        },
        messages: {
            unexpectedPause: 'Unexpected browser.pause() not allowed'
        },
        hasSuggestions: true,
        schema: [],
    },

    create: function (context: Rule.RuleContext): Rule.RuleListener {
        return {
            CallExpression(node): void {
                if (isCommand(node, 'pause')) {
                    context.report({ node, messageId: 'unexpectedPause' })
                }
            }
        }
    }
}

export default rule

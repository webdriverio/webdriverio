import type { Rule } from 'eslint'
import { isCommand } from '../utils/helpers.js'

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow browser.debug() in tests',
            category: 'Possible Errors',
            url: 'https://github.com/webdriverio/webdriverio/blob/main/packages/eslint-plugin-wdio/docs/rules/no-debug.md',
            recommended: false,
        },
        messages: {
            unexpectedDebug: 'Unexpected browser.debug() not allowed'
        },
        hasSuggestions: true,
        schema: [{
            type: 'object',
            properties: {
                instances: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    description: 'List of browser instances to check (default: ["browser"])',
                    default: ['browser'],
                },
            },
            additionalProperties: false,
        }],
    },

    create: function (context: Rule.RuleContext): Rule.RuleListener {
        const options = context.options[0] || {}
        const instances = options.instances || ['browser']
        return {
            CallExpression(node): void {
                if (isCommand(node, 'debug', instances)) {
                    context.report({
                        node,
                        messageId: 'unexpectedDebug',
                        data: { instance: instances.join(', ') }
                    })
                }
            }
        }
    }
}

export default rule

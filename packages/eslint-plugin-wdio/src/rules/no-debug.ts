import type { Rule } from 'eslint'
import { getCommandInstance } from '../utils/helpers.js'

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow browser.debug() in tests',
            url: 'https://github.com/webdriverio/webdriverio/blob/main/packages/eslint-plugin-wdio/docs/rules/no-debug.md',
            recommended: false,
        },
        messages: {
            unexpectedDebug: 'Unexpected {{ instance }}.debug() not allowed'
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
                    description: 'List of browser instances to check (default: ["browser", "driver"])',
                    default: ['browser', 'driver'],
                },
            },
            additionalProperties: false,
        }],
    },

    create: function (context: Rule.RuleContext): Rule.RuleListener {
        const options = context.options[0] || {}
        const instances = options.instances || ['browser', 'driver']
        return {
            CallExpression(node): void {
                const instance = getCommandInstance(node, 'debug', instances)
                if (instance) {
                    context.report({
                        node,
                        messageId: 'unexpectedDebug',
                        data: { instance }
                    })
                }
            }
        }
    }
}

export default rule

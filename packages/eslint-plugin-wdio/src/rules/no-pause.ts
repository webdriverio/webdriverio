import type { Rule } from 'eslint'
import { getCommandInstance } from '../utils/helpers.js'

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Disallow browser.pause() in tests',
            url: 'https://github.com/webdriverio/webdriverio/blob/main/packages/eslint-plugin-wdio/docs/rules/no-pause.md',
            recommended: false,
        },
        messages: {
            unexpectedPause: 'Unexpected {{ instance }}.pause() not allowed'
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
                const instance = getCommandInstance(node, 'pause', instances)
                if (instance) {
                    context.report({
                        node,
                        messageId: 'unexpectedPause',
                        data: { instance }
                    })
                }
            }
        }
    }
}

export default rule

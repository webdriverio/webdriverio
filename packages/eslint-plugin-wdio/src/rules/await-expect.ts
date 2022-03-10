import type { Rule } from 'eslint'

import { MATCHERS } from '../constants'

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'expect must be prefixed with await',
            category: 'Possible Errors',
            url: 'https://github.com/webdriverio/packages/eslint-plugin-wdio/docs/rules/await-expect.md',
            recommended: false,
        },
        messages: {
            missingAwait: 'Missing await before an expect statement'
        },
        hasSuggestions: true
    },

    create: function (context: Rule.RuleContext): Rule.RuleListener {
        return {
            MemberExpression(node: any): void {
                const object = node.object?.callee?.name
                const property = node.property?.name
                const parentType = node?.parent?.parent?.type ?? false

                if (object === 'expect' && MATCHERS.includes(property) && parentType !== 'AwaitExpression') {
                    context.report({ node, messageId: 'missingAwait' })
                }
            }
        }
    }
}

export default rule

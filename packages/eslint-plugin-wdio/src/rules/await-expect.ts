import type { Rule } from 'eslint'
import type { Identifier } from 'estree'

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
            CallExpression(node): void {
                /**
                 * validate we have an expect statement that
                 * calls some of the WebdriverIO matchers
                 */
                if (
                    node.callee.type !== 'MemberExpression' ||
                    node.callee.object.type !== 'CallExpression' ||
                    (node.callee.object.callee as Identifier).name !== 'expect' ||
                    !MATCHERS.includes((node.callee.property as Identifier).name)
                ) {
                    return
                }

                /**
                 * fail rule if:
                 */
                if (
                    /**
                     * expect is called without an `await` and as part of an
                     * expression
                     */
                    node.parent.type === 'ExpressionStatement'
                ) {
                    context.report({ node, messageId: 'missingAwait' })
                }
            }
        }
    }
}

export default rule

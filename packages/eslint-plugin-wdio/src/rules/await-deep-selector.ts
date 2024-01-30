import type { Rule } from 'eslint'

const rule: Rule.RuleModule = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Await should be used before a deep selector (>>>)',
            category: 'Possible Errors',
            url: 'https://github.com/webdriverio/webdriverio/blob/main/packages/eslint-plugin-wdio/docs/rules/await-deep-selector.md',
            recommended: false,
        },
        messages: {
            missingAwaitDeep: 'Missing await before a deep selector (>>>)'
        },
        hasSuggestions: true,
    },
    create: function (context: Rule.RuleContext): Rule.RuleListener {
        return {
            Identifier(node) {
                if (
                    node.type === 'Identifier' &&
                    (node.name === '$' || node.name === '$$') &&
                    node.parent.parent.type !== 'AwaitExpression' &&
                    node.parent.parent.type !== 'MemberExpression' &&
                    node.parent.parent.type !== 'ReturnStatement' &&
                    node.parent.parent.type !== 'ArrowFunctionExpression' &&
                    'arguments' in node.parent &&
                    node.parent.arguments.some(
                        a => 'value' in a && typeof a.value === 'string' && /.*>>>.*/.test(a.value || '')
                    )
                ) {
                    context.report({ node, messageId: 'missingAwaitDeep' })
                }
            },
        }
    },
}

export default rule

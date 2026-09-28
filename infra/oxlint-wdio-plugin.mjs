/**
 * Oxlint JS plugin wrapper for the WebdriverIO ESLint rules used by this repo.
 * The published `eslint-plugin-wdio` package stays ESLint-first; this file is a
 * plain ESM entry so Oxlint can load the rules without a prior TypeScript build.
 */
import pkg from '../packages/eslint-plugin-wdio/package.json' with { type: 'json' }

const MATCHERS = [
    'toBeChecked',
    'toBeClickable',
    'toBeDisabled',
    'toBeDisplayed',
    'toBeDisplayedInViewport',
    'toBeElementsArrayOfSize',
    'toBeEnabled',
    'toBeExisting',
    'toBeFocused',
    'toBePresent',
    'toBeRequested',
    'toBeRequestedTimes',
    'toBeRequestedWith',
    'toBeRequestedWithResponse',
    'toBeSelected',
    'toExist',
    'toHaveAttr',
    'toHaveAttribute',
    'toHaveAttributeAndValue',
    'toHaveChildren',
    'toHaveClass',
    'toHaveClipboardText',
    'toHaveComputedLabel',
    'toHaveComputedRole',
    'toHaveElementClass',
    'toHaveElementProperty',
    'toHaveHTML',
    'toHaveHeight',
    'toHaveHref',
    'toHaveId',
    'toHaveLink',
    'toHaveLocalStorageItem',
    'toHaveSize',
    'toHaveStyle',
    'toHaveText',
    'toHaveTitle',
    'toHaveUrl',
    'toHaveValue',
    'toHaveWidth',
]

const selectorFunctions = ['$', '$$']
const snapshotMatchers = ['toMatchSnapshot', 'toMatchInlineSnapshot']

function isCommand (expression, command, instances = ['browser']) {
    const callee = expression?.callee
    return (
        callee &&
        'object' in callee &&
        'name' in callee.object &&
        instances.includes(callee.object?.name) &&
        'property' in callee &&
        'name' in callee.property &&
        callee.property?.name === command
    )
}

function commandRule (command, messageId, description) {
    return {
        meta: {
            type: 'problem',
            docs: { description },
            messages: { [messageId]: `Unexpected browser.${command}() not allowed` },
            schema: [{
                type: 'object',
                properties: {
                    instances: {
                        type: 'array',
                        items: { type: 'string' },
                    },
                },
                additionalProperties: false,
            }],
        },
        create (context) {
            const instances = context.options[0]?.instances || ['browser']
            return {
                CallExpression (node) {
                    if (isCommand(node, command, instances)) {
                        context.report({ node, messageId })
                    }
                }
            }
        }
    }
}

const awaitExpect = {
    meta: {
        type: 'problem',
        docs: { description: 'expect must be prefixed with await' },
        messages: {
            missingAwait: 'Missing await before an expect statement'
        },
    },
    create (context) {
        return {
            CallExpression (node) {
                if (
                    node.callee.type !== 'MemberExpression' ||
                    node.callee.object.type !== 'CallExpression' ||
                    node.callee.object.callee.name !== 'expect'
                ) {
                    return
                }

                const propertyName = node.callee.property.name
                const isWdioMatcher = MATCHERS.includes(propertyName)
                const isSnapshotMatcher = snapshotMatchers.includes(propertyName)

                if (!isWdioMatcher && !isSnapshotMatcher) {
                    return
                }

                if (isSnapshotMatcher) {
                    const expectArg = node.callee.object.arguments[0]
                    const isLikelyWdioElement = (
                        (expectArg.type === 'CallExpression' &&
                        expectArg.callee.type === 'Identifier' &&
                        selectorFunctions.includes(expectArg.callee.name)) ||
                        (expectArg.type === 'CallExpression' &&
                        expectArg.callee.type === 'MemberExpression' &&
                        expectArg.callee.property.name &&
                        selectorFunctions.includes(expectArg.callee.property.name))
                    )

                    if (!isLikelyWdioElement) {
                        return
                    }
                }

                if (node.parent.type === 'ExpressionStatement') {
                    context.report({ node, messageId: 'missingAwait' })
                }
            }
        }
    }
}

export default {
    meta: {
        name: pkg.name,
        version: pkg.version
    },
    rules: {
        'await-expect': awaitExpect,
        'no-debug': commandRule('debug', 'unexpectedDebug', 'Disallow browser.debug() in tests'),
        'no-pause': commandRule('pause', 'unexpectedPause', 'Disallow browser.pause() in tests'),
    }
}

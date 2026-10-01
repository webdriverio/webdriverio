import { createRequire } from 'node:module'
import type { Rule } from 'eslint'

const require = createRequire(import.meta.url)

// Load the rule through `typescript-eslint`, the declared peer. Its dependency
// `@typescript-eslint/eslint-plugin` does not resolve from this package under a
// strict layout (pnpm `hoist: false`, Yarn PnP).
const loadTsRule = () => {
    try {
        return require('typescript-eslint').plugin.rules['no-floating-promises']
    } catch {
        return null
    }
}

const tsRule = loadTsRule()

const rule: Rule.RuleModule = {
    meta: tsRule?.meta ?? {
        type: 'problem',
        docs: {
            description: 'Check for unhandled promises',
            url: 'https://github.com/webdriverio/webdriverio/blob/main/packages/eslint-plugin-wdio/docs/rules/no-floating-promise.md',
        },
        schema: []
    },
    create: function (context: Rule.RuleContext): Rule.RuleListener{
        if (!tsRule) {
            throw new Error('wdio/no-floating-promise needs the "typescript-eslint" package. Install it with "npm install --save-dev typescript-eslint".')
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return tsRule.create(context as any)
        } catch (err) {
            console.error('Error in no-floating-promise rule:', err)
            return {}
        }
    }
}

export default rule


import { createRequire } from 'node:module'
import type { Rule } from 'eslint'

const require = createRequire(import.meta.url)
const tryRequire = (moduleName: string) => {
    try {
        return require(moduleName)
    } catch {
        return null
    }
}

const tsEslintPlugin = tryRequire('@typescript-eslint/eslint-plugin')

const tsRule = tsEslintPlugin?.rules['no-floating-promises']
let error: string | undefined

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
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return tsRule?.create(context as any) as any ?? {}
        } catch {
            console.error('Error in no-floating-promise rule:', error)
            return {}
        }
    }
}

export default rule

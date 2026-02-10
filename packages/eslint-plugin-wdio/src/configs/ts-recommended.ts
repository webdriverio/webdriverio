import { createRequire } from 'node:module'
import plugin from '../plugin.js'
import { sharedGlobals } from '../globals.js'
import noFloatingPromise from '../rules/no-floating-promise.js'
import type { Rule } from 'eslint'
import { isTypeAware } from '../utils/typeAware.js'

const require = createRequire(import.meta.url)

const tsRecommended = () => {
    const tseslint = require('typescript-eslint')

    const typescriptPlugin = {
        ...plugin,
        rules: {
            ...plugin.rules,
            'no-floating-promise': noFloatingPromise
        }
    }

    return {
        languageOptions: {
            globals: sharedGlobals,
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
            },
        },
        plugins: {
            wdio: typescriptPlugin,
        },
        rules: {
            'wdio/await-expect': 'off',
            'wdio/no-debug': 'error',
            'wdio/no-pause': 'error',
            'wdio/no-floating-promise': 'error'
        },
        // Because of the required `projectService: true,` above we see `Parsing error`, doing the below remove that eslint error.
        ignores: ['eslint.config.js', 'eslint.config.cjs', 'eslint.config.mjs'],
    }
}

export const rules = {
    ...plugin.rules,
    'no-floating-promise': noFloatingPromise
} satisfies Record<string, Rule.RuleModule>

export default isTypeAware ? tsRecommended() :  undefined

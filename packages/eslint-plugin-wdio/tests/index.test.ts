import globals from 'globals'
import { expect, test } from 'vitest'
import index from '../src/index.js'
import pkg from '../package.json' with { type: 'json' }

test('should export proper plugin configuration', () => {
    const rules = {
        'wdio/await-expect': 'off',
        'wdio/no-debug': 'error',
        'wdio/no-pause': 'error',
        'wdio/no-floating-promise': 'error'
    }

    // WDIO names are this package's contract. Mocha and Node come from the
    // globals dependency, spread in that order so a future collision matches
    // sharedGlobals. Do not paste those sets by hand.
    const recommendedGlobals = {
        '$': false,
        '$$': false,
        browser: false,
        driver: false,
        expect: false,
        multiRemoteBrowser: false,
        ...globals.mocha,
        ...globals.node,
    }

    expect(index).toEqual({
        meta: {
            name: 'eslint-plugin-wdio',
            version: pkg.version
        },
        configs: {
            'flat/recommended': {
                languageOptions: {
                    globals: recommendedGlobals,
                    parser: expect.any(Object),
                    parserOptions: {
                        projectService: true,
                    },
                },
                plugins: {
                    wdio: {
                        meta: {
                            name: 'eslint-plugin-wdio',
                            version: pkg.version
                        },
                        configs: {},
                        rules: {
                            'await-expect': expect.any(Object),
                            'no-debug': expect.any(Object),
                            'no-pause': expect.any(Object),
                            'no-floating-promise': expect.any(Object)
                        }
                    },
                },
                rules,
                ignores: [
                    'eslint.config.js',
                    'eslint.config.cjs',
                    'eslint.config.mjs'
                ],
            },
        },
        rules
    })
})

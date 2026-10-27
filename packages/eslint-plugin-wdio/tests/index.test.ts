import globals from 'globals'
import { expect, test } from 'vitest'
import index from '../src/index.js'
import pkg from '../package.json' with { type: 'json' }
import plugin from '../src/plugin.js'

test('should export proper plugin configuration', () => {
    const rules = {
        'wdio/await-expect': 'off',
        'wdio/no-debug': 'error',
        'wdio/no-pause': 'error',
        'wdio/no-floating-promise': 'error'
    }

    // Mocha and Node names come from the globals package, so a globals release does not break this list
    const recommendedGlobals = {
        $: false,
        $$: false,
        browser: false,
        driver: false,
        expect: false,
        multiremotebrowser: false,
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
            recommended: {
                rules: {
                    'wdio/await-expect': 'error',
                    'wdio/no-debug': 'error',
                    'wdio/no-pause': 'error',
                },
                globals: recommendedGlobals,
                plugins: ['wdio'],
            }
        },
        rules
    })
})


// @ts-check
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

import { configs as wdioConfig } from 'eslint-plugin-wdio'
import unicorn from 'eslint-plugin-unicorn'
import globals from 'globals'

export default tseslint.config(
    {
        /**
         * Eslint ignore patterns for the whole project
         */
        ignores: [
            'packages/**/build',
            'packages/**/cjs',
            'packages/**/node_modules',
            'packages/node_modules',
            'packages/**/coverage',
            'tests/typings',
            '**/*.d.ts',
            'packages/wdio-protocols/src/protocols/webdriverBidi.ts',
            'packages/webdriverio/third_party/fake-timers.js',
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        /**
         * common Eslint rules
         */
        extends: [wdioConfig['flat/recommended']],
        plugins: {
            unicorn
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },
        },

        rules: {
            quotes: ['error', 'single', {
                avoidEscape: true,
            }],

            camelcase: ['error', {
                properties: 'never',
            }],

            semi: ['error', 'never'],
            indent: [2, 4],
            eqeqeq: ['error', 'always'],
            'prefer-const': 'error',

            'no-multiple-empty-lines': [2, {
                max: 1,
                maxEOF: 1,
            }],

            'array-bracket-spacing': ['error', 'never'],

            'brace-style': ['error', '1tbs', {
                allowSingleLine: true,
            }],

            'comma-spacing': ['error', {
                before: false,
                after: true,
            }],

            'no-lonely-if': 'error',
            'dot-notation': 'error',
            'no-else-return': 'error',
            'no-tabs': 'error',

            'no-trailing-spaces': ['error', {
                skipBlankLines: false,
                ignoreComments: false,
            }],

            'no-var': 'error',
            'unicode-bom': ['error', 'never'],
            curly: ['error', 'all'],
            'object-curly-spacing': ['error', 'always'],
            'keyword-spacing': ['error'],
            'require-atomic-updates': 0,
            'linebreak-style': ['error', 'unix'],
            'unicorn/prefer-node-protocol': ['error'],
            'no-restricted-syntax': ['error', 'IfStatement > ExpressionStatement > AssignmentExpression'],
            'unicorn/prefer-ternary': 'error',
            'no-dupe-class-members': 'off',
        },
    }, {
        /**
         * Rules explicitly for TypeScript files
         */
        files: ['**/*.ts'],

        rules: {
            'dot-notation': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'off',
            '@typescript-eslint/triple-slash-reference': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            'no-undef': 'off',
            'no-redeclare': 'off',
        },
    }, {
        /**
         * Eslint rules for /tests folder
         */
        files: [
            'tests/**/*.ts',
            'tests/**/*.js',
        ],
        languageOptions: {
            globals: {
                ...globals.mocha,
                ...globals.jasmine,
                browser: true,
                $: true
            }
        },
        rules: {
            'dot-notation': 'off',
            'wdio/no-pause': 'off',
            'wdio/no-debug': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-require-imports': 'off',
        }
    }, {
        /**
         * Eslint rules for all unit tests
         */
        files: ['packages/**/*.test.ts'],
        rules: {
            'wdio/no-pause': 'off',
            'wdio/no-debug': 'off',
            '@typescript-eslint/no-explicit-any': 'off'
        }
    }, {
        /**
         * Eslint rules for /example directory
         */
        languageOptions: {
            globals: {
                ...globals.mocha,
                ...globals.jasmine,
                browser: true,
                $: true
            }
        },
        rules: {
            'no-undef': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            'wdio/no-pause': 'off',
            'wdio/no-debug': 'off',
        }
    }
)

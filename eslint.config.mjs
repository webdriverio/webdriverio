import wdioEslint, { globals } from '@wdio/eslint'

export default wdioEslint.config([
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
            'packages/wdio-protocols/src/commands'
        ],
    },
    {
        /**
         * Eslint rules for /example directory, e2e and unit tests
         */
        files: [
            'e2e/**/*.test.ts',
            'e2e/**/*.test.js',
            'examples/**/*.ts',
            'examples/**/*.js',
            'packages/**/*.test.ts',
            'packages/**/tests/**/*.ts'
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
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'wdio/no-pause': 'off',
            'wdio/no-debug': 'off',
        }
    },
    {
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
    }
])

import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        dangerouslyIgnoreUnhandledErrors: true,
        include: ['packages/**/Percy-Handler.test.ts'],
        /**
         * not to ESM ported packages
         */
        exclude: [
            'dist', '.idea', '.git', '.cache',
            '**/node_modules/**',
            'packages/eslint-plugin-wdio/**/*'
        ],
        env: {
            WDIO_SKIP_DRIVER_SETUP: '1'
        },
        coverage: {
            enabled: true,
            provider: 'v8',
            exclude: [
                '**/__mocks__/**',
                '**/build/**',
                '**/cjs/*.ts',
                '**/*.test.ts',
                // we are using e2e tests for ensuring the functionality works
                // check out the ./e2e folder
                'packages/devtools/src/commands',
                'packages/devtools/src/scripts',
                'packages/webdriver/src/bidi/handler.ts'
            ],
            watermarks: {
                statements: [85, 90],
                functions: [83, 88],
                branches: [85, 90],
                lines: [85, 90]
            }
        },
        globalSetup: [
            'scripts/test/globalSetup.ts'
        ]
    }
})

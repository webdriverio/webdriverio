import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        dangerouslyIgnoreUnhandledErrors: true,
        include: ['packages/**/*.test.ts'],
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
                'packages/devtools/src/scripts'
            ],
            lines: 88,
            functions: 84,
            statements: 88,
            branches: 89
        }
    }
})

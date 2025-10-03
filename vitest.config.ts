import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        dangerouslyIgnoreUnhandledErrors: true,
        include: ['packages/**/*.test.ts'],
        /**
         * not to ESM ported packages
         */
        exclude: [
            'dist', '.idea', '.git', '.cache', '**/node_modules/**'
        ],
        env: {
            WDIO_SKIP_DRIVER_SETUP: '1'
        },
        // This is a measure to address Vitest errors.
        // See also: https://github.com/vitest-dev/vitest/discussions/6511
        pool: 'threads',
        coverage: {
            enabled: false,
            provider: 'v8',
            exclude: [
                '**/__mocks__/**',
                '**/build/**',
                '**/cjs/*.ts',
                '**/*.test.ts',
                'packages/webdriver/src/bidi/handler.ts'
            ],
            watermarks: {
                statements: [85, 90],
                functions: [83, 88],
                branches: [85, 90],
                lines: [85, 90]
            }
        },
        setupFiles: [
            '__mocks__/fetch.ts'
        ]
    }
})

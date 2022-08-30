import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['packages/**/*.test.ts'],
        /**
         * not to ESM ported packages
         */
        exclude: [
            'dist', '.idea', '.git', '.cache',
            '**/node_modules/**',
            'packages/eslint-plugin-wdio/**/*'
        ],
        coverage: {
            enabled: true,
            exclude: ['**/build/**', '**/*.test.ts'],
            lines: 96,
            functions: 89,
            branches: 94,
            statements: 96
        },
        globalSetup: [
            'scripts/test/globalSetup.ts'
        ]
    }
})

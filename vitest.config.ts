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
            exclude: ['**/build/**', '**/cjs/*.js', '**/*.test.ts'],
            lines: 94,
            functions: 88,
            branches: 93,
            statements: 94
        },
        globalSetup: [
            'scripts/test/globalSetup.ts'
        ]
    }
})

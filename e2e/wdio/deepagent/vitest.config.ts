import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        // Suite budget: T1 < 60 s, T2 < 120 s, T3 < 30 s, T4 < 30 s per tier.
        // T0 (live LLM) is manual-only and self-gates on env vars — its
        // 480 s heal-loop budget lives in the test's own `it` timeout.
        testTimeout: 1000 * 60 * 3,
        hookTimeout: 60 * 1000,
        include: ['./tests/**/*.test.ts'],
        // Flake policy: Chrome-crash-class failures are retried once.
        retry: 1,
        pool: 'threads',
    },
})

import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        testTimeout: 1000 * 60 * 3,
        include: [
            './e2e/standalone/*.test.ts',
            './e2e/launch/*.test.ts'
        ],
        hookTimeout: 60 * 1000,
        /**
         * Chromedriver / Chrome cannot be started concurrently across files
         * on Windows and macOS CI runners without `spawn EBUSY` or the driver
         * dying immediately after binding its port.
         */
        fileParallelism: false
    }
})

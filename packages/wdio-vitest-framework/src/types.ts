import type { InlineConfig } from 'vitest/node'
import type { ParallelMode } from '@wdio/utils'

export type VitestOpts = {
    /**
     * Run `test.concurrent` tests simultaneously, each in its own browsing
     * context (window). Requires a WebDriver Bidi session. Without it,
     * `test.concurrent` throws because concurrent tests would share one window.
     *
     * - `'contexts'`: windows share the default user context, so cookies,
     *   localStorage and service workers are shared across concurrent tests.
     * - `'userContexts'`: each test gets its own user context, so storage is
     *   isolated per test. Every test pays its own login cost, and
     *   `browser.mock()` remains session-wide. Throws if the driver does not
     *   support `browser.createUserContext`.
     *
     * @default undefined
     */
    parallelMode?: ParallelMode

    /**
     * Maximum number of `test.concurrent` tests (and browsing contexts) to run
     * at the same time. Maps to Vitest's `maxConcurrency`.
     * @default os.cpus().length
     */
    maxParallelContexts?: number
} & InlineConfig

declare global {
    namespace WebdriverIO {
        interface Config {
            /**
             * Vitest specific options. Everything except `parallelMode` and
             * `maxParallelContexts` is passed through to Vitest's `test` config.
             */
            vitestOpts?: VitestOpts
        }
    }
}

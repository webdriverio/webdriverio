import type { Reporters } from '@wdio/types'

export interface Options extends Partial<Reporters.Options> {
    /**
     * define sync interval how often logs get pushed to Sumologic
     * @default 100
     */
    syncInterval?: number
    /**
     * maximum number of retries after the initial delivery attempt
     * non-negative finite values are rounded down; all other values use the default
     * @default 5
     */
    maxRetries?: number
    /**
     * maximum time in milliseconds to wait for a collector response
     * positive finite values are rounded up and capped at 2147483647; all other values use the default
     * @default 250
     */
    requestTimeout?: number
    /**
     * endpoint of collector source
     * @default
     * ```js
     * process.env.SUMO_SOURCE_ADDRESS
     * ```
     */
    sourceAddress?: string
}

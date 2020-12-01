export interface Options extends WebdriverIO.ServiceOption {
    /**
     * don't create a log file
     * @default true
     */
    stdout?: boolean
    /**
     * define sync interval how often logs get pushed to Sumologic
     * @default 100
     */
    syncInterval?: number
    /**
     * endpoint of collector source
     * @default
     * ```js
     * process.env.SUMO_SOURCE_ADDRESS
     * ```
     */
    sourceAddress?: string
}

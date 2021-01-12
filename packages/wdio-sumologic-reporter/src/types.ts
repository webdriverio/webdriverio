import { WDIOReporterOptionsFromStdout } from '@wdio/reporter'

export interface Options extends Partial<WDIOReporterOptionsFromStdout> {
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

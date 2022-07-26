import { WriteStream } from 'node:fs'
import { EventEmitter } from 'node:events'

export interface Options {
    outputDir?: string
    setLogFile?: (cid: string, name: string) => string
    writeStream?: WriteStream | {
        write: (content: any) => boolean
    }
    stdout?: boolean
    logFile?: string

    /**
     * allow random typings from 3rd party reporters
     */
    [key: string]: any
}

export interface ReporterInstance extends EventEmitter {
    isSynchronised: boolean
}

export interface ReporterClass {
    new(options: Partial<Options>): ReporterInstance
}

export type ReporterEntry = (
    /**
     * e.g. `services: ['@wdio/allure-reporter']`
     */
    string |
    /**
     * e.g. `services: [CustomReporter]`
     */
    ReporterClass |
    /**
     * e.g. `services: [['@wdio/sauce-service', { ... }]]`
     *
     * Note: we use `WebdriverIO.ServiceOptions` rather than referencing the
     * interface directly to allow other services to extend the service option
     * with theirs
     */
    [string, WebdriverIO.ReporterOption] |
    /**
     * e.g. `services: [[CustomClass, { ... }]]`
     *
     * Note: we use `WebdriverIO.ServiceOptions` rather than referencing the
     * interface directly to allow other services to extend the service option
     * with theirs
     */
    [ReporterClass, WebdriverIO.ReporterOption]
)

import type { WriteStream } from 'node:fs'
import type { EventEmitter } from 'node:events'
import type { RemoteCapability } from './Capabilities.js'

interface OutputFileFormatOptions {
    cid: string
    capabilities: RemoteCapability
}

export interface Options {
    outputDir?: string
    /**
     * Complete path of the reporter log file. If `setLogFile` is defined, it will
     * be used instead of this option.
     */
    logFile?: string
    /**
     * Define the filename format for the reporter log files, using the `cid` and
     * `capabilities`. `setLogFile` and `logFile` take precedence over this
     * option, if defined (in that order).
     *
     * > Note: `options.capabilities` is your capabilities object for that runner, so specifying
     * `${options.capabilities}` in your string will return [Object object]. You must specify which
     * properties of capabilities you want in your filename.
     *
     * @default `wdio-${cid}-${name}-reporter.log`
     *
     * @example
     * outputFileFormat: function (options) {
     *     const { cid, capabilities } = options
     *     const { browserName } = capabilities
     *     return `wdio-${cid}-${browserName}-reporter.log`
     * }
     */
    outputFileFormat?: (options: OutputFileFormatOptions) => string
    /**
     * Set the complete path for the reporter's log output, using `cid` and
     * the reporter's `name`.
     */
    setLogFile?: (cid: string, name: string) => string
    /**
     * No log file will be created if this option is set to `true`.
     */
    stdout?: boolean
    /**
     * Write to `writeStream` instead of a file.
     *
     * Note: `logFile` must not be set, unless `stdout` is set to `true`.
     */
    writeStream?: WriteStream | {
        write: (content: any) => boolean
    }
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

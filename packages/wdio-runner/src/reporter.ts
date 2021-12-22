import path from 'path'
import logger from '@wdio/logger'
import { initialisePlugin } from '@wdio/utils'
import type { Options, Capabilities, Reporters } from '@wdio/types'

import { sendFailureMessage } from './utils'

const log = logger('@wdio/runner')

/**
 * BaseReporter
 * responsible for initialising reporters for every testrun and propagating events
 * to all these reporters
 */
export default class BaseReporter {
    private _reporters: Reporters.ReporterInstance[]

    constructor(
        private _config: Options.Testrunner,
        private _cid: string,
        public caps: Capabilities.RemoteCapability
    ) {
        // ensure all properties are set before initializing the reporters
        this._reporters = this._config.reporters!.map(this.initReporter.bind(this))
    }

    /**
     * emit events to all registered reporter and wdio launcer
     *
     * @param  {String} e       event name
     * @param  {object} payload event payload
     */
    emit (e: string, payload: any) {
        payload.cid = this._cid

        /**
         * Send failure message (only once) in case of test or hook failure
         */
        sendFailureMessage(e, payload)

        this._reporters.forEach((reporter) => reporter.emit(e, payload))
    }

    getLogFile (name: string) {
        // clone the config to avoid changing original properties
        let options = Object.assign({}, this._config) as any
        let filename = `wdio-${this._cid}-${name}-reporter.log`

        const reporterOptions = this._config.reporters!.find((reporter) => (
            Array.isArray(reporter) &&
            (
                reporter[0] === name ||
                typeof reporter[0] === 'function' && reporter[0].name === name
            )
        )) as { outputFileFormat?: Function }[]

        if (reporterOptions) {
            const fileformat = reporterOptions[1].outputFileFormat

            options.cid = this._cid
            options.capabilities = this.caps
            Object.assign(options, reporterOptions[1])

            if (fileformat) {
                if (typeof fileformat !== 'function') {
                    throw new Error('outputFileFormat must be a function')
                }

                filename = fileformat(options)
            }
        }

        if (!options.outputDir) {
            return
        }

        return path.join(options.outputDir, filename)
    }

    /**
     * return write stream object based on reporter name
     */
    getWriteStreamObject (reporter: string) {
        return {
            write: /* istanbul ignore next */ (content: unknown) => process.send!({
                origin: 'reporter',
                name: reporter,
                content
            })
        }
    }

    /**
     * wait for reporter to finish synchronization, e.g. when sending data asynchronous
     * to a server (e.g. sumo reporter)
     */
    waitForSync() {
        const startTime = Date.now()
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                const unsyncedReporter = this._reporters
                    .filter((reporter) => !reporter.isSynchronised)
                    .map((reporter) => reporter.constructor.name)

                if ((Date.now() - startTime) > this._config.reporterSyncTimeout! && unsyncedReporter.length) {
                    clearInterval(interval)
                    return reject(new Error(`Some reporters are still unsynced: ${unsyncedReporter.join(', ')}`))
                }

                /**
                 * no reporter are in need to sync anymore, continue
                 */
                if (!unsyncedReporter.length) {
                    clearInterval(interval)
                    return resolve(true)
                }

                log.info(`Wait for ${unsyncedReporter.length} reporter to synchronise`)
                // wait otherwise
            }, this._config.reporterSyncInterval)
        })
    }

    /**
     * initialise reporters
     */
    initReporter (reporter: Reporters.ReporterEntry) {
        let ReporterClass: Reporters.ReporterClass
        let options: Partial<Reporters.Options> = {}

        /**
         * check if reporter has custom options
         */
        if (Array.isArray(reporter)) {
            options = Object.assign({}, options, reporter[1])
            reporter = reporter[0]
        }

        /**
         * check if reporter was passed in from a file, e.g.
         *
         * ```js
         * const MyCustomReporter = require('/some/path/MyCustomReporter.js')
         * export.config = {
         *     //...
         *     reporters: [
         *         MyCustomReporter, // or
         *         [MyCustomReporter, { custom: 'option' }]
         *     ]
         *     //...
         * }
         * ```
         */
        if (typeof reporter === 'function') {
            ReporterClass = reporter as Reporters.ReporterClass
            options.logFile = options.setLogFile
                ? options.setLogFile(this._cid, ReporterClass.name)
                : this.getLogFile(ReporterClass.name)
            options.writeStream = this.getWriteStreamObject(ReporterClass.name)
            return new ReporterClass(options)
        }

        /**
         * check if reporter is a node package, e.g. wdio-dot reporter
         *
         * ```js
         * export.config = {
         *     //...
         *     reporters: [
         *         'dot', // or
         *         ['dot', { custom: 'option' }]
         *     ]
         *     //...
         * }
         * ```
         */
        if (typeof reporter === 'string') {
            ReporterClass = initialisePlugin(reporter, 'reporter').default as Reporters.ReporterClass
            options.logFile = options.setLogFile
                ? options.setLogFile(this._cid, reporter)
                : this.getLogFile(reporter)
            options.writeStream = this.getWriteStreamObject(reporter)
            return new ReporterClass(options)
        }

        /**
         * throw error if reporter property was invalid
         */
        throw new Error('Invalid reporters config')
    }
}

import path from 'path'
import logger from '@wdio/logger'
import { initialisePlugin } from '@wdio/config'

const log = logger('wdio-runner')

const NOOP = () => {}
const DEFAULT_SYNC_TIMEOUT = 5000 // 5s
const DEFAULT_SYNC_INTERVAL = 100 // 100ms

/**
 * BaseReporter
 * responsible for initialising reporters for every testrun and propagating events
 * to all these reporters
 */
export default class BaseReporter {
    constructor (config, cid, caps) {
        this.config = config
        this.cid = cid
        this.reporters = config.reporters.map(::this.initReporter)
        this.caps = caps

        /**
         * these configurations are not publicly documented as there should be no desire for it
         */
        this.reporterSyncInterval = this.config.reporterSyncInterval || DEFAULT_SYNC_INTERVAL
        this.reporterSyncTimeout = this.config.reporterSyncTimeout || DEFAULT_SYNC_TIMEOUT
    }

    /**
     * emit events to all registered reporter and wdio launcer
     *
     * @param  {String} e       event name
     * @param  {object} payload event payload
     */
    emit (e, payload) {
        payload.cid = this.cid
        this.reporters.forEach((reporter) => reporter.emit(e, payload))
    }

    getLogFile(name) {
        let options = this.config
        let filename = `wdio-${this.cid}-${name}-reporter.log`

        const reporter_options = this.config.reporters.find((reporter) => (
            Array.isArray(reporter) && reporter[0] === name
        ))

        if(reporter_options) {
            const fileformat = reporter_options[1].outputFileFormat

            options.cid = this.cid
            options.capabilities = this.caps
            Object.assign(options, reporter_options[1])

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
    getWriteStreamObject (reporter) {
        return {
            write: /* istanbul ignore next */ (content) => process.send({
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
    waitForSync () {
        const startTime = Date.now()
        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                const unsyncedReporter = this.reporters
                    .filter((reporter) => !reporter.isSynchronised)
                    .map((reporter) => reporter.constructor.name)

                if ((Date.now() - startTime) > this.reporterSyncTimeout && unsyncedReporter.length) {
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
            }, this.reporterSyncInterval)
        })
    }

    /**
     * initialise reporters
     */
    initReporter (reporter) {
        let ReporterClass
        let options = {
            logLevel: this.config.logLevel,
            setLogFile: NOOP
        }

        /**
         * check if reporter has custom options
         */
        if (Array.isArray(reporter)) {
            options = Object.assign(options, reporter[1])
            reporter = reporter[0]
        }

        /**
         * check if reporter was passed in from a file, e.g.
         *
         * ```js
         * const MyCustomeReporter = require('/some/path/MyCustomeReporter.js')
         * export.config = {
         *     //...
         *     reporters: [
         *         MyCustomeReporter, // or
         *         [MyCustomeReporter, { custom: 'option' }]
         *     ]
         *     //...
         * }
         * ```
         */
        if (typeof reporter === 'function') {
            ReporterClass = reporter
            const customLogFile = options.setLogFile(this.cid, ReporterClass.name)
            options.logFile = customLogFile || this.getLogFile(ReporterClass.name)
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
            ReporterClass = initialisePlugin(reporter, 'reporter')
            const customLogFile = options.setLogFile(this.cid, reporter)
            options.logFile = customLogFile || this.getLogFile(reporter)
            options.writeStream = this.getWriteStreamObject(reporter)
            return new ReporterClass(options)
        }

        /**
         * throw error if reporter property was invalid
         */
        throw new Error('Invalid reporters config')
    }
}

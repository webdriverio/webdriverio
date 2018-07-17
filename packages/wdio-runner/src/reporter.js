import path from 'path'
import { initialisePlugin } from 'wdio-config'

const NOOP = () => {}

/**
 * BaseReporter
 * responsible for initialising reporters for every testrun and propagating events
 * to all these reporters
 */
export default class BaseReporter {
    constructor (config, cid) {
        this.config = config
        this.cid = cid
        this.reporters = config.reporters.map(::this.initReporter)
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

    /**
     * returns name of log file
     */
    getLogFile (name) {
        if (!this.config.logDir) {
            return
        }
        return path.join(this.config.logDir, `wdio-${this.cid}-${name}-reporter.log`)
    }

    /**
     * return write stream object based on reporter name
     */
    getWriteStreamObject (reporter) {
        return {
            write: (content) => process.send({
                origin: 'reporter',
                name: reporter,
                content
            })
        }
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

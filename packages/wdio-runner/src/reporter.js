import { initialisePlugin } from 'wdio-config'

/**
 * BaseReporter
 * responsible for initialising reporters for every testrun and propagating events
 * to all these reporters
 */
export default class BaseReporter {
    constructor (config) {
        this.config = config
        this.reporters = config.reporters.map(::this.initReporter)
    }

    /**
     * emit events to all registered reporter
     */
    emit (...args) {
        this.reporters.forEach((reporter) => reporter.emit(...args))
    }

    /**
     * initialise reporters
     */
    initReporter (reporter) {
        let ReporterClass
        let options = {
            logDir: this.config.logDir,
            logLevel: this.config.logLevel
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

            if (!ReporterClass.reporterName) {
                throw new Error('Custom reporters must export a unique \'reporterName\' property')
            }

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
            return new ReporterClass(options)
        }

        /**
         * throw error if reporter property was invalid
         */
        throw new Error('Invalid reporters config')
    }
}

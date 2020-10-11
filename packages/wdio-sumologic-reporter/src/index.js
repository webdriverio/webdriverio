import got from 'got'
import dateFormat from 'dateformat'
import stringify from 'json-stringify-safe'

import WDIOReporter from '@wdio/reporter'
import logger from '@wdio/logger'

const log = logger('@wdio/sumologic-reporter')

const MAX_LINES = 100
const DATE_FORMAT = 'yyyy-mm-dd HH:mm:ss,l o'

/**
 * Initialize a new sumologic test reporter.
 */
export default class SumoLogicReporter extends WDIOReporter {
    constructor(options) {
        options = Object.assign({
            // don't create a log file
            stdout: true,
            // define sync interval how often logs get pushed to Sumologic
            syncInterval: 100,
            // endpoint of collector source
            sourceAddress: process.env.SUMO_SOURCE_ADDRESS
        }, options)
        super(options)
        this.options = options

        if (typeof this.options.sourceAddress !== 'string') {
            log.error('Sumo Logic requires "sourceAddress" paramater')
        }

        // Cache of entries we are yet to sync
        this.unsynced = []
        this.isSynchronising = false

        this.errorCount = 0
        this.specs = {}
        this.results = {}
        this.interval = setInterval(this.sync.bind(this), this.options.syncInterval)
    }

    get isSynchronised() {
        return this.unsynced.length === 0
    }

    onRunnerStart(runner) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'runner:start',
            data: runner
        }))
    }

    onSuiteStart(suite) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'suite:start',
            data: suite
        }))
    }

    onTestStart(test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:start',
            data: test
        }))
    }

    onTestSkip(test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:skip',
            data: test
        }))
    }

    onTestPass(test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:pass',
            data: test
        }))
    }

    onTestFail(test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:fail',
            data: test
        }))
    }

    onTestEnd(test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:end',
            data: test
        }))
    }

    onSuiteEnd(suite) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'suite:end',
            data: suite
        }))
    }

    onRunnerEnd(runner) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'runner:end',
            data: runner
        }))
    }

    async sync() {
        /**
         * don't synchronise logs if
         *  - we've already send out a request and are waiting for the successful response
         *  - we have nothing to synchronise
         *  - there is an invalid source address
         */
        if (this.isSynchronising || this.unsynced.length === 0 || typeof this.options.sourceAddress !== 'string') {
            return
        }

        const logLines = this.unsynced.slice(0, MAX_LINES).join('\n')

        /**
         * set `isSynchronising` to true so we don't sync when a request is being made
         */
        this.isSynchronising = true
        log.debug('start synchronization')

        try {
            const resp = await got(this.options.sourceAddress, {
                method: 'POST',
                json: logLines
            })

            /**
             * remove transfered logs from log bucket
             */
            this.unsynced.splice(0, MAX_LINES)

            /**
             * reset sync flag so we can sync again
             */
            this.isSynchronising = false
            return log.debug(`synchronised collector data, server status: ${resp.statusCode}`)
        } catch (err) {
            return log.error('failed send data to Sumo Logic:\n', err.stack ? err.stack : err)
        }
    }
}

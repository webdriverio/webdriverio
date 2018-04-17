import request from 'request'
import dateFormat from 'dateformat'
import stringify from 'json-stringify-safe'

import WDIOReporter from 'wdio-reporter'
import logger from 'wdio-logger'

const log = logger('wdio-sumologic-reporter')

const MAX_LINES = 100
const DATE_FORMAT = 'yyyy-mm-dd HH:mm:ss,l o'

/**
 * Initialize a new sumologic test reporter.
 */
export default class SumoLogicReporter extends WDIOReporter {
    constructor (options) {
        super(options)
        this.options = Object.assign({
            // define sync interval how often logs get pushed to Sumologic
            syncInterval: 100,
            // endpoint of collector source
            sourceAddress: process.env.SUMO_SOURCE_ADDRESS
        }, options)

        if (typeof this.options.sourceAddress !== 'string') {
            log.error('Sumo Logic requires "sourceAddress" paramater')
        }

        // Cache of entries we are yet to sync
        this.unsynced = []
        this.inSync = false

        this.errorCount = 0
        this.specs = {}
        this.results = {}
        this.interval = setInterval(::this.sync, this.options.syncInterval)
    }

    onRunnerStart (runner) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'runner:start',
            data: runner
        }))
    }

    onSuiteStart (suite) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'suite:start',
            data: suite
        }))
    }

    onTestStart (test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:start',
            data: test
        }))
    }

    onTestSkip (test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:skip',
            data: test
        }))
    }

    onTestPass (test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:pass',
            data: test
        }))
    }

    onTestFail (test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:fail',
            data: test
        }))
    }

    onTestEnd (test) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:end',
            data: test
        }))
    }

    onSuiteEnd (suite) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'suite:end',
            data: suite
        }))
    }

    onRunnerEnd (runner) {
        this.unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'runner:end',
            data: runner
        }))
    }

    sync () {
        if (this.inSync || this.unsynced.length === 0 || typeof this.options.sourceAddress !== 'string') {
            return
        }

        const logLines = this.unsynced.slice(0, MAX_LINES).join('\n')
        this.inSync = true

        request({
            method: 'POST',
            uri: this.options.sourceAddress,
            body: logLines
        }, (err, resp) => {
            const failed = Boolean(err) || resp.status < 200 || resp.status >= 400

            if (failed) {
                log.error('failed send data to Sumo Logic:\n', err.stack ? err.stack : err)
            } else {
                this.unsynced.splice(0, MAX_LINES)
            }

            this.inSync = false
        })
    }
}

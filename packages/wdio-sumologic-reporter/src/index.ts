import got from 'got'
import dateFormat from 'dateformat'
import stringify from 'json-stringify-safe'

import type { RunnerStats, SuiteStats, TestStats } from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import logger from '@wdio/logger'

import type { Options } from './types.js'

const log = logger('@wdio/sumologic-reporter')

const MAX_LINES = 100
const DATE_FORMAT = 'yyyy-mm-dd HH:mm:ss,l o'

/**
 * Initialize a new sumologic test reporter.
 */
export default class SumoLogicReporter extends WDIOReporter {
    private _options: Options
    private _interval: NodeJS.Timeout

    private _unsynced: string[] = []
    private _isSynchronising = false
    private _hasRunnerEnd = false

    constructor(options: Options) {
        super(options)
        this._options = Object.assign({
            // don't create a log file
            stdout: true,
            // define sync interval how often logs get pushed to Sumologic
            syncInterval: 100,
            // endpoint of collector source
            sourceAddress: process.env.SUMO_SOURCE_ADDRESS
        }, options)

        if (typeof this._options.sourceAddress !== 'string') {
            log.error('Sumo Logic requires "sourceAddress" paramater')
        }

        this._interval = global.setInterval(this.sync.bind(this), this._options.syncInterval)
    }

    // @ts-ignore
    get isSynchronised () {
        return this._unsynced.length === 0
    }

    onRunnerStart(runner: RunnerStats) {
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'runner:start',
            data: runner
        }))
    }

    onSuiteStart(suite: SuiteStats) {
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'suite:start',
            data: suite
        }))
    }

    onTestStart(test: TestStats) {
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:start',
            data: test
        }))
    }

    onTestSkip(test: TestStats) {
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:skip',
            data: test
        }))
    }

    onTestPass(test: TestStats) {
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:pass',
            data: test
        }))
    }

    onTestFail(test: TestStats) {
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:fail',
            data: test
        }))
    }

    onTestEnd(test: TestStats) {
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'test:end',
            data: test
        }))
    }

    onSuiteEnd(suite: SuiteStats) {
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'suite:end',
            data: suite
        }))
    }

    onRunnerEnd(runner: RunnerStats) {
        this._hasRunnerEnd = true
        this._unsynced.push(stringify({
            time: dateFormat(new Date(), DATE_FORMAT),
            event: 'runner:end',
            data: runner
        }))
    }

    async sync() {
        /**
         * clear intervall if everything was synced
         */
        if (this._hasRunnerEnd && this._unsynced.length === 0) {
            clearInterval(this._interval)
        }

        /**
         * don't synchronise logs if
         *  - we've already send out a request and are waiting for the successful response
         *  - we have nothing to synchronise
         *  - there is an invalid source address
         */
        if (this._isSynchronising || this._unsynced.length === 0 || typeof this._options.sourceAddress !== 'string') {
            return
        }

        const logLines = this._unsynced.slice(0, MAX_LINES).join('\n')

        /**
         * set `isSynchronising` to true so we don't sync when a request is being made
         */
        this._isSynchronising = true
        log.debug('start synchronization')

        try {
            const resp = await got(this._options.sourceAddress, {
                method: 'POST',
                json: logLines as any
            })

            /**
             * remove transfered logs from log bucket
             */
            this._unsynced.splice(0, MAX_LINES)

            /**
             * reset sync flag so we can sync again
             */
            this._isSynchronising = false
            return log.debug(`synchronised collector data, server status: ${resp.statusCode}`)
        } catch (err: any) {
            return log.error('failed send data to Sumo Logic:\n', err.stack)
        }
    }
}

export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ReporterOption extends Options {}
    }
}

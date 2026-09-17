import stringify from 'json-stringify-safe'

import type { RunnerStats, SuiteStats, TestStats } from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import logger from '@wdio/logger'

import type { Options } from './types.js'

const log = logger('@wdio/sumologic-reporter')

const MAX_LINES = 100
const MAX_RETRY_DELAY = 1000
const DEFAULT_MAX_RETRIES = 5
const DEFAULT_REQUEST_TIMEOUT = 250
const MAX_REQUEST_TIMEOUT = 2_147_483_647

/**
 * Format date to match dateformat pattern 'yyyy-mm-dd HH:mm:ss,l o'
 */
function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0')

    // Get timezone offset in format +HHMM or -HHMM
    const offsetMinutes = date.getTimezoneOffset()
    const offsetSign = offsetMinutes <= 0 ? '+' : '-'
    const offsetHours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')
    const offsetMins = String(Math.abs(offsetMinutes) % 60).padStart(2, '0')
    const timezoneOffset = `${offsetSign}${offsetHours}${offsetMins}`

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds},${milliseconds} ${timezoneOffset}`
}

/**
 * Initialize a new sumologic test reporter.
 */
export default class SumoLogicReporter extends WDIOReporter {
    private _options: Options
    private _interval?: NodeJS.Timeout

    private _unsynced: string[] = []
    private _isSynchronising = false
    private _isDisabled = false
    private _hasRunnerEnd = false
    private _retryAttempts = 0
    private _retryDelay = 0
    private _nextRetryAt = 0

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

        if (typeof this._options.sourceAddress !== 'string' || this._options.sourceAddress.trim() === '') {
            this._disable('Sumo Logic reporter disabled: a non-empty "sourceAddress" is required')
            return
        }

        this._interval = global.setInterval(this.sync.bind(this), this._options.syncInterval)
    }

    // @ts-ignore
    get isSynchronised () {
        return this._isDisabled || this._unsynced.length === 0
    }

    onRunnerStart(runner: RunnerStats) {
        this._addEvent('runner:start', runner)
    }

    onSuiteStart(suite: SuiteStats) {
        this._addEvent('suite:start', suite)
    }

    onTestStart(test: TestStats) {
        this._addEvent('test:start', test)
    }

    onTestSkip(test: TestStats) {
        this._addEvent('test:skip', test)
    }

    onTestPass(test: TestStats) {
        this._addEvent('test:pass', test)
    }

    onTestFail(test: TestStats) {
        this._addEvent('test:fail', test)
    }

    onTestEnd(test: TestStats) {
        this._addEvent('test:end', test)
    }

    onSuiteEnd(suite: SuiteStats) {
        this._addEvent('suite:end', suite)
    }

    onRunnerEnd(runner: RunnerStats) {
        this._hasRunnerEnd = true
        this._addEvent('runner:end', runner)
    }

    async sync() {
        /**
         * clear intervall if everything was synced
         */
        if (this._isDisabled) {
            return
        }

        if (this._hasRunnerEnd && this._unsynced.length === 0) {
            this._stopInterval()
            return
        }

        /**
         * don't synchronise logs if
         *  - we've already send out a request and are waiting for the successful response
         *  - we have nothing to synchronise
         *  - the retry backoff has not elapsed
         */
        if (
            this._isSynchronising ||
            this._unsynced.length === 0 ||
            Date.now() < this._nextRetryAt
        ) {
            return
        }

        const sourceAddress = this._options.sourceAddress
        if (typeof sourceAddress !== 'string' || sourceAddress.trim() === '') {
            this._disable('Sumo Logic reporter disabled: a non-empty "sourceAddress" is required')
            return
        }

        const logLines = this._unsynced.slice(0, MAX_LINES).join('\n')

        /**
         * set `isSynchronising` to true so we don't sync when a request is being made
         */
        this._isSynchronising = true
        log.debug('start synchronization')

        try {
            const resp = await fetch(sourceAddress, {
                method: 'POST',
                body: JSON.stringify(logLines),
                signal: AbortSignal.timeout(this._getRequestTimeout())
            })

            if (!resp.ok) {
                if (!this._isRetryableStatus(resp.status)) {
                    this._disable(`failed to send data to Sumo Logic (HTTP ${resp.status}); disabling reporter`)
                    return
                }

                this._retry(resp.status)
                return
            }

            this._retryAttempts = 0
            this._retryDelay = 0
            this._nextRetryAt = 0

            /**
             * remove transfered logs from log bucket
             */
            this._unsynced.splice(0, MAX_LINES)
            if (this._hasRunnerEnd && this._unsynced.length === 0) {
                this._stopInterval()
            }

            return log.debug(`synchronised collector data, server status: ${resp.status}`)
        } catch {
            this._retry()
        } finally {
            this._isSynchronising = false
        }
    }

    private _addEvent(event: string, data: unknown) {
        if (this._isDisabled) {
            return
        }

        this._unsynced.push(stringify({
            time: formatDate(new Date()),
            event,
            data
        }))
    }

    private _isRetryableStatus(status: number) {
        return status === 408 || status === 429 || (status >= 500 && status <= 599)
    }

    private _retry(status?: number) {
        const maxRetries = this._getMaxRetries()
        if (this._retryAttempts >= maxRetries) {
            const statusMessage = status === undefined ? '' : ` (HTTP ${status})`
            this._disable(`failed to send data to Sumo Logic${statusMessage}; retry limit of ${maxRetries} reached, disabling reporter`)
            return
        }

        this._retryAttempts++
        this._retryDelay = Math.min(
            Math.max(this._options.syncInterval ?? 100, this._retryDelay * 2),
            MAX_RETRY_DELAY
        )
        this._nextRetryAt = Date.now() + this._retryDelay
        const statusMessage = status === undefined ? '' : ` (HTTP ${status})`
        log.error(`failed to send data to Sumo Logic${statusMessage}; retrying (${this._retryAttempts}/${maxRetries})`)
    }

    private _getMaxRetries() {
        const { maxRetries } = this._options
        return typeof maxRetries === 'number' && Number.isFinite(maxRetries) && maxRetries >= 0
            ? Math.floor(maxRetries)
            : DEFAULT_MAX_RETRIES
    }

    private _getRequestTimeout() {
        const { requestTimeout } = this._options
        return typeof requestTimeout === 'number' && Number.isFinite(requestTimeout) && requestTimeout > 0
            ? Math.min(Math.ceil(requestTimeout), MAX_REQUEST_TIMEOUT)
            : DEFAULT_REQUEST_TIMEOUT
    }

    private _disable(message: string) {
        this._isDisabled = true
        this._unsynced = []
        this._nextRetryAt = 0
        this._stopInterval()
        log.error(message)
    }

    private _stopInterval() {
        if (this._interval) {
            clearInterval(this._interval)
            this._interval = undefined
        }
    }
}

export * from './types.js'

declare global {
    namespace WebdriverIO {
        interface ReporterOption extends Options {}
    }
}

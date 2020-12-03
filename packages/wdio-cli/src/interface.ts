import chalk from 'chalk'
import EventEmitter from 'events'
import logger from '@wdio/logger'

import { getRunnerName } from './utils'
import { string } from 'yargs'

const log = logger('@wdio/cli')

export default class WDIOCLInterface extends EventEmitter {
    private _specFileRetries: number
    private _specFileRetriesDelay: number

    private _skippedSpecs = 0
    private _inDebugMode = false
    private _result = {
        finished: 0,
        passed: 0,
        retries: 0,
        failed: 0
    }
    private _start = new Date()
    private _messages: {
        reporter: Record<string, string[]>
        debugger: Record<string, string[]>
    } = {
        reporter: {},
        debugger: {}
    }

    constructor(
        private _config: WebdriverIO.Config,
        private _totalWorkerCnt: number,
        private _isWatchMode = false
    ) {
        super()

        this._totalWorkerCnt = _totalWorkerCnt
        this._isWatchMode = _isWatchMode
        this._specFileRetries = _config.specFileRetries || 0
        this._specFileRetriesDelay = _config.specFileRetriesDelay || 0

        this.on('job:start', this.addJob.bind(this))
        this.on('job:end', this.clearJob.bind(this))

        this.setup()
        this.onStart()
    }

    setup() {
        this.jobs = new Map()
        this._start = new Date()

        /**
         * The relationship between totalWorkerCnt and these counters are as follows:
         * totalWorkerCnt - retries = finished = passed + failed
         */
        this._result = {
            finished: 0,
            passed: 0,
            retries: 0,
            failed: 0
        }

        this._messages = {
            reporter: {},
            debugger: {}
        }
    }

    onStart() {
        this.log(chalk.bold(`\nExecution of ${chalk.blue(this._totalWorkerCnt)} spec files started at`), this._start.toISOString())
        if (this._inDebugMode) {
            this.log(chalk.bgYellow.black('DEBUG mode enabled!'))
        }
        if (this._isWatchMode) {
            this.log(chalk.bgYellow.black('WATCH mode enabled!'))
        }
        this.log('')
    }

    onSpecRunning (cid: string) {
        this.onJobComplete(cid, this.jobs.get(cid), 0, chalk.bold.cyan('RUNNING'))
    }

    onSpecRetry (cid: string, job, retries) {
        const delayMsg = this._specFileRetriesDelay > 0 ? ` after ${this._specFileRetriesDelay}s` : ''
        this.onJobComplete(cid, job, retries, chalk.bold(chalk.yellow('RETRYING') + delayMsg))
    }

    onSpecPass (cid: string, job, retries) {
        this.onJobComplete(cid, job, retries, chalk.bold.green('PASSED'))
    }

    onSpecFailure (cid: string, job, retries) {
        this.onJobComplete(cid, job, retries, chalk.bold.red('FAILED'))
    }

    onSpecSkip (cid: string, job) {
        this.onJobComplete(cid, job, 0, 'SKIPPED', log.info)
    }

    onJobComplete(cid: string, job, retries, message, _logger = this.log) {
        const details = [`[${cid}]`, message]
        if (job) {
            details.push('in', getRunnerName(job.caps), this.getFilenames(job.specs))
        }
        if (retries > 0) {
            details.push(`(${retries} retries)`)
        }

        return _logger(...details)
    }

    onTestError (payload) {
        let error = { type: 'Error', message: typeof payload.error === 'string' ? payload.error : 'Unknown error.', stack: null }
        if (payload.error) {
            error.type = payload.error.type || error.type
            error.message = payload.error.message || error.message
            error.stack = payload.error.stack || error.stack
        }

        return this.log(`[${payload.cid}]`, `${chalk.red(error.type)} in "${payload.fullTitle}"\n${chalk.red(error.stack || error.message)}`)
    }

    getFilenames (specs = []) {
        if (specs.length > 0) {
            return '- ' + specs.join(', ').replace(new RegExp(`${process.cwd()}`, 'g'), '')
        }
        return ''
    }

    /**
     * add job to interface
     */
    addJob ({ cid, caps, specs, hasTests }) {
        this.jobs.set(cid, { caps, specs, hasTests })
        if (hasTests) {
            this.onSpecRunning(cid)
        } else {
            this._skippedSpecs++
        }
    }

    /**
     * clear job from interface
     */
    clearJob ({ cid, passed, retries }) {
        const job = this.jobs.get(cid)

        this.jobs.delete(cid)
        const retryAttempts = this._specFileRetries - retries
        const retry = !passed && retries > 0
        if (!retry) {
            this._result.finished++
        }

        if (job && job.hasTests === false) {
            return this.onSpecSkip(cid, job)
        }

        if (passed) {
            this._result.passed++
            this.onSpecPass(cid, job, retryAttempts)
        } else if (retry) {
            this._totalWorkerCnt++
            this._result.retries++
            this.onSpecRetry(cid, job, retryAttempts)
        } else {
            this._result.failed++
            this.onSpecFailure(cid, job, retryAttempts)
        }
    }

    /**
     * for testing purposes call console log in a static method
     */
    log (...args) {
        // eslint-disable-next-line no-console
        console.log(...args)
        return args
    }

    /**
     * event handler that is triggered when runner sends up events
     */
    onMessage (event) {
        if (event.origin === 'debugger' && event.name === 'start') {
            this.log(chalk.yellow(event.params.introMessage))
            this._inDebugMode = true
            return this._inDebugMode
        }

        if (event.origin === 'debugger' && event.name === 'stop') {
            this._inDebugMode = false
            return this._inDebugMode
        }

        if (event.name === 'testFrameworkInit') {
            return this.emit('job:start', event.content)
        }

        if (!event.origin) {
            return log.warn(`Can't identify message from worker: ${JSON.stringify(event)}, ignoring!`)
        }

        if (event.origin === 'worker' && event.name === 'error') {
            return this.log(`[${event.cid}]`, chalk.white.bgRed.bold(' Error: '), event.content.message || event.content.stack || event.content)
        }

        if (event.origin !== 'reporter' && event.origin !== 'debugger') {
            return this.log(event.cid, event.origin, event.name, event.content)
        }

        if (event.name === 'printFailureMessage') {
            return this.onTestError(event.content)
        }

        if (!this._messages[event.origin][event.name]) {
            this._messages[event.origin][event.name] = []
        }

        this._messages[event.origin][event.name].push(event.content)
        if (this._isWatchMode) {
            this.printReporters()
        }
    }

    sigintTrigger() {
        /**
         * allow to exit repl mode via Ctrl+C
         */
        if (this._inDebugMode) {
            return false
        }

        const isRunning = this.jobs.size !== 0
        const shutdownMessage = isRunning
            ? 'Ending WebDriver sessions gracefully ...\n' +
            '(press ctrl+c again to hard kill the runner)'
            : 'Ended WebDriver sessions gracefully after a SIGINT signal was received!'
        return this.log('\n\n' + shutdownMessage)
    }

    printReporters() {
        /**
         * print reporter output
         */
        const reporter = this._messages.reporter
        this._messages.reporter = {}
        for (const [reporterName, messages] of Object.entries(reporter)) {
            this.log('\n', chalk.bold.magenta(`"${reporterName}" Reporter:`))
            this.log(messages.join(''))
        }
    }

    printSummary() {
        const totalJobs = this._totalWorkerCnt - this._result.retries
        const elapsed = (new Date(Date.now() - this._start)).toUTCString().match(/(\d\d:\d\d:\d\d)/)![0]
        const retries = this._result.retries ? chalk.yellow(this._result.retries, 'retries') + ', ' : ''
        const failed = this._result.failed ? chalk.red(this._result.failed, 'failed') + ', ' : ''
        const skipped = this._skippedSpecs > 0 ? chalk.gray(this._skippedSpecs, 'skipped') + ', ' : ''
        const percentCompleted = totalJobs ? Math.round(this._result.finished / totalJobs * 100) : 0
        return this.log(
            '\nSpec Files:\t', chalk.green(this._result.passed, 'passed') + ', ' + retries + failed + skipped + totalJobs, 'total', `(${percentCompleted}% completed)`, 'in', elapsed,
            '\n'
        )
    }

    finalise() {
        if (this._isWatchMode) {
            return
        }

        this.printReporters()
        this.printSummary()
    }
}

import { EventEmitter } from 'node:events'
import chalk from 'chalk'
import logger from '@wdio/logger'
import type { Options, Capabilities, Workers } from '@wdio/types'

import { getRunnerName, HookError } from './utils.js'

const log = logger('@wdio/cli')

interface TestError {
    type: string
    message: string
    stack?: string
}

interface CLIInterfaceEvent {
    origin?: string
    name: string
    cid?: string
    fullTitle?: string
    content?: any
    params?: any
    error?: TestError
}

export default class WDIOCLInterface extends EventEmitter {
    public hasAnsiSupport: boolean
    public result = {
        finished: 0,
        passed: 0,
        retries: 0,
        failed: 0
    }

    private _jobs: Map<string, Workers.Job> = new Map()
    private _specFileRetries: number
    private _specFileRetriesDelay: number

    private _skippedSpecs = 0
    private _inDebugMode = false
    private _start = new Date()
    private _messages: {
        reporter: Record<string, string[]>
        debugger: Record<string, string[]>
    } = {
            reporter: {},
            debugger: {}
        }

    constructor(
        private _config: Options.Testrunner,
        public totalWorkerCnt: number,
        private _isWatchMode = false
    ) {
        super()

        /**
         * Colors can be forcibly enabled/disabled with env variable `FORCE_COLOR`
         * `FORCE_COLOR=1` - forcibly enable colors
         * `FORCE_COLOR=0` - forcibly disable colors
         */
        this.hasAnsiSupport = (chalk.supportsColor as chalk.ColorSupport).hasBasic

        this.totalWorkerCnt = totalWorkerCnt
        this._isWatchMode = _isWatchMode
        this._specFileRetries = _config.specFileRetries || 0
        this._specFileRetriesDelay = _config.specFileRetriesDelay || 0

        this.on('job:start', this.addJob.bind(this))
        this.on('job:end', this.clearJob.bind(this))

        this.setup()
        this.onStart()
    }

    setup() {
        this._jobs = new Map()
        this._start = new Date()

        /**
         * The relationship between totalWorkerCnt and these counters are as follows:
         * totalWorkerCnt - retries = finished = passed + failed
         */
        this.result = {
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
        this.log(chalk.bold(`\nExecution of ${chalk.blue(this.totalWorkerCnt)} workers started at`), this._start.toISOString())
        if (this._inDebugMode) {
            this.log(chalk.bgYellow.black('DEBUG mode enabled!'))
        }
        if (this._isWatchMode) {
            this.log(chalk.bgYellow.black('WATCH mode enabled!'))
        }
        this.log('')
    }

    onSpecRunning (rid: string) {
        this.onJobComplete(rid, this._jobs.get(rid), 0, chalk.bold.cyan('RUNNING'))
    }

    onSpecRetry (rid: string, job?: Workers.Job, retries = 0) {
        const delayMsg = this._specFileRetriesDelay > 0 ? ` after ${this._specFileRetriesDelay}s` : ''
        this.onJobComplete(rid, job, retries, chalk.bold(chalk.yellow('RETRYING') + delayMsg))
    }

    onSpecPass (rid: string, job?: Workers.Job, retries = 0) {
        this.onJobComplete(rid, job, retries, chalk.bold.green('PASSED'))
    }

    onSpecFailure (rid: string, job?: Workers.Job, retries = 0) {
        this.onJobComplete(rid, job, retries, chalk.bold.red('FAILED'))
    }

    onSpecSkip (rid: string, job?: Workers.Job) {
        this.onJobComplete(rid, job, 0, 'SKIPPED', log.info)
    }

    onJobComplete(cid: string, job?: Workers.Job, retries = 0, message = '', _logger: Function = this.log) {
        const details = [`[${cid}]`, message]
        if (job) {
            details.push('in', getRunnerName(job.caps as Capabilities.DesiredCapabilities), this.getFilenames(job.specs))
        }
        if (retries > 0) {
            details.push(`(${retries} retries)`)
        }

        return _logger(...details)
    }

    onTestError (payload: CLIInterfaceEvent) {
        const error: TestError = {
            type: payload.error?.type || 'Error',
            message: payload.error?.message || (typeof payload.error === 'string' ? payload.error : 'Unknown error.'),
            stack: payload.error?.stack
        }

        return this.log(`[${payload.cid}]`, `${chalk.red(error.type)} in "${payload.fullTitle}"\n${chalk.red(error.stack || error.message)}`)
    }

    getFilenames (specs: string[] = []) {
        if (specs.length > 0) {
            return '- ' + specs.join(', ').replace(new RegExp(`${process.cwd()}`, 'g'), '')
        }
        return ''
    }

    /**
     * add job to interface
     */
    addJob ({ cid, caps, specs, hasTests }: Workers.Job & { cid: string }) {
        this._jobs.set(cid, { caps, specs, hasTests })
        if (hasTests) {
            this.onSpecRunning(cid)
        } else {
            this._skippedSpecs++
        }
    }

    /**
     * clear job from interface
     */
    clearJob ({ cid, passed, retries }: { cid: string, passed: boolean, retries: number }) {
        const job = this._jobs.get(cid)

        this._jobs.delete(cid)
        const retryAttempts = this._specFileRetries - retries
        const retry = !passed && retries > 0
        if (!retry) {
            this.result.finished++
        }

        if (job && job.hasTests === false) {
            return this.onSpecSkip(cid, job)
        }

        if (passed) {
            this.result.passed++
            this.onSpecPass(cid, job, retryAttempts)
        } else if (retry) {
            this.totalWorkerCnt++
            this.result.retries++
            this.onSpecRetry(cid, job, retryAttempts)
        } else {
            this.result.failed++
            this.onSpecFailure(cid, job, retryAttempts)
        }
    }

    /**
     * for testing purposes call console log in a static method
     */
    log (...args: any[]) {
        // eslint-disable-next-line no-console
        console.log(...args)
        return args
    }

    logHookError (error: HookError) {
        return this.log(`${chalk.red(error.name)} in "${error.origin}"\n${chalk.red(error.stack || error.message)}`)
    }

    /**
     * event handler that is triggered when runner sends up events
     */
    onMessage (event: CLIInterfaceEvent) {
        if (event.name === 'reporterRealTime') {
            this.log(event.content)
            return
        }
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

        const isRunning = this._jobs.size !== 0
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
        const totalJobs = this.totalWorkerCnt - this.result.retries
        const elapsed = (new Date(Date.now() - this._start.getTime())).toUTCString().match(/(\d\d:\d\d:\d\d)/)![0]
        const retries = this.result.retries ? chalk.yellow(this.result.retries, 'retries') + ', ' : ''
        const failed = this.result.failed ? chalk.red(this.result.failed, 'failed') + ', ' : ''
        const skipped = this._skippedSpecs > 0 ? chalk.gray(this._skippedSpecs, 'skipped') + ', ' : ''
        const percentCompleted = totalJobs ? Math.round(this.result.finished / totalJobs * 100) : 0
        return this.log(
            '\nSpec Files:\t', chalk.green(this.result.passed, 'passed') + ', ' + retries + failed + skipped + totalJobs, 'total', `(${percentCompleted}% completed)`, 'in', elapsed,
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

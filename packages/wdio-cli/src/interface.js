import chalk from 'chalk'
import EventEmitter from 'events'
import logger from '@wdio/logger'

import { getRunnerName } from './utils'

const log = logger('@wdio/cli')

export default class WDIOCLInterface extends EventEmitter {
    constructor(config, totalWorkerCnt, isWatchMode = false) {
        super()

        /**
         * Colors can be forcibly enabled/disabled with env variable `FORCE_COLOR`
         * `FORCE_COLOR=1` - forcibly enable colors
         * `FORCE_COLOR=0` - forcibly disable colors
         */
        this.hasAnsiSupport = !!chalk.supportsColor.hasBasic
        this.config = config
        this.totalWorkerCnt = totalWorkerCnt
        this.isWatchMode = isWatchMode
        this.inDebugMode = false
        this.specFileRetries = config.specFileRetries || 0
        this.specFileRetriesDelay = config.specFileRetriesDelay || 0
        this.skippedSpecs = 0

        this.on('job:start', this.addJob.bind(this))
        this.on('job:end', this.clearJob.bind(this))

        this.setup()
        this.onStart()
    }

    setup() {
        this.jobs = new Map()
        this.start = new Date()

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
        this.messages = {
            /**
             * messages from worker reporters
             */
            reporter: {},
            /**
             * messages from debugger handler
             */
            debugger: {}
        }
    }

    onStart() {
        this.log(chalk.bold(`\nExecution of ${chalk.blue(this.totalWorkerCnt)} spec files started at`), this.start.toISOString())
        if (this.inDebugMode) {
            this.log(chalk.bgYellow.black('DEBUG mode enabled!'))
        }
        if (this.isWatchMode) {
            this.log(chalk.bgYellow.black('WATCH mode enabled!'))
        }
        this.log('')
    }

    onSpecRunning(cid) {
        this.onJobComplete(cid, this.jobs.get(cid), 0, chalk.bold.cyan('RUNNING'))
    }

    onSpecRetry(cid, job, retries) {
        const delayMsg = this.specFileRetriesDelay > 0 ? ` after ${this.specFileRetriesDelay}s` : ''
        this.onJobComplete(cid, job, retries, chalk.bold(chalk.yellow('RETRYING') + delayMsg))
    }

    onSpecPass(cid, job, retries) {
        this.onJobComplete(cid, job, retries, chalk.bold.green('PASSED'))
    }

    onSpecFailure(cid, job, retries) {
        this.onJobComplete(cid, job, retries, chalk.bold.red('FAILED'))
    }

    onSpecSkip(cid, job) {
        this.onJobComplete(cid, job, 0, 'SKIPPED', log.info)
    }

    onJobComplete(cid, job, retries, message, _logger = this.log) {
        const details = [`[${cid}]`, message]
        if (job) {
            details.push('in', getRunnerName(job.caps), this.getFilenames(job.specs))
        }
        if (retries > 0) {
            details.push(`(${retries} retries)`)
        }

        return _logger(...details)
    }

    onTestError(payload) {
        let error = { type: 'Error', message: typeof payload.error === 'string' ? payload.error : 'Unknown error.' }
        if (payload.error) {
            error.type = payload.error.type || error.type
            error.message = payload.error.message || error.message
        }
        return this.log(`[${payload.cid}]`, `${chalk.red(error.type)} in "${payload.fullTitle}"\n${chalk.red(error.message)}`)
    }

    getFilenames(specs = []) {
        if (specs.length > 0) {
            return '- ' + specs.join(', ').replace(new RegExp(`${process.cwd()}`, 'g'), '')
        }
        return ''
    }

    /**
     * add job to interface
     */
    addJob({ cid, caps, specs, hasTests }) {
        this.jobs.set(cid, { caps, specs, hasTests })
        if (hasTests) {
            this.onSpecRunning(cid)
        } else {
            this.skippedSpecs++
        }
    }

    /**
     * clear job from interface
     */
    clearJob({ cid, passed, retries }) {
        const job = this.jobs.get(cid)

        this.jobs.delete(cid)
        const retryAttempts = this.specFileRetries - retries
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
    log(...args) {
        // eslint-disable-next-line no-console
        console.log(...args)
        return args
    }

    /**
     * event handler that is triggered when runner sends up events
     */
    onMessage(event) {
        if (event.origin === 'debugger' && event.name === 'start') {
            this.log(chalk.yellow(event.params.introMessage))
            this.inDebugMode = true
            return this.inDebugMode
        }

        if (event.origin === 'debugger' && event.name === 'stop') {
            this.inDebugMode = false
            return this.inDebugMode
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

        if (!this.messages[event.origin][event.name]) {
            this.messages[event.origin][event.name] = []
        }

        this.messages[event.origin][event.name].push(event.content)
        if (this.isWatchMode) {
            this.printReporters()
        }
    }

    sigintTrigger() {
        /**
         * allow to exit repl mode via Ctrl+C
         */
        if (this.inDebugMode) {
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
        const reporter = this.messages.reporter
        this.messages.reporter = {}
        for (const [reporterName, messages] of Object.entries(reporter)) {
            this.log('\n', chalk.bold.magenta(`"${reporterName}" Reporter:`))
            this.log(messages.join(''))
        }
    }

    printSummary() {
        const totalJobs = this.totalWorkerCnt - this.result.retries
        const elapsed = (new Date(Date.now() - this.start)).toUTCString().match(/(\d\d:\d\d:\d\d)/)[0]
        const retries = this.result.retries ? chalk.yellow(this.result.retries, 'retries') + ', ' : ''
        const failed = this.result.failed ? chalk.red(this.result.failed, 'failed') + ', ' : ''
        const skipped = this.skippedSpecs > 0 ? chalk.gray(this.skippedSpecs, 'skipped') + ', ' : ''
        const percentCompleted = totalJobs ? Math.round(this.result.finished / totalJobs * 100) : 0
        return this.log(
            '\nSpec Files:\t', chalk.green(this.result.passed, 'passed') + ', ' + retries + failed + skipped + totalJobs, 'total', `(${percentCompleted}% completed)`, 'in', elapsed,
            '\n'
        )
    }

    finalise() {
        if (this.isWatchMode) {
            return
        }

        this.printReporters()
        this.printSummary()
    }
}

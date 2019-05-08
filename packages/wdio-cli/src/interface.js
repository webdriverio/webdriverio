import chalk from 'chalk'
import EventEmitter from 'events'
import logger from '@wdio/logger'

import { getRunnerName } from './utils'

const log = logger('@wdio/cli')

export default class WDIOCLInterface extends EventEmitter {
    constructor (config, specs, totalWorkerCnt) {
        super()
        this.hasAnsiSupport = !!chalk.supportsColor.hasBasic
        this.isTTY = !!process.stdout.isTTY
        this.specs = specs
        this.config = config
        this.totalWorkerCnt = totalWorkerCnt
        this.isWatchMode = false
        this.inDebugMode = false
        this.specFileRetries = config.specFileRetries || 0

        this.on('job:start', ::this.addJob)
        this.on('job:end', ::this.clearJob)

        this.setup()
    }

    setup () {
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
             * messages from worker itself
             */
            worker: {}
        }

        this.onStart()
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
        this.onJobComplete(cid, job, retries, chalk.bold.yellow('RETRYING'))
    }

    onSpecPass(cid, job, retries) {
        this.onJobComplete(cid, job, retries, chalk.bold.green('PASSED'))
    }

    onSpecFailure(cid, job, retries) {
        this.onJobComplete(cid, job, retries, chalk.bold.red('FAILED'))
    }

    onJobComplete(cid, job, retries, message) {
        const details = []
        if (job) {
            const filename = Array.isArray(job.specs) ? job.specs.join(', ').replace(process.cwd(), '') : ''
            const retryCount = retries > 0 ? `(${retries} retries)` : ''
            details.push('in', getRunnerName(job.caps), filename ? `- ${filename}` : '', retryCount)
        }

        this.log(
            `[${cid}]`,
            message,
            ...details
        )
    }

    /**
     * add job to interface
     */
    addJob({ cid, caps, specs }) {
        this.jobs.set(cid, { caps, specs })
        this.onSpecRunning(cid)
    }

    /**
     * clear job from interface
     */
    clearJob ({ cid, passed, retries }) {
        const job = this.jobs.get(cid)

        this.jobs.delete(cid)
        const retryAttempts = this.specFileRetries - retries
        const retry = !passed && retries > 0
        if (!retry) {
            this.result.finished++
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
    /* istanbul ignore next */
    log (...args) {
        /* istanbul ignore next */
        // eslint-disable-next-line no-console
        console.log(...args)
    }

    /**
     * event handler that is triggered when runner sends up events
     */
    onMessage (event) {
        if (event.origin === 'debugger' && event.name === 'start') {
            this.log(chalk.yellow(event.params.introMessage))
            this.inDebugMode = true
            return this.inDebugMode
        }

        if (event.origin === 'debugger' && event.name === 'stop') {
            this.inDebugMode = false
            return this.inDebugMode
        }

        if (!event.origin || !this.messages[event.origin]) {
            return log.warn(`Can't identify message from worker: ${JSON.stringify(event)}, ignoring!`)
        }

        if (!this.messages[event.origin][event.name]) {
            this.messages[event.origin][event.name] = []
        }

        if (event.origin === 'reporter') {
            this.messages[event.origin][event.name].push(event.content)
            if (this.isWatchMode) {
                this.printReporters()
            }
        } else {
            this.log(event.cid, event.origin, event.name, event.content)
        }
    }

    sigintTrigger () {
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
        this.log('\n\n' + shutdownMessage)
        return true
    }

    printReporters () {
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
        const percentCompleted = totalJobs ? Math.round(this.result.finished / totalJobs * 100) : 0
        return this.log(
            '\nSpec Files:\t', chalk.green(this.result.passed, 'passed') + ', ' + retries + failed + totalJobs, 'total', `(${percentCompleted}% completed)`, 'in', elapsed,
            '\n'
        )
    }

    finalise () {
        this.printReporters()
        this.printSummary()
    }
}

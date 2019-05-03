import chalk from 'chalk'
import logUpdate from 'log-update'
import cliSpinners from 'cli-spinners'
import EventEmitter from 'events'
import logger from '@wdio/logger'

import { getRunnerName } from './utils'

const log = logger('@wdio/cli')

const clockSpinner = cliSpinners['clock']
const MAX_RUNNING_JOBS_DISPLAY_COUNT = 10

export default class WDIOCLInterface extends EventEmitter {
    constructor (config, specs, totalWorkerCnt, stdout, stderr) {
        super()
        this.hasAnsiSupport = !!chalk.supportsColor.hasBasic
        this.isTTY = !!process.stdout.isTTY
        this.specs = specs
        this.config = config
        this.totalWorkerCnt = totalWorkerCnt
        this.sigintTriggered = false
        this.isWatchMode = false
        this.inDebugMode = false
        this.stdout = stdout
        this.stdoutBuffer = []
        this.stderr = stderr
        this.stderrBuffer = []

        this.on('job:start', ::this.addJob)
        this.on('job:end', ::this.clearJob)

        this.setup()
    }

    setup () {
        this.clockTimer = 0
        this.jobs = new Map()
        this.start = Date.now()
        // The relationship between totalWorkerCnt and these counters are as follows:
        //   totalWorkerCnt - retries = finished = passed + failed
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
        this.clearConsole()
    }

    clearConsole () {
        this.display = []
    }

    /**
     * add job to interface
     */
    addJob({ cid, caps, specs }) {
        this.jobs.set(cid, { caps, specs })
        this.updateView()
    }

    /**
     * clear job from interface
     */
    clearJob ({ cid, passed, retries }) {
        const job = this.jobs.get(cid)

        this.jobs.delete(cid)
        const retry = !passed && retries > 0
        if (!retry) {
            this.result.finished++
        }

        if (passed) {
            this.result.passed++
        } else if (retry) {
            this.totalWorkerCnt++
            this.result.retries++
        } else {
            this.result.failed++
        }

        if (!process.env.CI) {
            return this.updateView(true)
        }

        return this.printJobUpdateCI(job, passed, retries)
    }

    /**
     * print job result in stdout for CI tests
     */
    printJobUpdateCI (job, passed, retries) {
        const filename = job.specs.join(', ').replace(process.cwd(), '')
        const cap = getRunnerName(job.caps)
        const status = passed ? 'PASS' : 'FAIL'
        const retryCount = retries > 0 ? `(${retries} retries)` : ''

        this.log(
            chalk.white[passed ? 'bgGreen' : 'bgRed'](status) + ' -',
            cap,
            filename,
            retryCount
        )
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
            this.resetClock()
            this.clearConsole()

            logUpdate.clear()
            logUpdate(chalk.yellow(event.params.introMessage))
            this.inDebugMode = true
            return
        }

        if (event.origin === 'debugger' && event.name === 'stop') {
            this.sigintTriggered = false
            this.inDebugMode = false
            return this.updateView()
        }

        if (!event.origin || !this.messages[event.origin]) {
            return log.warn(`Can't identify message from worker: ${JSON.stringify(event)}, ignoring!`)
        }

        if (!this.messages[event.origin][event.name]) {
            this.messages[event.origin][event.name] = []
        }
        this.messages[event.origin][event.name].push(event.content)
        this.updateView()
    }

    sigintTrigger () {
        /**
         * allow to exit repl mode via Ctrl+C
         */
        if (this.inDebugMode) {
            return
        }

        this.sigintTriggered = true
        this.updateView()
    }

    updateView (wasJobCleared) {
        const totalJobs = this.totalWorkerCnt - this.result.retries
        const pendingJobs = totalJobs - this.jobs.size - this.result.finished
        const runningJobs = this.jobs.size
        const isFinished = runningJobs === 0

        if (this.sigintTriggered) {
            this.resetClock()
            const shutdownMessage = !isFinished
                ? 'Ending WebDriver sessions gracefully ...\n' +
                '(press ctrl+c again to hard kill the runner)'
                : 'Ended WebDriver sessions gracefully after a SIGINT signal was received!'
            return logUpdate(this.display.join('\n') + '\n\n' + shutdownMessage)
        }

        if(isFinished || this.inDebugMode) {
            return
        }

        /**
         * check if environment supports ansi or does not
         * support TTY and print a limited update if not
         */
        if (!this.hasAnsiSupport || !this.isTTY) {
            /**
             * only update if a job finishes
             */
            if (!wasJobCleared) {
                return
            }

            const clockSpinnerSymbol = this.getClockSymbol()
            return this.display.push([
                `${clockSpinnerSymbol} ` +
                `${this.jobs.size} running, ` +
                `${this.result.passed} passed, ` +
                (this.result.retries ? `${this.result.retries} retries, ` : '') +
                `${this.result.failed} failed, ` +
                `${totalJobs} total ` +
                `(${Math.round((this.result.finished / totalJobs) * 100)}% completed)`].join(' '))
        }

        this.clearConsole()
        this.display.push('')

        /**
         * print running jobs
         */
        for (const [cid, job] of Array.from(this.jobs.entries()).slice(0, MAX_RUNNING_JOBS_DISPLAY_COUNT)) {
            const filename = job.specs.join(', ').replace(process.cwd(), '')
            this.display.push([
                chalk.bgYellow.black(' RUNNING '),
                cid,
                'in',
                getRunnerName(job.caps),
                '-',
                filename
            ].join(' '))
        }

        /**
         * show number of pending and running jobs
         */
        if (pendingJobs || runningJobs > MAX_RUNNING_JOBS_DISPLAY_COUNT) {
            const logString = []
            if (runningJobs > MAX_RUNNING_JOBS_DISPLAY_COUNT) {
                logString.push(
                    runningJobs - MAX_RUNNING_JOBS_DISPLAY_COUNT,
                    'running test suites' + (pendingJobs ? ' -' : ''))
            }
            if (pendingJobs) {
                logString.push(pendingJobs, 'pending test suites')
            }
            this.display.push(chalk.yellow('...', ...logString.filter(l => Boolean(l))))
        }

        /**
         * print reporters in watch mode
         */
        if (this.isWatchMode) {
            this.printReporters()
        }

        /**
         * add empty line between "pending tests" and results
         */
        if (this.jobs.size) {
            this.display.push('')
        }

        this.printStdout(10)
        this.printSummary()
        this.updateClock()
    }

    printReporters () {
        this.display.push('')

        /**
         * print reporter output
         */
        for (const [reporterName, messages] of Object.entries(this.messages.reporter)) {
            this.display.push(chalk.bgYellow.black(`"${reporterName}" Reporter:`))
            this.display.push(messages.join(''))
            this.display.push('')
        }
    }

    /**
     * print stdout and stderr from runners
     */
    printStdout (length) {
        const stdout = this.stdout.getContentsAsString('utf8')
        if (stdout) {
            this.stdoutBuffer.push(stdout)
        }

        const stderr = this.stderr.getContentsAsString('utf8')
        if (stderr) {
            this.stderrBuffer.push(stderr)
        }

        if (this.stdoutBuffer.length) {
            const bufferLength = this.stdoutBuffer.length
            const maxBufferLength = !length || length > bufferLength ? bufferLength : length
            const buffer = this.stdoutBuffer.slice(bufferLength - maxBufferLength)
            this.display.push(chalk.bgYellow.black('Stdout:\n') + buffer.join(''))
        }

        if (this.stderrBuffer.length) {
            const bufferLength = this.stderrBuffer.length
            const maxBufferLength = !length || length > bufferLength ? bufferLength : length
            const buffer = this.stderrBuffer.slice(bufferLength - maxBufferLength)
            this.display.push(chalk.bgRed.black('Stderr:\n') + buffer.join(''))
        }

        if (this.messages.worker.error) {
            const bufferLength = this.messages.worker.error.length
            const maxBufferLength = !length || length > bufferLength ? bufferLength : length
            const buffer = this.messages.worker.error.slice(bufferLength - maxBufferLength)
            this.display.push(chalk.bgRed.black('Worker Error:\n') + buffer.map(
                (e) => e.stack
            ).join('\n'))
        }
    }

    printSummary() {
        const totalJobs = this.totalWorkerCnt - this.result.retries
        return this.display.push([
            'Test Suites:\t', chalk.green(this.result.passed, 'passed') + ', ' +
            (this.result.retries ? chalk.yellow(this.result.retries, 'retries') + ', ' : '') +
            (this.result.failed ? chalk.red(this.result.failed, 'failed') + ', ' : '') +
            totalJobs, 'total',
            `(${totalJobs ? Math.round((this.result.finished / totalJobs) * 100) : 0}% completed)`
        ].join(' '))
    }

    updateClock (interval = 100) {
        const clockSpinnerSymbol = this.getClockSymbol()

        this.resetClock()

        /**
         * clear time row if given
         */
        if (this.display.length && this.display[this.display.length - 1].startsWith('Time:')) {
            this.display.pop()
        }

        this.display.push('Time:\t\t ' + clockSpinnerSymbol + ' ' + ((Date.now() - this.start) / 1000).toFixed(2) + 's')
        this.interval = setTimeout(() => this.updateClock(interval), interval)
        logUpdate(this.display.join('\n'))
    }

    getClockSymbol () {
        return clockSpinner.frames[this.clockTimer = ++this.clockTimer % clockSpinner.frames.length]
    }

    resetClock () {
        clearTimeout(this.interval)
    }

    finalise () {
        this.clearConsole()
        this.printStdout()
        this.printReporters()
        this.printSummary()
        this.updateClock()
        this.resetClock()

        /**
         * add line break at the end of result
         */
        // eslint-disable-next-line
        console.log('')
    }
}

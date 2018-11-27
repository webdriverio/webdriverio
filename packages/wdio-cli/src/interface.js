import chalk from 'chalk'
import cliSpinners from 'cli-spinners'
import EventEmitter from 'events'
import CLInterface from '@wdio/interface'
import logger from '@wdio/logger'

const log = logger('wdio-cli')

const clockSpinner = cliSpinners['clock']
const MAX_RUNNING_JOBS_DISPLAY_COUNT = 10

export default class WDIOCLInterface extends EventEmitter {
    constructor (config, specs, totalWorkerCnt) {
        super()
        this.hasAnsiSupport = !!chalk.supportsColor.hasBasic
        this.specs = specs
        this.config = config
        this.totalWorkerCnt = totalWorkerCnt
        this.sigintTriggered = false

        this.interface = new CLInterface()
        this.on('job:start', ::this.addJob)
        this.on('job:end', ::this.clearJob)

        this.setup()
    }

    setup () {
        this.clockTimer = 0
        this.jobs = new Map()
        this.start = Date.now()
        this.result = {
            finished: 0,
            passed: 0,
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
        this.interface.clearBuffer()
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
    clearJob ({ cid, passed }) {
        this.jobs.delete(cid)
        this.result.finished++

        if (passed) {
            this.result.passed++
        } else {
            this.result.failed++
        }

        this.updateView(true)
    }

    /**
     * event handler that is triggered when runner sends up events
     */
    onMessage (params) {
        if (params.origin === 'runner' && params.name === 'debug') {
            if (params.event === 'end') {
                this.interface.inDebugMode = false
                this.sigintTriggered = false
                return this.updateView()
            }

            clearTimeout(this.interval)
            this.interface.clearAll()
            this.interface.inDebugMode = true

            this.interface.log(chalk.yellow('The execution has stopped!'))
            this.interface.log(chalk.yellow('You can now go into the browser or use the command line as REPL'))
            this.interface.log(chalk.yellow('(To exit, press ^C again or type .exit)'))
            this.interface.log()
        }

        if (!params.origin || !this.messages[params.origin]) {
            return log.warn(`Can't identify message from worker: ${JSON.stringify(params)}, ignoring!`)
        }

        if (!this.messages[params.origin][params.name]) {
            this.messages[params.origin][params.name] = []
        }
        this.messages[params.origin][params.name].push(params.content)
    }

    sigintTrigger () {
        /**
         * allow to exit repl mode via Ctrl+C
         */
        if (this.interface.inDebugMode) {
            return
        }

        this.sigintTriggered = true
        this.updateView()
    }

    updateView (wasJobCleared) {
        const totalJobs = this.totalWorkerCnt
        const pendingJobs = this.totalWorkerCnt - this.jobs.size - this.result.finished
        const runningJobs = this.jobs.size
        const isFinished = runningJobs === 0

        /**
         * check if environment supports ansi and print a limited update if not
         */
        if (!this.hasAnsiSupport && !isFinished) {
            /**
             * only update if a job finishes
             */
            if (!wasJobCleared) {
                return
            }

            const clockSpinnerSymbol = this.getClockSymbol()
            return this.interface.log(
                `${clockSpinnerSymbol} ` +
                `${this.jobs.size} running, ` +
                `${this.result.passed} passed, ` +
                `${this.result.failed} failed, ` +
                `${totalJobs} total ` +
                `(${Math.round((this.result.finished / totalJobs) * 100)}% completed)`)
        }

        this.interface.clearAll()
        this.interface.log()

        /**
         * print reporter output
         */
        for (const [reporterName, messages] of Object.entries(this.messages.reporter)) {
            this.interface.log(chalk.bgYellow.black(`"${reporterName}" Reporter:`))
            this.interface.log(messages.join(''))
            this.interface.log()
        }

        /**
         * print running jobs
         */
        for (const [cid, job] of Array.from(this.jobs.entries()).slice(0, MAX_RUNNING_JOBS_DISPLAY_COUNT)) {
            const filename = job.specs.join(', ').replace(process.cwd(), '')
            this.interface.log(chalk.bgYellow.black(' RUNNING '), cid, 'in', job.caps.browserName, '-', filename)
        }

        /**
         * show number of pending and running jobs
         */
        if (pendingJobs || runningJobs > MAX_RUNNING_JOBS_DISPLAY_COUNT) {
            const logString = []
            if (runningJobs > MAX_RUNNING_JOBS_DISPLAY_COUNT) {
                logString.push(
                    runningJobs - MAX_RUNNING_JOBS_DISPLAY_COUNT,
                    'running tests' + (pendingJobs ? ' -' : ''))
            }
            if (pendingJobs) {
                logString.push(pendingJobs, 'pending tests')
            }
            this.interface.log(chalk.yellow('...', ...logString.filter(l => Boolean(l))))
        }

        /**
         * print stdout and stderr from runners
         */
        if (isFinished) {
            /* istanbul ignore else */
            if (this.interface.stdoutBuffer.length) {
                this.interface.log(chalk.bgYellow.black(`Stdout:\n`) + this.interface.stdoutBuffer.join(''))
            }
            /* istanbul ignore else */
            if (this.interface.stderrBuffer.length) {
                this.interface.log(chalk.bgRed.black(`Stderr:\n`) + this.interface.stderrBuffer.join(''))
            }
            /* istanbul ignore else */
            if (this.messages.worker.error) {
                this.interface.log(chalk.bgRed.black(`Worker Error:\n`) + this.messages.worker.error.map(
                    (e) => e.stack
                ).join('\n') + '\n')
            }
        }

        /**
         * add empty line between "pending tests" and results
         */
        if (this.jobs.size) {
            this.interface.log()
        }

        this.interface.log(
            'Test Suites:\t', chalk.green(this.result.passed, 'passed') + ', ' +
            (this.result.failed ? chalk.red(this.result.failed, 'failed') + ', ' : '') +
            totalJobs, 'total',
            `(${totalJobs ? Math.round((this.result.finished / totalJobs) * 100) : 0}% completed)`
        )

        this.updateClock()

        if (this.sigintTriggered) {
            clearTimeout(this.interval)
            this.interface.log('\n')
            this.interface.log(!isFinished
                ? 'Ending WebDriver sessions gracefully ...\n' +
                  '(press ctrl+c again to hard kill the runner)'
                : 'Ended WebDriver sessions gracefully after a SIGINT signal was received!'
            )
        }

        if (isFinished) {
            clearTimeout(this.interval)
            this.interface.log('\n')
        }
    }

    updateClock (interval = 100) {
        const clockSpinnerSymbol = this.getClockSymbol()

        clearTimeout(this.interval)
        this.interface.clearLine()
        this.interface.write('Time:\t\t ' + clockSpinnerSymbol + ' ' + ((Date.now() - this.start) / 1000).toFixed(2) + 's')
        this.interval = setTimeout(() => this.updateClock(interval), interval)
    }

    getClockSymbol () {
        return clockSpinner.frames[this.clockTimer = ++this.clockTimer % clockSpinner.frames.length]
    }
}

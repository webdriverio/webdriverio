import chalk from 'chalk'
import cliSpinners from 'cli-spinners'
import EventEmitter from 'events'
import CLIInterface from 'wdio-interface'

const clock = cliSpinners['clock']

export default class WDIOCLIInterface extends EventEmitter {
    constructor (config, specs) {
        super()
        this.hasAnsiSupport = chalk.supportsColor.hasBasic
        this.clockTimer = 0
        this.specs = specs
        this.config = config
        this.jobs = new Map()
        this.start = Date.now()
        this.result = {
            finished: 0,
            passed: 0,
            failed: 0
        }
        this.messages = {
            reporter: {}
        }

        this.interface = new CLIInterface()
        this.on('job:start', ::this.addJob)
        this.on('job:end', ::this.clearJob)
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
        if (!this.messages[params.origin][params.name]) {
            this.messages[params.origin][params.name] = []
        }
        this.messages[params.origin][params.name].push(params.content)
    }

    updateView (wasJobCleared) {
        const isFinished = this.jobs.size === 0
        const pendingJobs = this.specs.length - this.jobs.size - this.result.finished

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

            const time = clock.frames[this.clockTimer = ++this.clockTimer % clock.frames.length]
            return this.interface.log(
                `${time} Running: ${this.jobs.size}, ` +
                `${this.result.passed} passed, ` +
                `${this.result.failed} failed, ` +
                `${this.specs.length} total ` +
                `(${Math.round((this.result.finished / this.specs.length) * 100)}% completed)`)
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
        for (const [cid, job] of this.jobs.entries()) {
            const filename = job.specs.join(', ').replace(process.cwd(), '')
            this.interface.log(chalk.bgYellow.black(' RUNNING '), cid, 'in', job.caps.browserName, '-', filename)
        }

        if (pendingJobs) {
            this.interface.log(chalk.yellow('...', pendingJobs, 'pending tests'))
        }

        /**
         * print stdout and stderr from runners
         */
        if (isFinished) {
            if (this.interface.stdoutBuffer.length) {
                this.interface.log(chalk.bgYellow.black(`Stdout:\n`) + this.interface.stdoutBuffer.join(''))
            }
            if (this.interface.stderrBuffer.length) {
                this.interface.log(chalk.bgRed.black(`\nStderr:\n`) + this.interface.stderrBuffer.join(''))
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
            this.specs.length, 'total',
            `(${Math.round((this.result.finished / this.specs.length) * 100)}% completed)`
        )

        this.updateClock()

        if (isFinished) {
            clearTimeout(this.interval)
            this.interface.log('\n')
        }
    }

    updateClock (interval = 100) {
        const time = clock.frames[this.clockTimer = ++this.clockTimer % clock.frames.length]

        clearTimeout(this.interval)
        this.interface.clearLine()
        this.interface.write('Time:\t\t ' + time + ' ' + ((Date.now() - this.start) / 1000).toFixed(2) + 's')
        this.interval = setTimeout(() => this.updateClock(interval), interval)
    }
}

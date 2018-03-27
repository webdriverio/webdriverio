import chalk from 'chalk'
import cliSpinners from 'cli-spinners'
import EventEmitter from 'events'
import CLIInterface from 'wdio-interface'

const clock = cliSpinners['clock']

export default class WDIOCLIInterface extends EventEmitter {
    constructor (config, specs) {
        super()
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

        this.interface = new CLIInterface()
        this.on('job:start', ::this.addJob)
        this.on('job:end', ::this.clearJob)
        this.updateView()
    }

    addJob({ cid, caps, specs }) {
        this.jobs.set(cid, { caps, specs })
        this.updateView()
    }

    clearJob ({ cid, passed }) {
        this.jobs.delete(cid)
        this.result.finished++

        if (passed) {
            this.result.passed++
        } else {
            this.result.failed++
        }

        this.updateView()
    }

    updateView () {
        const pendingJobs = this.specs.length - this.jobs.size - this.result.finished

        this.interface.clearAll()
        this.interface.log()

        for (var [cid, job] of this.jobs.entries()) {
            const filename = job.specs.join(', ').replace(process.cwd(), '')
            this.interface.log('RUNNING', cid, 'in', job.caps.browserName, '-', filename)
        }

        if (pendingJobs) {
            this.interface.log(chalk.yellow('...', pendingJobs, 'pending tests'))
        }

        /**
         * print stdout and stderr from runners
         */
        if (this.jobs.size === 0) {
            if (this.interface.stdoutBuffer.length) {
                this.interface.log(`Stdout:\n${this.interface.stdoutBuffer.join('')}`)
            }
            if (this.interface.stderrBuffer.length) {
                this.interface.log(`\nStderr:\n${this.interface.stderrBuffer.join('')}`)
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

        if (this.jobs.size === 0) {
            clearTimeout(this.interval)
            this.interface.log('\n')
        }
    }

    updateClock () {
        const time = clock.frames[this.clockTimer = ++this.clockTimer % clock.frames.length]

        clearTimeout(this.interval)
        this.interface.clearLine()
        this.interface.write('Time:\t\t ' + time + ' ' + ((Date.now() - this.start) / 1000).toFixed(2) + 's')
        this.interval = setTimeout(::this.updateClock, 100)
    }
}

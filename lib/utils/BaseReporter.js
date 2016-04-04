import tty from 'tty'
import events from 'events'
import supportsColor from 'supports-color'
import sanitize from '../helpers/sanitize'
import { ReporterStats } from './ReporterStats'

const ISATTY = tty.isatty(1) && tty.isatty(2)

const COLORS = {
    'pass': 90,
    'fail': 31,
    'bright pass': 92,
    'bright fail': 91,
    'bright yellow': 93,
    'pending': 36,
    'suite': 0,
    'error title': 0,
    'error message': 31,
    'error stack': 90,
    'checkmark': 32,
    'fast': 90,
    'medium': 33,
    'slow': 31,
    'green': 32,
    'light': 90,
    'diff gutter': 90,
    'diff added': 32,
    'diff removed': 31
}

const SYMBOLS_WIN = {
    ok: '\u221A',
    err: '\u00D7',
    dot: '.',
    error: 'F'
}

const SYMBOLS = {
    ok: '✓',
    err: '✖',
    dot: '․',
    error: 'F'
}

class BaseReporter extends events.EventEmitter {
    constructor () {
        super()

        this.reporters = []
        this.printEpilogue = true
        this.cursor = new Cursor()
        this.stats = new ReporterStats()

        this.on('start', () => {
        })

        this.on('runner:start', (runner) => {
            this.stats.runnerStart(runner)
            this.stats.specStart(runner)
        })

        this.on('runner:init', (runner) => {
            this.stats.setSessionId(runner)
        })

        this.on('runner:beforecommand', (command) => {
            this.stats.output('beforecommand', command)
        })

        this.on('runner:command', (command) => {
            this.stats.output('command', command)
        })

        this.on('runner:aftercommand', (command) => {
            this.stats.output('aftercommand', command)
        })

        this.on('runner:result', (result) => {
            this.stats.output('result', result)
        })

        this.on('runner:screenshot', (screenshot) => {
            this.stats.output('screenshot', screenshot)
        })

        this.on('runner:log', (log) => {
            this.stats.output('log', log)
        })

        this.on('suite:start', (suite) => {
            this.stats.suiteStart(suite)
        })

        this.on('hook:start', (hook) => {
            this.stats.hookStart(hook)
        })

        this.on('hook:end', (hook) => {
            this.stats.hookEnd(hook)
        })

        this.on('test:start', (test) => {
            this.stats.testStart(test)
        })

        this.on('test:pass', (test) => {
            this.stats.testPass(test)
        })

        this.on('test:fail', (test) => {
            this.stats.testFail(test)
        })

        this.on('test:pending', (test) => {
            this.stats.testPending(test)
        })

        this.on('test:end', (test) => {
            this.stats.testEnd(test)
        })

        this.on('suite:end', (runner) => {
            this.stats.suiteEnd(runner)
        })

        this.on('error', (runner) => {
            this.printEpilogue = false

            var fmt = this.color('error message', 'ERROR: %s')
            console.log(fmt, runner.error.message)

            fmt = this.color('bright yellow', sanitize.caps(runner.capabilities))
            console.log(fmt)

            if (runner.error.stack) {
                fmt = this.color('error stack', runner.error.stack.replace(`Error: ${runner.error.message}\n`, ''))
            } else {
                fmt = this.color('error stack', '    no stack available')
            }
            console.log(fmt)
        })

        this.on('runner:end', (runner) => {
            this.stats.runnerEnd(runner)
        })

        this.on('end', (args) => {
            this.stats.complete()
            this.printEpilogue = this.printEpilogue && !args.sigint
        })
    }

    /**
     * Color `str` with the given `type`,
     * allowing colors to be disabled,
     * as well as user-defined color
     * schemes.
     *
     * @param {String} type
     * @param {String} str
     * @return {String}
     * @api private
     */
    color (type, str) {
        if (!supportsColor) return String(str)
        return `\u001b[${COLORS[type]}m${str}\u001b[0m`
    }

    limit (val) {
        return sanitize.limit(val)
    }

    /**
     * Output common epilogue used by many of
     * the bundled reporters.
     *
     * @api public
     */
    epilogue () {
        if (!this.printEpilogue) {
            return
        }

        const counts = this.stats.getCounts()

        console.log('\n')

        // passes
        let fmt = this.color('green', '%d passing') + this.color('light', ' (%ss)')
        console.log(fmt, counts.passes || 0, ((Math.round(this.stats.duration / 100)) / 10).toFixed(2))

        // pending
        if (counts.pending) {
            fmt = this.color('pending', '%d pending')
            console.log(fmt, counts.pending)
        }

        // failures
        if (counts.failures) {
            fmt = this.color('fail', '%d failing')
            console.log(fmt, counts.failures)
            this.listFailures()
        }

        console.log()

        this.printEpilogue = false
    }

    /**
     * Outut the given failures as a list
     */
    listFailures () {
        console.log()
        this.stats.getFailures().forEach((test, i) => {
            let fmt = this.color('error title', '%s) %s:\n') +
                      this.color('error message', '%s') +
                      this.color('bright yellow', '%s') +
                      this.color('error stack', '\n%s\n')
            console.log(fmt, (i + 1), test.title, test.err.message, test.runningBrowser, test.err.stack)
        })
    }

    add (reporter) {
        this.reporters.push(reporter)
    }

    // Although BaseReporter is an eventemitter, handleEvent() is called instead of emit()
    // so that every event can be propagated to attached reporters
    handleEvent (...args) {
        if (this.listeners(args[0]).length) {
            this.emit.apply(this, args)
        }

        if (this.reporters.length === 0) {
            return
        }

        for (const reporter of this.reporters) {
            /**
             * skip reporter if
             *  - he isn't an eventemitter
             *  - event is not registered
             */
            if (typeof reporter.emit !== 'function' || !reporter.listeners(args[0]).length) {
                continue
            }

            reporter.emit.apply(reporter, args)
        }
    }

    /**
     * Default color map.
     */
    get colors () {
        return COLORS
    }

    /**
     * Default symbol map.
     */
    get symbols () {
        /**
         * With node.js on Windows: use symbols available in terminal default fonts
         */
        if (process.platform === 'win32') {
            return SYMBOLS_WIN
        }

        return SYMBOLS
    }
}

/**
 * Expose some basic cursor interactions
 * that are common among reporters.
 */
class Cursor {
    hide () {
        ISATTY && process.stdout.write('\u001b[?25l')
    }

    show () {
        ISATTY && process.stdout.write('\u001b[?25h')
    }

    deleteLine () {
        ISATTY && process.stdout.write('\u001b[2K')
    }

    beginningOfLine () {
        ISATTY && process.stdout.write('\u001b[0G')
    }

    CR () {
        if (ISATTY) {
            this.deleteLine()
            this.beginningOfLine()
        } else {
            process.stdout.write('\r')
        }
    }

    get isatty () {
        return ISATTY
    }
}

export default BaseReporter
export { Cursor }

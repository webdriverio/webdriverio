import tty from 'tty'
import events from 'events'
import supportsColor from 'supports-color'

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

        this.stats = {
            suites: 0,
            tests: 0,
            passes: 0,
            pending: 0,
            failures: 0,
            runner: {}
        }
        this.failures = []
        this.reporters = []
        this.printEpilogue = true
        this.cursor = new Cursor()

        this.on('start', () => {
            this.stats.start = new Date()
        })

        this.on('runner:start', (runner) => {
            if (!this.stats.runner[runner.cid]) {
                this.stats.runner[runner.cid] = {
                    start: new Date(),
                    capabilities: runner.capabilities,
                    config: runner.config,
                    tests: []
                }
            }
        })

        this.on('runner:init', (runner) => {
            this.stats.runner[runner.cid].sessionID = runner.sessionID
        })

        this.on('suite:start', (suite) => {
            suite.root || this.stats.suites++
        })

        this.on('suite:end', (suite) => {
        })

        this.on('test:end', (test) => {
            this.stats.tests++
        })

        this.on('test:pass', (test) => {
            this.stats.runner[test.cid].tests.push(null)
            this.stats.passes++
        })

        this.on('test:fail', (test) => {
            this.stats.failures++
            this.stats.runner[test.cid].tests.push(test.err)

            /**
             * check if error also happened in other runners
             */
            var duplicateError = false
            for (let failure of this.failures) {
                if (test.err.message !== failure.err.message || failure.title !== test.title) {
                    continue
                }
                duplicateError = true
                failure.runner[test.cid] = test.runner[test.cid]
            }

            if (!duplicateError) {
                this.failures.push(test)
            }
        })

        this.on('test:pending', (test) => {
            this.stats.pending++
        })

        this.on('runner:end', (runner) => {
            this.stats.runner[runner.cid].end = new Date()
        })

        this.on('end', (args) => {
            this.stats.end = new Date()
            this.stats.duration = new Date() - this.stats.start
            this.printEpilogue = this.printEpilogue && !args.sigint
        })

        this.on('error', (m) => {
            this.printEpilogue = false

            var fmt = this.color('error message', 'ERROR: %s')
            console.log(fmt, m.error.message)

            var sanitizedCaps = []
            for (let capability of Object.keys(m.capabilities)) {
                /**
                 * we don't need all capability types to recognise a vm
                 */
                if (['browserName', 'platform', 'version', 'platformVersion', 'deviceName', 'app'].indexOf(capability) === -1) {
                    continue
                }

                sanitizedCaps.push(capability + ': ' + JSON.stringify(m.capabilities[capability]))
            }

            fmt = this.color('bright yellow', sanitizedCaps.join(', '))
            console.log(fmt)

            if (m.error.stack) {
                fmt = this.color('error stack', m.error.stack.replace(`Error: ${m.error.message}\n`, ''))
            } else {
                fmt = this.color('error stack', '    no stack available')
            }
            console.log(fmt)
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

    /**
     * Output common epilogue used by many of
     * the bundled reporters.
     *
     * @api public
     */
    epilogue () {
        let fmt = null

        if (!this.printEpilogue) {
            return
        }

        console.log('\n')

        // passes
        fmt = this.color('green', '%d passing') + this.color('light', ' (%ss)')
        console.log(fmt, this.stats.passes || 0, ((Math.round(this.stats.duration / 100)) / 10).toFixed(2))

        // pending
        if (this.stats.pending) {
            fmt = this.color('pending', '%d pending')
            console.log(fmt, this.stats.pending)
        }

        // failures
        if (this.stats.failures) {
            fmt = this.color('fail', '%d failing')
            console.log(fmt, this.stats.failures)
            this.listFailures()
        }

        console.log()
    }

    /**
     * Outut the given failures as a list
     */
    listFailures () {
        console.log()

        this.failures.forEach((test, i) => {
            let runningBrowser = ''
            for (let pid of Object.keys(test.runner)) {
                let caps = test.runner[pid]
                runningBrowser += '\nrunning'

                if (caps.browserName) {
                    runningBrowser += ` ${caps.browserName}`
                }
                if (caps.version) {
                    runningBrowser += ` (v${caps.version})`
                }
                if (caps.platform) {
                    runningBrowser += ` on ${caps.platform}`
                }

                var host = this.stats.runner[pid].config.host
                if (host && host.indexOf('saucelabs') > -1) {
                    runningBrowser += '\nCheck out job at https://saucelabs.com/tests/' + this.stats.runner[pid].sessionID
                }
            }

            // format
            let fmt = this.color('error title', '%s) %s:\n') +
                      this.color('error message', '%s') +
                      this.color('bright yellow', '%s') +
                      this.color('error stack', '\n%s\n')

            console.log(fmt, (i + 1), test.title, test.err.message, runningBrowser, test.err.stack)
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
             * 	- he isn't an eventemitter
             * 	- event is not registered
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

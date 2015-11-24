import tty from 'tty'
import events from 'events'
import supportsColor from 'supports-color'
import sanitize from '../helpers/sanitize'

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

const STRINGLIMIT = 10000

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
            this.propagateEvent('start')
        })

        this.on('runner:start', (runner) => {
            this.getSpecStats(runner)
            this.propagateEvent('runner:start', runner)
        })

        this.on('runner:init', (runner) => {
            const specStats = this.getSpecStats(runner)
            specStats.sessionID = runner.sessionID
            this.propagateEvent('runner:init', runner)
        })

        this.on('runner:command', (command) => {
            if (!command.title || !command.parent) return
            const testStats = this.getTestStats(command)
            testStats.output.push({
                type: 'command',
                command
            })
            this.propagateEvent('runner:command', command)
        })

        this.on('runner:result', (result) => {
            if (!result.title || !result.parent) return
            const testStats = this.getTestStats(result)
            testStats.output.push({
                type: 'result',
                result
            })
            this.propagateEvent('runner:result', result)
        })

        this.on('runner:screenshot', (screenshot) => {
            const testStats = this.getTestStats(screenshot)
            testStats.output.push({
                type: 'screenshot',
                screenshot
            })
            this.propagateEvent('runner:screenshot', screenshot)
        })

        this.on('suite:start', (suite) => {
            this.getSuiteStats(suite)
            this.stats.suites++
            this.propagateEvent('suite:start', suite)
        })

        this.on('test:start', (test) => {
            this.getTestStats(test)
            this.propagateEvent('test:start', test)
        })

        this.on('hook:start', (hook) => {
            this.propagateEvent('hook:start', hook)
        })

        this.on('hook:end', (hook) => {
            this.propagateEvent('hook:end', hook)
        })

        this.on('test:pass', (test) => {
            const testStats = this.getTestStats(test)
            testStats.state = 'pass'
            this.stats.passes++
            this.propagateEvent('test:pass', test)
        })

        this.on('test:fail', (test) => {
            const testStats = this.getTestStats(test)
            testStats.state = 'fail'
            testStats.error = test.err
            this.stats.failures++

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

            this.propagateEvent('test:fail', test)
        })

        this.on('test:pending', (test) => {
            const testStats = this.getTestStats(test)
            testStats.state = 'pending'
            this.stats.pending++
            this.propagateEvent('test:pending', test)
        })

        this.on('test:end', (test) => {
            const testStats = this.getTestStats(test)
            testStats.duration = new Date() - testStats.start
            this.stats.tests++
            this.propagateEvent('test:end', test)
        })

        this.on('suite:end', (suite) => {
            const suiteStats = this.getSuiteStats(suite)
            suiteStats.duration = new Date() - suiteStats.start
            this.propagateEvent('suite:end', suite)
        })

        this.on('error', (m) => {
            this.printEpilogue = false

            var fmt = this.color('error message', 'ERROR: %s')
            console.log(fmt, m.error.message)

            fmt = this.color('bright yellow', sanitize.caps(m.capabilities))
            console.log(fmt)

            if (m.error.stack) {
                fmt = this.color('error stack', m.error.stack.replace(`Error: ${m.error.message}\n`, ''))
            } else {
                fmt = this.color('error stack', '    no stack available')
            }
            console.log(fmt)

            this.propagateEvent('error', m)
        })

        this.on('runner:end', (runner) => {
            const specStats = this.getSpecStats(runner)
            specStats.duration = new Date() - specStats.start
            this.propagateEvent('runner:end', runner)
        })

        this.on('end', (args) => {
            this.stats.duration = new Date() - this.stats.start
            this.printEpilogue = this.printEpilogue && !args.sigint
            this.propagateEvent('end', args)
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
        switch (Object.prototype.toString.call(val)) {
        case '[object String]':
            if (val.length > 100 && val.match(/^([A-Za-z0-9+\/]{4})*([A-Za-z0-9+\/]{4}|[A-Za-z0-9+\/]{3}=|[A-Za-z0-9+\/]{2}==)$/)) {
                return '[base64 string]'
            } else if (val.length > STRINGLIMIT) {
                return val.slice(0, STRINGLIMIT) + '... (' + (val.length - STRINGLIMIT) + ' more bytes)'
            }
            return val
        case '[object Array]':
            return val.map(this.limit.bind(this))
        case '[object Object]':
            const copy = {}
            for (let key of Object.keys(val)) {
                copy[key] = this.limit(val[key])
            }
            return copy
        default:
            return val
        }
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

    propagateEvent (...args) {
        if (this.reporters.length === 0) {
            return
        }

        for (const reporter of this.reporters) {
            /**
             * skip reporter if
             * 	- he isn't an eventemitter
             * 	- event is not registered
             */
            if (typeof reporter.emit !== 'function' || Object.keys(reporter._events).indexOf(args[0]) < 0) {
                continue
            }

            reporter.emit.apply(reporter, args)
        }
    }

    getSpecStats (obj) {
        this.stats.runner[obj.cid] = Object.assign({
            start: new Date(),
            capabilities: obj.capabilities,
            sanitizedCapabilities: sanitize.caps(obj.capabilities),
            config: obj.config,
            specs: {}
        }, this.stats.runner[obj.cid])

        this.stats.runner[obj.cid].specs[obj.specHash] = Object.assign({
            start: new Date(),
            files: obj.specs,
            suites: {}
        }, this.stats.runner[obj.cid].specs[obj.specHash])

        return this.stats.runner[obj.cid].specs[obj.specHash]
    }

    getSuiteStats (suite) {
        const specStats = this.getSpecStats(suite)

        specStats.suites[suite.title] = Object.assign({
            start: new Date(),
            tests: {}
        }, specStats.suites[suite.title])

        return specStats.suites[suite.title]
    }

    getTestStats (test) {
        const suiteStats = this.getSpecStats(test).suites[test.parent]

        suiteStats.tests[test.title] = Object.assign({
            start: new Date(),
            state: '',
            screenshots: [],
            output: []
        }, suiteStats.tests[test.title])

        return suiteStats.tests[test.title]
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

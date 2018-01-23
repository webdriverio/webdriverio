import merge from 'deepmerge'
import crypto from 'crypto'
import sanitize from '../helpers/sanitize'

class RunnableStats {
    constructor (type, start) {
        this.type = type
        this.start = start || new Date()
        this._duration = 0
    }

    complete (end) {
        this.end = end || new Date()
        this._duration = this.end - this.start
    }

    get duration () {
        if (this.end) {
            return this._duration
        }
        return new Date() - this.start
    }
}

class RunnerStats extends RunnableStats {
    constructor (runner) {
        super('runner', runner._timestamp)
        this.uid = ReporterStats.getIdentifier(runner)
        this.cid = runner.cid
        this.capabilities = runner.capabilities
        this.sanitizedCapabilities = runner.capabilities && sanitize.caps(runner.capabilities)
        this.config = runner.config
        this.specs = {}
    }
}

class SpecStats extends RunnableStats {
    constructor (runner) {
        super('spec', runner._timestamp)
        this.uid = ReporterStats.getIdentifier(runner)
        this.files = runner.specs
        this.specHash = runner.specHash
        this.suites = {}
        this.output = []
    }
}

class SuiteStats extends RunnableStats {
    constructor (runner) {
        super('suite', runner._timestamp)
        this.uid = ReporterStats.getIdentifier(runner)
        this.title = runner.title
        this.tests = {}
        this.hooks = {}
    }
}

class TestStats extends RunnableStats {
    constructor (runner) {
        super('test', runner._timestamp)
        this.uid = ReporterStats.getIdentifier(runner)
        this.title = runner.title
        this.state = ''
        this.screenshots = []
        this.output = []
    }
}

class HookStats extends RunnableStats {
    constructor (runner) {
        super('hook', runner._timestamp)
        this.uid = ReporterStats.getIdentifier(runner)
        this.title = runner.title
        this.parent = runner.parent
        this.parentUid = runner.parentUid || runner.parent
        this.currentTest = runner.currentTest
    }
}

class ReporterStats extends RunnableStats {
    constructor () {
        super('base')
        this.runners = {}

        this.reset()
    }

    reset () {
        this.counts = {
            suites: 0,
            tests: 0,
            hooks: 0,
            passes: 0,
            pending: 0,
            failures: 0
        }
        this.failures = []
    }

    getCounts () {
        return this.counts
    }

    getFailures () {
        return this.failures.map((test) => {
            test.runningBrowser = ''
            for (let pid of Object.keys(test.runner)) {
                let caps = test.runner[pid]
                test.runningBrowser += '\nrunning'

                if (caps.browserName) {
                    test.runningBrowser += ` ${caps.browserName}`
                }
                if (caps.version) {
                    test.runningBrowser += ` (v${caps.version})`
                }
                if (caps.platform) {
                    test.runningBrowser += ` on ${caps.platform}`
                }

                const host = this.runners[pid].config.host
                if (host && host.indexOf('saucelabs') > -1) {
                    test.runningBrowser += '\nCheck out job at https://saucelabs.com/tests/' + this.runners[pid].sessionID
                }
            }
            return test
        })
    }

    runnerStart (runner) {
        if (!this.runners[runner.cid]) {
            this.runners[runner.cid] = new RunnerStats(runner)
        }
    }

    getRunnerStats (runner) {
        if (!this.runners[runner.cid]) throw Error(`Unrecognised runner [${runner.cid}]`)
        return this.runners[runner.cid]
    }

    getSpecHash (runner) {
        if (!runner.specHash) {
            if (!runner.specs) throw Error('Cannot generate spec hash for runner with no \'specs\' key')
            runner.specHash = crypto.createHash('md5')
                .update(runner.specs.join(''))
                .digest('hex')
        }
        return runner.specHash
    }

    specStart (runner) {
        const specHash = this.getSpecHash(runner)
        this.getRunnerStats(runner).specs[specHash] = new SpecStats(runner)
    }

    getSpecStats (runner) {
        const runnerStats = this.getRunnerStats(runner)
        const specHash = this.getSpecHash(runner)
        if (!runnerStats.specs[specHash]) throw Error(`Unrecognised spec [${specHash}] for runner [${runner.cid}]`)
        return runnerStats.specs[specHash]
    }

    setSessionId (runner) {
        this.getRunnerStats(runner).sessionID = runner.sessionID
    }

    suiteStart (runner) {
        this.getSpecStats(runner).suites[ReporterStats.getIdentifier(runner)] = new SuiteStats(runner)
        this.counts.suites++
    }

    getSuiteStats (runner, suiteTitle) {
        let specStats = this.getSpecStats(runner)

        /**
         * if error occurs in root level hooks we haven't created any suites yet, so
         * create one here if so
         */
        if (!specStats.suites[suiteTitle]) {
            this.suiteStart(merge(runner, { title: runner.parent }))
            specStats = this.getSpecStats(runner)
        }

        return specStats.suites[suiteTitle]
    }

    hookStart (runner) {
        const suiteStat = this.getSuiteStats(runner, runner.parentUid || runner.parent)

        if (!suiteStat) {
            return
        }

        suiteStat.hooks[ReporterStats.getIdentifier(runner)] = new HookStats(runner)
    }

    hookEnd (runner) {
        const hookStats = this.getHookStats(runner)

        if (!hookStats) {
            return
        }

        hookStats.complete(runner._timestamp)
        this.counts.hooks++
    }

    testStart (runner) {
        this.getSuiteStats(runner, runner.parentUid || runner.parent).tests[ReporterStats.getIdentifier(runner)] = new TestStats(runner)
    }
    getHookStats (runner) {
        const suiteStats = this.getSuiteStats(runner, runner.parentUid || runner.parent)

        if (!suiteStats) {
            return
        }

        // Errors encountered inside hooks (e.g. beforeEach) can be identified by looking
        // at the currentTest param (currently only applicable to the Mocha adapter).
        let uid = runner.currentTest || ReporterStats.getIdentifier(runner)
        if (!suiteStats.hooks[uid]) {
            uid = ReporterStats.getIdentifier(runner)
        }

        if (!suiteStats.hooks[uid]) throw Error(`Unrecognised hook [${runner.title}] for suite [${runner.parent}]`)
        return suiteStats.hooks[uid]
    }
    getTestStats (runner) {
        const suiteStats = this.getSuiteStats(runner, runner.parentUid || runner.parent)

        if (!suiteStats) {
            return
        }

        // Errors encountered inside hooks (e.g. beforeEach) can be identified by looking
        // at the currentTest param (currently only applicable to the Mocha adapter).
        let uid = runner.currentTest || ReporterStats.getIdentifier(runner)
        if (!suiteStats.tests[uid]) {
            uid = ReporterStats.getIdentifier(runner)
        }

        if (!suiteStats.tests[uid]) throw Error(`Unrecognised test [${runner.title}] for suite [${runner.parent}]`)
        return suiteStats.tests[uid]
    }

    output (type, runner) {
        runner.time = new Date()
        const storedRunner = merge({}, runner, { clone: true })
        // Remove the screenshot data to reduce RAM usage on the parent process
        const knownScreenshotCommands = ['saveDocumentScreenshot', 'saveViewportScreenshot', 'saveElementScreenshot']

        if (type === 'screenshot') {
            storedRunner.data = null
        } else if (type === 'result' && runner.requestOptions && runner.requestOptions.uri.path.includes('screenshot')) {
            storedRunner.body = null
        } else if (type === 'aftercommand' && knownScreenshotCommands.includes(runner.command)) {
            storedRunner.result = null
        }
        if (ReporterStats.getIdentifier(runner) && runner.parent) {
            this.getTestStats(runner).output.push({
                type,
                payload: storedRunner
            })
        } else {
            // Log commands, results and screenshots executed outside of a test
            this.getSpecStats(runner).output.push({
                type,
                payload: storedRunner
            })
        }
    }

    testPass (runner) {
        this.getTestStats(runner).state = 'pass'
        this.counts.passes++
    }

    testPending (runner) {
        // Pending tests don't actually start, so won't yet be registered
        this.testStart(runner)
        this.testEnd(runner)
        this.getTestStats(runner).state = 'pending'
        this.counts.pending++
    }

    testFail (runner) {
        let testStats

        /**
         * replace "Ensure the done() callback is being called in this test." with more meaningful
         * message
         */
        let message = 'Ensure the done() callback is being called in this test.'
        if (runner.err && runner.err.message && runner.err.message.indexOf(message) > -1) {
            let replacement = `The execution in the test "${runner.parent} ${runner.title}" took ` +
                                'too long. Try to reduce the run time or increase your timeout for ' +
                                'test specs (http://webdriver.io/guide/testrunner/timeouts.html).'
            runner.err.message = runner.err.message.replace(message, replacement)
            runner.err.stack = runner.err.stack.replace(message, replacement)
        }

        message = 'For async tests and hooks, ensure "done()" is called;'
        if (runner.err && runner.err.message && runner.err.message.indexOf(message) > -1) {
            let replacement = 'Try to reduce the run time or increase your timeout for ' +
                                'test specs (http://webdriver.io/guide/testrunner/timeouts.html);'
            runner.err.message = runner.err.message.replace(message, replacement)
            runner.err.stack = runner.err.stack.replace(message, replacement)
        }

        try {
            testStats = this.getTestStats(runner) || {}
        } catch (e) {
            // If a test fails during the before() or beforeEach() hook, it will not yet
            // have been 'started', so start now
            this.testStart(runner)
            testStats = this.getTestStats(runner)
        }

        testStats.state = 'fail'
        testStats.error = runner.err
        this.counts.failures++

        /**
         * check if error also happened in other runners
         */
        let duplicateError = false
        for (let failure of this.failures) {
            if (runner.err.message !== failure.err.message || ReporterStats.getIdentifier(failure) !== ReporterStats.getIdentifier(runner)) {
                continue
            }
            duplicateError = true
            failure.runner[runner.cid] = runner.runner[runner.cid]
        }

        if (!duplicateError) {
            this.failures.push(runner)
        }
    }

    testEnd (runner) {
        this.getTestStats(runner).complete(runner._timestamp)
        this.counts.tests++
        if (runner.context) { this.getTestStats(runner).context = runner.context }
    }

    suiteEnd (runner) {
        this.getSuiteStats(runner, ReporterStats.getIdentifier(runner)).complete(runner._timestamp)
    }

    runnerEnd (runner) {
        this.getSpecStats(runner).complete(runner._timestamp)
    }

    static getIdentifier (runner) {
        return runner.uid || runner.title
    }
}

export {
    RunnableStats,
    RunnerStats,
    SpecStats,
    SuiteStats,
    TestStats,
    ReporterStats
}

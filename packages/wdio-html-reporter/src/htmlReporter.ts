import type {
    AfterCommandArgs,
    CommandArgs,
    HookStats,
    RunnerStats,
    SuiteStats,
    TestStats
} from '@wdio/reporter'
import WDIOReporter, { getSessionNames, hookCountsAsFailure, knownFramework } from '@wdio/reporter'

import  { HtmlReporterOptions, InternalReportEvent, Metrics, ReportData } from './types.js'
import dayjs from 'dayjs'
import ReportEvents from './reportEvents.js'
import ReportGenerator from './reportGenerator.js'
import { writeFile } from './files.js'
import { headerBrowserName } from './browserName.js'

import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import logger from '@wdio/logger'

type ReportEvent = InternalReportEvent | { type: string, value: unknown }
/** sequential mode: a suite whose first test did not start yet, and the events of its before hooks */
type WaitingSuite = { uid?: string, events: ReportEvent[] }

const reportProxy = new ReportEvents()
const TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

/**
 * the capabilities that the report files keep: they name the browser or the
 * device, and they have no credentials. Appium returns its capabilities without
 * the `appium:` prefix.
 */
const REPORT_CAPABILITIES = [
    'browserName', 'browserVersion', 'platformName',
    'appium:deviceName', 'appium:platformVersion', 'appium:automationName',
    'deviceName', 'platformVersion', 'automationName'
]

function reportCapabilities (capabilities: unknown) {
    const caps = (capabilities ?? {}) as Record<string, unknown>
    return Object.fromEntries(REPORT_CAPABILITIES.filter((name) => caps[name] !== undefined).map((name) => [name, caps[name]]))
}

/**
 * The attempt of a spec file with `specFileRetries`: 0 for the first one. The runner gives
 * the first attempt `specFileRetries + 1` (the launcher does not know the retries yet),
 * and 1 when there are no retries
 */
function specFileAttempt (runner: RunnerStats) {
    const specFileRetries = (runner.config as { specFileRetries?: number } | undefined)?.specFileRetries ?? 0
    const retry = runner.retry ?? 0
    return specFileRetries && retry <= specFileRetries ? retry : 0
}

/**
 * The runner data for the report files, which are often shared (for example as CI
 * artifacts): only the fields that the report uses, and no configuration, session
 * options or capabilities with credentials (`user`, `key`, `accessKey`, a URL with a
 * password, ...).
 */
function reportInfo (runner: RunnerStats): RunnerStats {
    const capabilities = runner.isMultiRemote
        ? Object.fromEntries(Object.entries(runner.capabilities ?? {}).map(([name, instance]) => [
            name,
            reportCapabilities((instance as { capabilities?: unknown }).capabilities ?? instance)
        ]))
        : reportCapabilities(runner.capabilities)
    return {
        type: runner.type,
        cid: runner.cid,
        specs: runner.specs,
        start: runner.start,
        end: runner.end,
        _duration: runner._duration,
        isMultiRemote: runner.isMultiRemote,
        retry: specFileAttempt(runner),
        capabilities,
        // the names of the full capabilities: the reduced copy above cannot name an app
        browserNames: getSessionNames(runner.capabilities, runner.isMultiRemote),
        // the runner gives the error of a session that did not start; its text can have credentials
        ...(runner.error ? { sessionFailed: true } : {})
    } as unknown as RunnerStats
}

export default class HtmlReporter extends WDIOReporter {
    options: HtmlReporterOptions
    metrics: Metrics
    _suiteUids = new Map()
    _testUids = new Map()
    _currentTestUid: string
    _currentCid: string
    private LOG = logger('HtmlReporter')

    /**
     * Cucumber (without `scenarioLevelReporter`) reports each step as a test:
     * count the scenarios instead. A retried scenario ends one time (its last
     * try): the base reporter clears the tests of the earlier try
     */
    #countScenarios = false
    /**
     * failed hooks that no failed test shows yet: Mocha (`failHookAffectedTests`,
     * the v10 default) and Jasmine fail the tests that a failed before hook affects.
     * One count per parallel-mode context: a test fails only the hooks of its context
     */
    #openHookFailures = new Map<string, number>()
    /**
     * parallel mode: the test of each context. It stays after the test ends: a video,
     * an afterEach log or a timer of the test can come later
     */
    #contextTests = new Map<string, string>()
    /** parallel mode: the events of a context before its test starts (a before hook) */
    #earlyEvents = new Map<string, ReportEvent[]>()
    /**
     * sequential mode: the open suites whose first test did not start yet, the outer one first
     * (the first one is for the events before any suite). An event with no test context (a
     * `before all` or Cucumber `Before` hook) waits in the innermost one for the next test
     */
    #waitingSuites: WaitingSuite[] = [{ events: [] }]
    /** parallel mode: a test of a context started (a skipped test never starts); until then, events with no context wait */
    #contextTestStarted = false
    /** the screenshot files of `useOnAfterCommandForScreenshot` */
    #screenshotFiles = new Set<string>()
    /** the end of the last failed attempt of a retried scenario (the suite keeps the start of its first attempt) */
    #attemptEnds = new WeakMap<SuiteStats, Date>()
    #noContextWarned = false
    private reportGenerator?: ReportGenerator
    /** the listeners of the events from `ReportEvents`, removed when the runner ends */
    #onMessage = this.saveMessage.bind(this)
    #onScreenshot = this.saveScreenshot.bind(this)
    #onVideo = this.saveVideo.bind(this)
    #onMessageEvent = ({ value }: { value: unknown }) => this.saveMessage(value)
    #onScreenshotEvent = ({ value }: { value: string }) => this.saveScreenshot(value)
    #onVideoEvent = ({ value }: { value: string }) => this.saveVideo(value)
    #configuredBrowserName: string | undefined

    constructor(options: Partial<HtmlReporterOptions> = {}) {
        super(Object.assign(
            {
                stdout: true,
                logFile: './logs/reporter.log',
            }, options))
        const opts = new HtmlReporterOptions()
        opts.stdout = true
        this.options = Object.assign(opts, options)
        this.#configuredBrowserName = options.browserName
        const dir = path.join(this.options.outputDir, 'screenshots')

        fs.mkdirSync(dir, { recursive: true })
        this.metrics = new Metrics()
        this._currentTestUid = 'test uid'
        this._currentCid = 'cid'
        reportProxy.connectMessageEvent(this.#onMessage)
        reportProxy.connectScreenshotEvent(this.#onScreenshot)
        reportProxy.connectVideoCaptureEvent(this.#onVideo)
        // a Vitest worker cannot reach the process of the launcher: the framework replays these calls on the reporter, wrapped in `value`
        this.on('test:log', this.#onMessageEvent)
        this.on('test:screenshot', this.#onScreenshotEvent)
        this.on('test:video-capture', this.#onVideoEvent)
        this.reportGenerator = new ReportGenerator(this.options)
        // the hook and test events have the context of a parallel-mode test (Mocha), else the calling code has it
        const contextOf = (contextId?: string) => contextId ?? this.getContextId() ?? ''
        // after the base reporter: its hook stats have the error. The test:retry of the attempt shows a retried hook (Vitest)
        this.on('hook:end', (hook: { uid: string, contextId?: string }) => {
            const stats = this.hooks[hook.uid]
            // a failed Cucumber BeforeAll / AfterAll fails no scenario
            if (stats && hookCountsAsFailure(stats) && (!this.#countScenarios || this.isFeatureHook(stats))) {
                const key = contextOf(hook.contextId)
                this.#openHookFailures.set(key, (this.#openHookFailures.get(key) ?? 0) + 1)
            }
        })
        this.on('test:fail', ({ contextId }: { contextId?: string }) => !this.#countScenarios && this.#openHookFailures.delete(contextOf(contextId)))
        // a Cucumber retry runs in the same context: its Before hook events are for the first step of the retry
        this.on('suite:retry', ({ uid, contextId }: { uid: string, contextId?: string }) => {
            if (contextId) {
                this.#contextTests.delete(contextId)
            } else {
                this.#waitingSuites = [{ uid, events: [] }]
            }
        })
    }

    get isSynchronised() : boolean {

        //@ts-ignore
        const inSync = this.reportGenerator.isSynchronised()
        this.LOG.debug('isSynchronized: ' + inSync)
        return inSync
    }
    onRunnerStart(runner: RunnerStats) {
        this.LOG.info(`onRunnerStart: ${runner.cid}`)
        //todo look at fix, not async safe. but one cid per report file
        this._currentCid = runner.cid
        this.metrics.passed = 0
        this.metrics.skipped = 0
        this.metrics.failed = 0
        this.metrics.start = dayjs().utc().format(TIME_FORMAT)
        const config = runner.config as { framework?: string, cucumberOpts?: { scenarioLevelReporter?: boolean } } | undefined
        this.#countScenarios = knownFramework(config?.framework) === 'cucumber' && !config?.cucumberOpts?.scenarioLevelReporter
        void this.reportGenerator?.startReport(this.#reportData(runner, []))
    }

    onSuiteStart(suite: SuiteStats) {
        this._suiteUids.set(suite.uid, suite)
        if (!this.#contextTestStarted) {
            this.#waitingSuites.push({ uid: suite.uid, events: [] })
        }
        suite.start = new Date()
        this.LOG.info(`onSuiteStart: ${suite.cid}:${suite.uid}`)
    }

    onTestStart(theTest: TestStats) {
        this.LOG.info(`onTestStart: ${theTest.cid}:${theTest.uid}`)
        this._currentTestUid = theTest.uid
        this.#registerTest(theTest)
        this.#takeEarlyEvents(theTest, true)
    }

    #registerTest(test: TestStats) {
        //@ts-ignore
        test.events = []
        //@ts-ignore
        test.errorIndex = 0
        this._testUids.set(test.uid, test)
    }

    /**
     * The test takes the events that came before it (a before hook): in parallel mode
     * the events of its context, in sequential mode those of all the waiting suites
     */
    #takeEarlyEvents(test: TestStats, started = false) {
        //@ts-ignore
        const events: ReportEvent[] = test.events
        if (test.contextId) {
            // the first parallel test that starts also takes the events from before any context (the config `before` hook)
            if (started && !this.#contextTestStarted) {
                this.#contextTestStarted = true
                this.#takeWaitingEvents(events)
            }
            this.#contextTests.set(test.contextId, test.uid)
            events.push(...this.#earlyEvents.get(test.contextId) ?? [])
            this.#earlyEvents.delete(test.contextId)
        } else {
            this.#takeWaitingEvents(events)
        }
    }

    #takeWaitingEvents(events: ReportEvent[]) {
        events.push(...this.#waitingSuites.flatMap((suite) => suite.events))
        this.#waitingSuites = []
    }

    onTestPass(theTest: TestStats) {
        this.LOG.info(`onTestPass: ${theTest.cid}:${theTest.uid}`)
        const test = this.getTest(theTest.uid)
        if (test) {
            this.moveErrorsToEvents(test)
        }
        if (!this.#countScenarios) {
            this.metrics.passed++
        }
    }

    /**
     * A test that started and then is skipped or pending (Jasmine `pending()`, a
     * pending Cucumber step) gets a new test object from the base reporter: the
     * report shows the new object, so it takes the events of the started one
     */
    #keepEventsOfStartedTest(test: TestStats) {
        const started = this._testUids.get(test.uid)
        if (!started || started === test) {
            return
        }
        //@ts-ignore
        test.events = started.events
        //@ts-ignore
        test.errorIndex = started.errorIndex
        this._testUids.set(test.uid, test)
    }

    onTestSkip(test: TestStats) {
        this.LOG.info(`onTestSkip: ${test.cid}:${test.uid}`)
        this.#keepEventsOfStartedTest(test)
        // a test that a before hook skips (`this.skip()`) never starts: in parallel mode it takes the events of its context
        if (!this._testUids.has(test.uid)) {
            this.#registerTest(test)
            if (test.contextId) {
                this.#takeEarlyEvents(test)
            }
        }
        if (!this.#countScenarios) {
            this.metrics.skipped++
        }
    }

    /**
     * a test with the state `pending`, for example a pending scenario with
     * `cucumberOpts.scenarioLevelReporter`: the report shows it as skipped
     */
    onTestPending(test: TestStats) {
        this.LOG.info(`onTestPending: ${test.cid}:${test.uid}`)
        this.#keepEventsOfStartedTest(test)
        if (!this.#countScenarios) {
            this.metrics.skipped++
        }
    }

    onTestFail(theTest: TestStats) {
        this.LOG.info(`onTestFail: ${theTest.cid}:${theTest.uid}`)
        const test = this.getTest(theTest.uid)
        if (test) {
            this.moveErrorsToEvents(test)
        }
        if (!this.#countScenarios) {
            this.metrics.failed++
        }
    }

    onTestEnd(theTest: TestStats) {
        this.LOG.info(`onTestEnd: ${theTest.cid}:${theTest.uid}`)
        const test = this.getTest(theTest.uid)
        if (test) {
            this.moveErrorsToEvents(test)
        }
    }

    /**
     * Adds an event to its test: in parallel mode, the test of its context (from the event,
     * else from the calling code), else the last started test. A context with no test yet
     * keeps the event for its first test.
     */
    #addEvent(event: ReportEvent, { contextId, moveErrors = true }: { contextId?: string, moveErrors?: boolean } = {}) {
        const id = contextId ?? this.getContextId()
        if (!id && this.#contextTestStarted && !this.#noContextWarned) {
            this.#noContextWarned = true
            const message = 'An event with no parallel-mode test context (from code that runs outside a test, such as ' +
                'an `AfterAll` hook or a `browser.on()` callback) goes to the test that started last.'
            this.LOG.warn(message)
            console.warn(`[@wdio/html-reporter] ${message}`)
        }
        const waiting = !id && !this.#contextTestStarted ? this.#waitingSuites.at(-1) : undefined
        if (waiting) {
            waiting.events.push(event)
            return
        }
        const uid = id ? this.#contextTests.get(id) : this._currentTestUid
        const test = uid ? this.getTest(uid) : undefined
        if (test) {
            if (moveErrors) {
                this.moveErrorsToEvents(test)
            }
            //@ts-ignore
            test.events.push(event)
        } else if (id) {
            const early = this.#earlyEvents.get(id)
            if (early) {
                early.push(event)
            } else {
                this.#earlyEvents.set(id, [event])
            }
        }
    }

    /**
     * sequential mode: no test of the suite started (`this.skip()` or `it.skip`, a failed
     * before hook with `failHookAffectedTests: false`): its events go to the first test of
     * the suite or of its child suites, else to the test before, else to nothing (not to a
     * test of the next suite). The events of its parent suite still wait for the parent's next test
     */
    #endWaiting(suite: SuiteStats) {
        if (this.#contextTestStarted) {
            return
        }
        const waiting = this.#waitingSuites.at(-1)
        if (!waiting || waiting.uid !== suite.uid) {
            return
        }
        this.#waitingSuites.pop()
        const firstTest = this.#firstTest(suite)
        if (firstTest) {
            // the events of a child suite are already there: the outer events come first
            //@ts-ignore
            firstTest.events.unshift(...waiting.events)
        } else {
            //@ts-ignore
            this.getTest(this._currentTestUid)?.events.push(...waiting.events)
        }
    }

    #firstTest(suite: SuiteStats): TestStats | undefined {
        const test = suite.tests?.find((test) => this._testUids.get(test.uid) === test)
        return test ?? suite.suites?.reduce<TestStats | undefined>((found, child) => found ?? this.#firstTest(child), undefined)
    }

    onHookStart(hook: HookStats) {
        this.LOG.info(`onHookStart: ${hook.cid}:${hook.uid}`)
    }

    onHookEnd(hook: HookStats) {
        this.LOG.info(`onHookEnd: ${hook.cid}:${hook.uid}`)
    }

    /**
     * a failed hook that failed no test (for example an after hook) counts as a failure
     */
    #countOpenHookFailures() {
        this.metrics.failed += [...this.#openHookFailures.values()].reduce((sum, count) => sum + count, 0)
        this.#openHookFailures.clear()
    }

    /**
     * Cucumber `retry` (step level): the failed attempt stays in the report as its own entry, with its own
     * times, before the base clears the suite for the next attempt. Only the last attempt counts
     */
    onSuiteRetry(suite: SuiteStats) {
        const attempt: SuiteStats = Object.assign(Object.create(Object.getPrototypeOf(suite)), suite, {
            tests: [...suite.tests],
            hooks: [...suite.hooks],
            hooksAndTests: [...suite.hooksAndTests],
            suites: [...suite.suites],
            // its retried step is its failure (retried attempts are skipped only in the last attempt)
            retriedAttempt: true
        })
        attempt.start = this.#attemptEnds.get(suite) ?? suite.start
        attempt.complete()
        this.#attemptEnds.set(suite, attempt.end!)
        // a Cucumber scenario is always in its feature
        const siblings = this.parentOf(suite)?.suites
        const index = siblings?.indexOf(suite) ?? -1
        if (siblings && index >= 0) {
            siblings.splice(index, 0, attempt)
        }
    }

    onSuiteEnd(suite: SuiteStats) {
        this.LOG.info(`onSuiteEnd: ${suite.cid}:${suite.uid}`)
        suite.end = new Date()
        this.#endWaiting(suite)
        this.#countOpenHookFailures()
        if (this.#countScenarios && suite.type === 'scenario') {
            const failed = suite.tests.some((test) => test.state === 'failed') || suite.hooks.some((hook) => hook.error)
            /**
             * passed only when all its steps passed, as Cucumber counts it
             */
            const passed = suite.tests.length > 0 && suite.tests.every((test) => test.state === 'passed')
            const state = failed ? 'failed' : passed ? 'passed' : 'skipped'
            this.metrics[state]++
        }
    }

    isScreenshotCommand(command: CommandArgs) {
        const isScreenshotEndpoint = /\/session\/[^/]*(\/element\/[^/]*)?\/screenshot/
        return (
            // WebDriver protocol
            (command.endpoint && isScreenshotEndpoint.test(command.endpoint)) ||
            // DevTools protocol, and the WebDriver BiDi overrides, which send no endpoint
            command.command === 'takeScreenshot' ||
            command.command === 'takeElementScreenshot'
        )

    }

    //this is a hack to get around lack of onScreenshot event
    onAfterCommand(command: AfterCommandArgs) {
        if (this.options.useOnAfterCommandForScreenshot) {
            const result = command.result as { value?: string } | undefined
            if (this.isScreenshotCommand(command) && result?.value) {
                const timestamp = dayjs().format('YYYYMMDD-HHmmss.SSS')
                const folder = path.join(this.options.outputDir, '/screenshots/', encodeURIComponent(this._currentCid))
                let filepath = path.join(folder, timestamp, this.options.filename + '.png')
                // screenshots of the same millisecond (parallel tests, Promise.all) get their own folder
                for (let i = 2; this.#screenshotFiles.has(filepath); i++) {
                    filepath = path.join(folder, `${timestamp}-${i}`, this.options.filename + '.png')
                }
                this.#screenshotFiles.add(filepath)
                this.LOG.info(`onAfterCommand: ${this._currentCid}:${this._currentTestUid} taking screenshot ${filepath}`)
                writeFile(filepath, Buffer.from(result.value, 'base64'))

                this.#addEvent({ type: 'screenshot', value: filepath }, { contextId: command.contextId, moveErrors: false })
            }
        }
    }

    async onRunnerEnd(runner: RunnerStats) {
        this.LOG.info(`onRunnerEnd: ${runner.cid}`)
        this.#countOpenHookFailures()
        this.metrics.end = dayjs().utc().format(TIME_FORMAT)
        this.metrics.duration = runner._duration
        const suites = [...this.rootSuiteWithTests(runner), ...this.filterChildSuites()]
        await this.reportGenerator?.createReport(this.#reportData(runner, suites))
        reportProxy.disconnectMessageEvent(this.#onMessage)
        reportProxy.disconnectScreenshotEvent(this.#onScreenshot)
        reportProxy.disconnectVideoCaptureEvent(this.#onVideo)
        this.off('test:log', this.#onMessageEvent)
        this.off('test:screenshot', this.#onScreenshotEvent)
        this.off('test:video-capture', this.#onVideoEvent)

    }

    #reportData(runner: RunnerStats, suites: SuiteStats[]) {
        // the report generator adds the cid to the file name
        const reportFile = path.resolve(process.cwd(), this.options.outputDir, this.options.filename)
        return new ReportData(
            this.options.reportTitle,
            reportInfo(runner),
            suites,
            this.metrics,
            reportFile,
            headerBrowserName(this.#configuredBrowserName, [runner], this.options.browserName))
    }

    /**
     * The root suite of the base reporter has the tests and hooks that are in no
     * suite (Mocha `it()` with no `describe()`): no suite start event adds it. Its
     * child suites are already in the report.
     */
    rootSuiteWithTests(runner: RunnerStats): SuiteStats[] {
        const root = this.currentSuites[0]
        // a root hook keeps its commands in its own output, which only `removeOutput: false` writes
        const keep = (hook: HookStats) => hook.error || (!this.options.removeOutput && hook.output?.length)
        if (!root || (!root.tests.length && !root.hooks.some(keep))) {
            return []
        }
        return [Object.assign(Object.create(Object.getPrototypeOf(root)), root, {
            suites: [],
            file: root.file || runner.specs[0],
            end: new Date()
        })]
    }

    removeSuite(uid: string | undefined) {
        if (uid && this._suiteUids.has(uid)) {
            this._suiteUids.delete(uid)
        }
    }

    getTest(uid: string): TestStats | undefined {
        if (uid && this._testUids.has(uid)) {
            return this._testUids.get(uid)
        }
    }

    //this is a hack.  we have to move all the things in test.errors before they get blown away
    moveErrorsToEvents(test: TestStats) {
        if (test.errors) {
            //@ts-ignore
            for (let i = test.errorIndex; i < test.errors.length; i++) {
                const error = test.errors[i]
                /**
                 * an Error object (for example Jasmine `failSpecWithNoExpectations`) has no own
                 * enumerable message and stack: the JSON file of the worker would lose them
                 */
                let errorObj = { ...error, message: error.message, stack: error.stack }
                if (error.stack && error.stack.includes('AssertionError')) {
                    errorObj = {
                        //@ts-ignore
                        message: error.message.split('      \n').shift(),
                        stack: error.stack,
                    }
                }
                //@ts-ignore
                test.events.push(new InternalReportEvent('Error', errorObj))
            }
            //@ts-ignore
            test.errorIndex = test.errors.length
        }
    }

    saveScreenshot(filepath: string) {
        this.LOG.info(`saveScreenshot: ${filepath}`)
        this.#addEvent(new InternalReportEvent('screenshot', filepath))
    }

    saveVideo(filepath: string) {
        this.LOG.info(`saveVideo: ${filepath}`)
        this.#addEvent(new InternalReportEvent('video-capture', filepath))
    }
    saveMessage(message: unknown) {
        /**
         * the report shows text: show other values (for example an object) as
         * readable text, else the template fails and the suite is missing
         */
        const text = typeof message === 'string' ? message : util.inspect(message, { depth: null })
        this.LOG.info(`saveMessage: ${text}`)
        this.#addEvent({ type: 'log', value: text })
    }

    filterChildSuites() : SuiteStats[] {
        const suites = Array.from(this._suiteUids.values())
        for (let i = suites.length - 1; i >= 0; i--) {
            const parentSuite = suites[i]
            if (parentSuite.suites) {
                for (let k = parentSuite.suites.length - 1; k >= 0; k--) {
                    const suite = parentSuite.suites[k]
                    this.removeSuite(suite.uid)
                }
            }
        }
        return Array.from(this._suiteUids.values())
    }

}


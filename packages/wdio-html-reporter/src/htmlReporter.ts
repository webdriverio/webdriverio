import type {
    AfterCommandArgs,
    CommandArgs,
    HookStats,
    RunnerStats,
    SuiteStats,
    TestStats
} from '@wdio/reporter'
import WDIOReporter, { knownFramework } from '@wdio/reporter'

import  { HtmlReporterOptions, InternalReportEvent, Metrics, ReportData } from './types.js'

type ReportEvent = InternalReportEvent | { type: string, value: unknown }
import dayjs from 'dayjs'
import ReportEvents from './reportEvents.js'
import ReportGenerator from './reportGenerator.js'
import { writeFile } from './files.js'

import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import logger from '@wdio/logger'

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
        retry: runner.retry,
        capabilities,
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
    /** the screenshot files of `useOnAfterCommandForScreenshot` */
    #screenshotFiles = new Set<string>()
    private reportGenerator?: ReportGenerator
    /** the listeners of the events from `ReportEvents`, removed when the runner ends */
    #onMessage = this.saveMessage.bind(this)
    #onScreenshot = this.saveScreenshot.bind(this)
    #onVideo = this.saveVideo.bind(this)

    constructor(options: Partial<HtmlReporterOptions> = {}) {
        super(Object.assign(
            {
                stdout: true,
                logFile: './logs/reporter.log',
            }, options))
        const opts = new HtmlReporterOptions()
        opts.stdout = true
        this.options = Object.assign(opts, options)
        const dir = path.join(this.options.outputDir, 'screenshots')

        fs.mkdirSync(dir, { recursive: true })
        this.metrics = new Metrics()
        this._currentTestUid = 'test uid'
        this._currentCid = 'cid'
        reportProxy.connectMessageEvent(this.#onMessage)
        reportProxy.connectScreenshotEvent(this.#onScreenshot)
        reportProxy.connectVideoCaptureEvent(this.#onVideo)
        this.reportGenerator = new ReportGenerator(this.options)
        // the hook and test events have the context of a parallel-mode test (Mocha), else the calling code has it
        const contextOf = (contextId?: string) => contextId ?? this.getContextId() ?? ''
        // after the base reporter: its hook stats have the error
        this.on('hook:end', (hook: { uid: string, contextId?: string }) => {
            if (this.hooks[hook.uid]?.error && !this.#countScenarios) {
                const key = contextOf(hook.contextId)
                this.#openHookFailures.set(key, (this.#openHookFailures.get(key) ?? 0) + 1)
            }
        })
        this.on('test:fail', ({ contextId }: { contextId?: string }) => !this.#countScenarios && this.#openHookFailures.delete(contextOf(contextId)))
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
        suite.start = new Date()
        this.LOG.info(`onSuiteStart: ${suite.cid}:${suite.uid}`)
    }

    onTestStart(theTest: TestStats) {
        this.LOG.info(`onTestStart: ${theTest.cid}:${theTest.uid}`)
        this._currentTestUid = theTest.uid
        //@ts-ignore
        theTest.events = []
        //@ts-ignore
        theTest.errorIndex = 0
        this._testUids.set(theTest.uid, theTest)
        this.#takeEarlyEvents(theTest)
    }

    /**
     * parallel mode: the test is the test of its context, and it takes the events
     * that its context sent before (a before hook)
     */
    #takeEarlyEvents(test: TestStats) {
        if (!test.contextId) {
            return
        }
        this.#contextTests.set(test.contextId, test.uid)
        //@ts-ignore
        test.events.push(...this.#earlyEvents.get(test.contextId) ?? [])
        this.#earlyEvents.delete(test.contextId)
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
        // parallel mode: a test that a before hook skips (`this.skip()`) never starts, it takes the events of its context
        if (test.contextId && !this._testUids.has(test.uid)) {
            //@ts-ignore
            test.events = []
            //@ts-ignore
            test.errorIndex = 0
            this._testUids.set(test.uid, test)
            this.#takeEarlyEvents(test)
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

    onSuiteEnd(suite: SuiteStats) {
        this.LOG.info(`onSuiteEnd: ${suite.cid}:${suite.uid}`)
        suite.end = new Date()
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
            this.options.browserName)
    }

    /**
     * The root suite of the base reporter has the tests and hooks that are in no
     * suite (Mocha `it()` with no `describe()`): no suite start event adds it. Its
     * child suites are already in the report.
     */
    rootSuiteWithTests(runner: RunnerStats): SuiteStats[] {
        const root = this.currentSuites[0]
        if (!root || (!root.tests.length && !root.hooks.some((hook) => hook.error))) {
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


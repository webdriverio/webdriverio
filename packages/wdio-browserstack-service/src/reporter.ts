import path from 'node:path'

import type { SuiteStats, TestStats, RunnerStats, HookStats } from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import type { Options } from '@wdio/types'
import * as url from 'node:url'

import { v4 as uuidv4 } from 'uuid'
import type { CurrentRunInfo, StdLog } from './types.js'

import type { BrowserstackConfig, TestData, TestMeta } from './types.js'
import {
    getCloudProvider,
    o11yClassErrorHandler,
    getGitMetaData,
    removeAnsiColors,
    getHookType,
    getPlatformVersion
} from './util.js'
import { BStackLogger } from './bstackLogger.js'
import type { Capabilities } from '@wdio/types'
import Listener from './testOps/listener.js'

class _TestReporter extends WDIOReporter {
    private _capabilities: WebdriverIO.Capabilities = {}
    private _config?: BrowserstackConfig & Options.Testrunner
    private _observability = true
    private _sessionId?: string
    private _suiteName?: string
    private _suites: SuiteStats[] = []
    private static _tests: Record<string, TestMeta> = {}
    private _gitConfigPath?: string
    private _gitConfigured: boolean = false
    private _currentHook: CurrentRunInfo = {}
    public static currentTest: CurrentRunInfo = {}
    private _userCaps?: Capabilities.RemoteCapability = {}
    private listener = Listener.getInstance()

    async onRunnerStart (runnerStats: RunnerStats) {
        this._capabilities = runnerStats.capabilities as WebdriverIO.Capabilities
        this._userCaps = this.getUserCaps(runnerStats)
        this._config = runnerStats.config as BrowserstackConfig & Options.Testrunner
        this._sessionId = runnerStats.sessionId
        if (typeof this._config.testObservability !== 'undefined') {
            this._observability = this._config.testObservability
        }
        await this.configureGit()
        this.registerListeners()
    }

    private getUserCaps(runnerStats: RunnerStats) {
        return runnerStats.instanceOptions[runnerStats.sessionId]?.capabilities
    }

    registerListeners () {
        if (this._config?.framework !== 'jasmine') {
            return
        }
        process.removeAllListeners(`bs:addLog:${process.pid}`)
        process.on(`bs:addLog:${process.pid}`, this.appendTestItemLog.bind(this))
    }

    public async appendTestItemLog(stdLog: StdLog) {
        if (this._currentHook.uuid && !this._currentHook.finished) {
            stdLog.hook_run_uuid = this._currentHook.uuid
        } else if (_TestReporter.currentTest.uuid) {
            stdLog.test_run_uuid = _TestReporter.currentTest.uuid
        }
        if (stdLog.hook_run_uuid || stdLog.test_run_uuid) {
            this.listener.logCreated([stdLog])
        }
    }

    setCurrentHook(hookDetails: CurrentRunInfo) {
        if (hookDetails.finished) {
            if (this._currentHook.uuid === hookDetails.uuid) {
                this._currentHook.finished = true
            }
            return
        }
        this._currentHook = {
            uuid: hookDetails.uuid,
            finished: false
        }
    }

    async configureGit() {
        if (this._gitConfigured) {
            return
        }
        const gitMeta = await getGitMetaData()
        if (gitMeta) {
            this._gitConfigPath = gitMeta.root
        }
        this._gitConfigured = true
    }

    static getTests() {
        return _TestReporter._tests
    }

    onSuiteStart (suiteStats: SuiteStats) {
        let filename = suiteStats.file
        if (this._config?.framework === 'jasmine') {
            try {
                if (suiteStats.file.startsWith('file://')) {
                    filename = url.fileURLToPath(suiteStats.file)
                }

                if (filename === 'unknown spec file') {
                    // Sometimes in cases where a file has two suites. Then the file name be unknown for second suite, so getting the filename from first suite
                    filename = this._suiteName || suiteStats.file
                }
            } catch (e) {
                BStackLogger.debug('Error in decoding file name of suite')
            }
        }
        this._suiteName = filename
        this._suites.push(suiteStats)
    }

    onSuiteEnd() {
        this._suites.pop()
    }

    needToSendData(testType?: string, event?: string) {
        if (!this._observability) {return false}

        switch (this._config?.framework) {
        case 'mocha':
            return event === 'skip'
        case 'cucumber':
            return false
        case 'jasmine':
            return event !== 'skip'
        default:
            return false
        }
    }

    async onTestEnd(testStats: TestStats) {
        if (!this.needToSendData('test', 'end')) {
            return
        }
        if (testStats.fullTitle === '<unknown test>') {
            return
        }

        testStats.end ||= new Date()
        this.listener.testFinished(await this.getRunData(testStats, 'TestRunFinished'))
    }

    async onTestStart(testStats: TestStats) {
        if (!this.needToSendData('test', 'start')) {
            return
        }
        if (testStats.fullTitle === '<unknown test>') {
            return
        }
        const uuid = uuidv4()
        _TestReporter.currentTest.uuid = uuid

        _TestReporter._tests[testStats.fullTitle] = {
            uuid: uuid,
        }
        this.listener.testStarted(await this.getRunData(testStats, 'TestRunStarted'))
    }

    async onHookStart(hookStats: HookStats) {
        if (!this.needToSendData('hook', 'start')) {
            return
        }

        const identifier = this.getHookIdentifier(hookStats)
        const hookId = uuidv4()
        this.setCurrentHook({ uuid: hookId })
        _TestReporter._tests[identifier] = {
            uuid: hookId,
            startedAt: (new Date()).toISOString()
        }
        this.listener.hookStarted(await this.getRunData(hookStats, 'HookRunStarted'))
    }

    async onHookEnd(hookStats: HookStats) {
        if (!this.needToSendData('hook', 'end')) {
            return
        }
        const identifier = this.getHookIdentifier(hookStats)
        if (_TestReporter._tests[identifier]) {
            _TestReporter._tests[identifier].finishedAt = (new Date()).toISOString()
        } else {
            _TestReporter._tests[identifier] = {
                finishedAt: (new Date()).toISOString()
            }
        }
        this.setCurrentHook({ uuid: _TestReporter._tests[identifier].uuid, finished: true })

        if (!hookStats.state && !hookStats.error) {
            hookStats.state = 'passed'
        }
        this.listener.hookFinished(await this.getRunData(hookStats, 'HookRunFinished'))
    }

    getHookIdentifier(hookStats: HookStats) {
        return `${hookStats.title} for ${this._suites.at(-1)?.title}`
    }

    async onTestSkip (testStats: TestStats) {
        // cucumber steps call this method. We don't want step skipped state so skip for cucumber
        if (!this.needToSendData('test', 'skip')) {
            return
        }

        testStats.start ||= new Date()
        testStats.end ||= new Date()
        this.listener.testFinished(await this.getRunData(testStats, 'TestRunSkipped'))
    }

    async getRunData(testStats: TestStats | HookStats, eventType: string): Promise<TestData> {
        const framework = this._config?.framework
        const scopes = this._suites.map(s => s.title)
        const identifier = testStats.type === 'test' ? (testStats as TestStats).fullTitle : this.getHookIdentifier(testStats as HookStats)
        const testMetaData: TestMeta = _TestReporter._tests[identifier]
        const scope = testStats.type === 'test' ? (testStats as TestStats).fullTitle : `${this._suites[0].title} - ${testStats.title}`

        // If no describe block present, onSuiteStart doesn't get called. Use specs list for filename
        const suiteFileName = this._suiteName || (this.specs?.length > 0 ? this.specs[this.specs.length - 1]?.replace('file:', '') : undefined)

        if (eventType === 'TestRunStarted') {
            _TestReporter.currentTest.name = testStats.title
        }

        await this.configureGit()
        const testData: TestData = {
            uuid: testMetaData ? testMetaData.uuid : uuidv4(),
            type: testStats.type,
            name: testStats.title,
            body: {
                lang: 'webdriverio',
                code: null
            },
            scope: scope,
            scopes: scopes,
            identifier: identifier,
            file_name: suiteFileName ? path.relative(process.cwd(), suiteFileName) : undefined,
            location: suiteFileName ? path.relative(process.cwd(), suiteFileName) : undefined,
            vc_filepath: (this._gitConfigPath && suiteFileName) ? path.relative(this._gitConfigPath, suiteFileName) : undefined,
            started_at: testStats.start && testStats.start.toISOString(),
            finished_at: testStats.end && testStats.end.toISOString(),
            framework: framework,
            duration_in_ms: testStats._duration,
            result: testStats.state,
        }

        if (testStats.type === 'test') {
            testData.retries = { limit: (testStats as TestStats).retries || 0, attempts: (testStats as TestStats).retries || 0 }
        }

        if (eventType.startsWith('TestRun') || eventType === 'HookRunStarted') {
            /* istanbul ignore next */
            const cloudProvider = getCloudProvider({ options: { hostname: this._config?.hostname } } as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser)
            testData.integrations = {}
            /* istanbul ignore next */
            testData.integrations[cloudProvider] = {
                capabilities: this._capabilities,
                session_id: this._sessionId,
                browser: this._capabilities?.browserName,
                browser_version: this._capabilities?.browserVersion,
                platform: this._capabilities?.platformName,
                platform_version: getPlatformVersion(this._userCaps as WebdriverIO.Capabilities)
            }
        }

        if (eventType === 'TestRunFinished' || eventType === 'HookRunFinished') {
            const { error } = testStats
            const failed = testStats.state === 'failed'
            if (failed) {
                testData.result = (error && error.message && error.message.includes('sync skip; aborting execution')) ? 'ignore' : 'failed'
                if (error && testData.result !== 'skipped') {
                    testData.failure = [{ backtrace: [removeAnsiColors(error.message)] }] // add all errors here
                    testData.failure_reason = removeAnsiColors(error.message)
                    testData.failure_type = error.message === null ? null : error.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError' //verify if this is working
                }
            }
        }

        if (eventType.match(/HookRun/)) {
            testData.hook_type = testData.name?.toLowerCase() ? getHookType(testData.name.toLowerCase()) : 'undefined'
        }

        return testData
    }
}
// https://github.com/microsoft/TypeScript/issues/6543
const TestReporter: typeof _TestReporter = o11yClassErrorHandler(_TestReporter)
type TestReporter = _TestReporter
export default TestReporter

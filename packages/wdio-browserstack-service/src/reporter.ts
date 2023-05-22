import path from 'node:path'
import url from 'node:url'
import WDIOReporter, { SuiteStats, TestStats, RunnerStats, HookStats } from '@wdio/reporter'
import type { Capabilities, Options } from '@wdio/types'

import { v4 as uuidv4 } from 'uuid'
import { Browser, MultiRemoteBrowser } from 'webdriverio'
import logger from '@wdio/logger'

import { BrowserstackConfig, TestData, TestMeta, UploadType } from './types'
import {
    getCloudProvider,
    getGitMetaData,
    uploadEventData,
    o11yClassErrorHandler,
    removeAnsiColors,
    getHookType
} from './util'
import RequestQueueHandler from './request-handler'

const log = logger('@wdio/browserstack-service')

class _TestReporter extends WDIOReporter {
    private _capabilities: Capabilities.Capabilities = {}
    private _config?: BrowserstackConfig & Options.Testrunner
    private _observability = true
    private _sessionId?: string
    private _suiteName?: string
    private _requestQueueHandler = RequestQueueHandler.getInstance()
    private _suites: SuiteStats[] = []
    private static _tests: Record<string, TestMeta> = {}
    private _gitConfigPath?: string
    private _gitConfigured: boolean = false

    async onRunnerStart (runnerStats: RunnerStats) {
        this._capabilities = runnerStats.capabilities as Capabilities.Capabilities
        this._config = runnerStats.config as BrowserstackConfig & Options.Testrunner
        this._sessionId = runnerStats.sessionId
        if (typeof this._config.testObservability !== 'undefined') this._observability = this._config.testObservability
        await this.configureGit()
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
        if (this._config?.framework == 'jasmine') {
            try {
                if (suiteStats.file.startsWith('file://')) {
                    filename = url.fileURLToPath(suiteStats.file)
                }

                if (filename === 'unknown spec file') {
                    // Sometimes in cases where a file has two suites. Then the file name be unknown for second suite, so getting the filename from first suite
                    filename = this._suiteName || suiteStats.file
                }
            } catch (e) {
                log.debug('Error in decoding file name of suite')
            }
        }
        this._suiteName = filename
        this._suites.push(suiteStats)
    }

    onSuiteEnd() {
        this._suites.pop()
    }

    needToSendData(testType?: string, event?: string) {
        if (!this._observability) return false

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
        if (!this.needToSendData('test', 'end')) return
        if (testStats.fullTitle === '<unknown test>') return

        testStats.end ||= new Date()
        await this.sendTestRunEvent(testStats, 'TestRunFinished')
    }

    async onTestStart(testStats: TestStats) {
        if (!this.needToSendData('test', 'start')) return
        if (testStats.fullTitle === '<unknown test>') return

        _TestReporter._tests[testStats.fullTitle] = {
            uuid: uuidv4(),
        }
        await this.sendTestRunEvent(testStats, 'TestRunStarted')
    }

    async onHookStart(hookStats: HookStats) {
        if (!this.needToSendData('hook', 'start')) {
            return
        }

        const identifier = this.getHookIdentifier(hookStats)
        const hookId = uuidv4()
        _TestReporter._tests[identifier] = {
            uuid: hookId,
            startedAt: (new Date()).toISOString()
        }
        await this.sendTestRunEvent(hookStats, 'HookRunStarted')
    }

    async onHookEnd(hookStats: HookStats) {
        const identifier = this.getHookIdentifier(hookStats)
        if (_TestReporter._tests[identifier]) {
            _TestReporter._tests[identifier].finishedAt = (new Date()).toISOString()
        } else {
            _TestReporter._tests[identifier] = {
                finishedAt: (new Date()).toISOString()
            }
        }
        await this.sendTestRunEvent(hookStats, 'HookRunFinished')
    }

    getHookIdentifier(hookStats: HookStats) {
        return `${hookStats.title} for ${this._suites.at(-1)?.title}`
    }

    async sendTestRunEvent(testStats: TestStats|HookStats, eventType: string) {
        const framework = this._config?.framework
        const scopes = this._suites.map(s => s.title)
        const identifier = testStats.type === 'test' ? (testStats as TestStats).fullTitle : this.getHookIdentifier(testStats as HookStats)
        const testMetaData: TestMeta = _TestReporter._tests[identifier]
        const scope = testStats.type === 'test' ? (testStats as TestStats).fullTitle : `${this._suites[0].title} - ${testStats.title}`

        await this.configureGit()
        let testData: TestData = {
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
            file_name: this._suiteName ? path.relative(process.cwd(), this._suiteName) : undefined,
            location: this._suiteName ? path.relative(process.cwd(), this._suiteName) : undefined,
            vc_filepath: (this._gitConfigPath && this._suiteName) ? path.relative(this._gitConfigPath, this._suiteName) : undefined,
            started_at: testStats.start && testStats.start.toISOString(),
            finished_at: testStats.end && testStats.end.toISOString(),
            framework: framework,
            duration_in_ms: testStats._duration,
            result: testStats.state,
        }

        if (testStats.type === 'test') {
            testData.retries = { limit: (testStats as TestStats).retries || 0, attempts: (testStats as TestStats).retries || 0 }
        }

        if (eventType.startsWith('TestRun')) {
            /* istanbul ignore next */
            const cloudProvider = getCloudProvider({ options: { hostname: this._config?.hostname } } as Browser<'async'> | MultiRemoteBrowser<'async'>)
            testData.integrations = {}

            /* istanbul ignore next */
            testData.integrations[cloudProvider] = {
                capabilities: this._capabilities,
                session_id: this._sessionId,
                browser: this._capabilities?.browserName,
                browser_version: this._capabilities?.browserVersion,
                platform: this._capabilities?.platformName,
            }
        }

        if (eventType == 'TestRunFinished' || eventType == 'HookRunFinished') {
            const { error } = testStats
            const failed = testStats.state == 'failed'
            if (failed) {
                testData.result = (error && error.message && error.message.includes('sync skip; aborting execution')) ? 'ignore' : 'failed'
                if (error && testData.result != 'skipped') {
                    testData.failure = [{ backtrace: [removeAnsiColors(error.message)] }] // add all errors here
                    testData.failure_reason = removeAnsiColors(error.message)
                    testData.failure_type = error.message == null ? null : error.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError' //verify if this is working
                }
            }
        }

        if (eventType == 'TestRunSkipped') {
            eventType = 'TestRunFinished'
        }

        const uploadData: UploadType = {
            event_type: eventType,
        }

        if (eventType.match(/HookRun/)) {
            testData.hook_type = testData.name?.toLowerCase() ? getHookType(testData.name.toLowerCase()) : 'undefined'
            uploadData.hook_run = testData
        } else {
            uploadData.test_run = testData
        }

        const req = this._requestQueueHandler.add(uploadData)
        if (req.proceed && req.data) {
            await uploadEventData(req.data, req.url)
        }
    }

    async onTestSkip (testStats: TestStats) {
        // cucumber steps call this method. We don't want step skipped state so skip for cucumber
        if (!this.needToSendData('test', 'skip')) return

        testStats.start ||= new Date()
        testStats.end ||= new Date()
        await this.sendTestRunEvent(testStats, 'TestRunSkipped')
    }
}
// https://github.com/microsoft/TypeScript/issues/6543
const TestReporter: typeof _TestReporter = o11yClassErrorHandler(_TestReporter)
type TestReporter = _TestReporter
export default TestReporter

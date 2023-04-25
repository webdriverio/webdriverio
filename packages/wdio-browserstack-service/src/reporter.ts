import path from 'node:path'
import url from 'node:url'
import WDIOReporter, { SuiteStats, TestStats, RunnerStats } from '@wdio/reporter'
import type { Capabilities, Options } from '@wdio/types'

import { v4 as uuidv4 } from 'uuid'
import { Browser, MultiRemoteBrowser } from 'webdriverio'
import logger from '@wdio/logger'

import { BrowserstackConfig, TestData, TestMeta } from './types'
import { getCloudProvider, getGitMetaData, uploadEventData } from './util'
import RequestQueueHandler from './request-handler'

const log = logger('@wdio/browserstack-service')

export default class TestReporter extends WDIOReporter {
    private _capabilities: Capabilities.Capabilities = {}
    private _config?: BrowserstackConfig & Options.Testrunner
    private _observability = true
    private _sessionId?: string
    private _suiteName?: string
    private _requestQueueHandler = RequestQueueHandler.getInstance()
    private _suites: SuiteStats[] = []
    private _tests: Record<string, TestMeta> = {}
    private _gitConfigPath?: string

    async onRunnerStart (runnerStats: RunnerStats) {
        this._capabilities = runnerStats.capabilities as Capabilities.Capabilities
        this._config = runnerStats.config as BrowserstackConfig & Options.Testrunner
        this._sessionId = runnerStats.sessionId
        if (typeof this._config.testObservability !== 'undefined') this._observability = this._config.testObservability
        const gitMeta = await getGitMetaData()
        if (gitMeta) {
            this._gitConfigPath = gitMeta.root
        }

    }

    onSuiteStart (suiteStats: SuiteStats) {
        let filename = suiteStats.file
        if (this._config?.framework == 'jasmine') {
            try {
                filename = url.fileURLToPath(suiteStats.file)
            } catch (e) {
                log.debug('Error in decoding file name of suite')
            }
        }
        this._suiteName =  filename
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
            return testType === 'test'
        default:
            return false
        }
    }

    async onTestEnd(testStats: TestStats) {
        if (!this.needToSendData('test', 'end')) return

        testStats.end ||= new Date()
        await this.sendTestRunEvent(testStats, 'TestRunFinished')
    }

    async onTestStart(testStats: TestStats) {
        if (!this.needToSendData('test', 'start')) return

        this._tests[testStats.fullTitle] = {
            uuid: uuidv4(),
        }
        await this.sendTestRunEvent(testStats, 'TestRunStarted')
    }

    async sendTestRunEvent(testStats: TestStats, eventType: string) {
        const framework = this._config?.framework

        let testData: TestData = {
            uuid: this._tests[testStats.fullTitle].uuid || uuidv4(),
            type: testStats.type,
            name: testStats.title,
            body: {
                lang: 'webdriverio',
                code: null
            },
            scope: testStats.fullTitle,
            scopes: this._suites.map(s => s.title),
            identifier: testStats.fullTitle,
            file_name: this._suiteName ? path.relative(process.cwd(), this._suiteName) : undefined,
            location: this._suiteName ? path.relative(process.cwd(), this._suiteName) : undefined,
            vc_filepath: (this._gitConfigPath && this._suiteName) ? path.relative(this._gitConfigPath, this._suiteName) : undefined,
            started_at: testStats.start && testStats.start.toISOString(),
            finished_at: testStats.end && testStats.end.toISOString(),
            framework: framework,
            duration_in_ms: testStats._duration,
            result: testStats.state,
            retries: { limit: testStats.retries || 0, attempts: testStats.retries || 0 }
        }

        if (eventType == 'TestRunStarted' || eventType == 'TestRunSkipped') {
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

        if (eventType == 'TestRunSkipped') {
            eventType = 'TestRunFinished'
        }

        const uploadData = {
            event_type: eventType,
            test_run: testData
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

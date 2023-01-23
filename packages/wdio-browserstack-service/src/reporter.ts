import type { SuiteStats, TestStats, RunnerStats } from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import type { Capabilities, Options } from '@wdio/types'

import { v4 as uuidv4 } from 'uuid'

import type { BrowserstackConfig, TestData } from './types.js'
import { getCloudProvider, uploadEventData, getHierarchy } from './util.js'
import RequestQueueHandler from './request-handler.js'

export default class TestReporter extends WDIOReporter {
    private _capabilities: Capabilities.Capabilities = {}
    private _config?: BrowserstackConfig & Options.Testrunner
    private _observability = true
    private _sessionId?: string
    private _suiteName?: string
    private _requestQueueHandler = RequestQueueHandler.getInstance()

    onRunnerStart (runnerStats: RunnerStats) {
        this._capabilities = runnerStats.capabilities as Capabilities.Capabilities
        this._config = runnerStats.config as BrowserstackConfig & Options.Testrunner
        this._sessionId = runnerStats.sessionId
        if (typeof this._config.testObservability !== 'undefined') {
            this._observability = this._config.testObservability
        }
    }

    onSuiteStart (suiteStats: SuiteStats) {
        this._suiteName = suiteStats.file
    }

    async onTestSkip (testStats: TestStats) {
        // cucumber steps call this method. We don't want step skipped state so skip for cucumber
        const framework = this._config?.framework

        if (this._observability && framework !== 'cucumber') {
            const testData: TestData = {
                uuid: uuidv4(),
                type: testStats.type,
                name: testStats.title,
                body: {
                    lang: 'webdriverio',
                    code: null
                },
                scope: testStats.fullTitle,
                scopes: getHierarchy(testStats.fullTitle),
                identifier: testStats.fullTitle,
                file_name: this._suiteName,
                location: this._suiteName,
                started_at: (new Date()).toISOString(),
                framework: framework,
                finished_at: (new Date()).toISOString(),
                duration_in_ms: testStats._duration,
                retries: { limit:0, attempts: 0 },
                result: testStats.state,
            }

            const cloudProvider = getCloudProvider({ options: { hostname: this._config?.hostname } } as WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser)
            testData.integrations = {}

            testData.integrations[cloudProvider] = {
                capabilities: this._capabilities,
                session_id: this._sessionId,
                browser: this._capabilities?.browserName,
                browser_version: this._capabilities?.browserVersion,
                platform: this._capabilities?.platformName,
            }

            const uploadData = {
                event_type: 'TestRunFinished',
                test_run: testData
            }

            const req = this._requestQueueHandler.add(uploadData)
            if (req.proceed && req.data) {
                await uploadEventData(req.data, req.url)
            }
        }
    }
}

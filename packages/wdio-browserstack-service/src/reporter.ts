import WDIOReporter from '@wdio/reporter'
import { SuiteStats, TestStats, RunnerStats } from '@wdio/reporter'

import { v4 as uuidv4 } from 'uuid'
import { Options, Reporters } from '@wdio/types'
import { BrowserstackConfig } from './types'
import { getCloudProvider, uploadEventData, scopes } from './util'

export default class TestReporter extends WDIOReporter {
    private _capabilities: any
    private _config: BrowserstackConfig & Options.Testrunner
    private _observability?: boolean = true
    private _sessionId?: string
    private _suiteName?: string

    constructor(options: Reporters.Options) {
        super(options)
        this._capabilities = {}
        this._config = {} as any
    }

    onRunnerStart (runnerStats: RunnerStats) {
        this._capabilities = runnerStats.capabilities
        this._config = runnerStats.config
        this._sessionId = runnerStats.sessionId
        if (this._config.testObservability == false) this._observability = false
    }

    onSuiteStart (suiteStats: SuiteStats) {
        this._suiteName = suiteStats.file
    }

    async onTestSkip (testStats: TestStats) {
        if (this._observability && this._config.framework != 'cucumber') {
            let testData: any = {
                uuid: uuidv4(),
                type: testStats.type,
                name: testStats.title,
                body: {
                    lang: 'webdriverio',
                    code: null
                },
                scope: testStats.fullTitle,
                scopes: scopes(testStats.fullTitle),
                identifier: testStats.fullTitle,
                file_name: this._suiteName,
                location: this._suiteName,
                started_at: testStats.start,
                framework: this._config.framework,
            }

            let finishedTestData = {
                ...testData,
                finished_at: (new Date()).toISOString(),
                duration_in_ms: testStats._duration,
                retries: { attempts: 0 },
                result: testStats.state,
            }

            let cloudProvider = getCloudProvider({ options: { hostname: this._config.hostname } })
            testData['integrations'] = {}
            testData['integrations'][cloudProvider] = {
                'capabilities': this._capabilities,
                'session_id': this._sessionId,
                'browser': this._capabilities.browserName,
                'browser_version': this._capabilities.browserVersion,
                'platform': this._capabilities.platformName,
            }

            await uploadEventData({
                event_type: 'TestRunStarted',
                test_run: testData
            })
            await uploadEventData({
                event_type: 'TestRunFinished',
                test_run: finishedTestData
            })
        }
    }
}

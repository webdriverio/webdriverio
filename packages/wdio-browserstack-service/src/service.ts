import path from 'path'

import logger from '@wdio/logger'
import type { Services, Capabilities, Options, Frameworks } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { BrowserstackConfig, MultiRemoteAction, SessionResponse } from './types'

import got from 'got'
import type { Pickle, Feature, ITestCaseHookParameter } from './cucumber-types'

import InsightsHandler from './insights-handler'
import { getBrowserDescription, getBrowserCapabilities, isBrowserstackCapability, getParentSuiteName, isBrowserstackSession } from './util'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService implements Services.ServiceInstance {
    private _sessionBaseUrl = 'https://api.browserstack.com/automate/sessions'
    private _failReasons: string[] = []
    private _scenariosThatRan: string[] = []
    private _failureStatuses: string[] = ['failed', 'ambiguous', 'undefined', 'unknown']
    private _browser?: Browser<'async'> | MultiRemoteBrowser<'async'>
    private _fullTitle?: string
    private _observability?: boolean = true
    private _currentTest?: Frameworks.Test | ITestCaseHookParameter
    private insightsHandler?: InsightsHandler

    constructor (
        private _options: BrowserstackConfig & Options.Testrunner,
        private _caps: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        // added to maintain backward compatibility with webdriverIO v5
        this._config || (this._config = _options)
        if (this._options.testObservability == false) this._observability = false

        if (this._observability) {
            this._config.reporters ? this._config.reporters.push(path.join(__dirname, 'reporter.js')) : [path.join(__dirname, 'reporter.js')]
            this.insightsHandler = new InsightsHandler(this._config.framework)
        }

        // Cucumber specific
        const strict = Boolean(this._config.cucumberOpts && this._config.cucumberOpts.strict)
        // See https://github.com/cucumber/cucumber-js/blob/master/src/runtime/index.ts#L136
        if (strict) {
            this._failureStatuses.push('pending')
        }
    }

    _updateCaps (fn: (caps: Capabilities.Capabilities | Capabilities.DesiredCapabilities) => void) {
        const multiRemoteCap = this._caps as Capabilities.MultiRemoteCapabilities

        if (multiRemoteCap.capabilities) {
            return Object.entries(multiRemoteCap).forEach(([, caps]) => fn(caps.capabilities as Capabilities.Capabilities))
        }

        return fn(this._caps as Capabilities.Capabilities)
    }

    /**
     * if no user and key is specified even though a browserstack service was
     * provided set user and key with values so that the session request
     * will fail
     */
    beforeSession (config: Options.Testrunner) {
        if (!config.user) {
            config.user = 'NotSetUser'
        }

        if (!config.key) {
            config.key = 'NotSetKey'
        }
        this._config.user = config.user
        this._config.key = config.key
    }

    async before(caps: Capabilities.RemoteCapability, specs: string[], browser: Browser<'async'> | MultiRemoteBrowser<'async'>) {
        // added to maintain backward compatibility with webdriverIO v5
        this._browser = browser ? browser : (global as any).browser

        // Ensure capabilities are not null in case of multiremote

        if (this._isAppAutomate()) {
            this._sessionBaseUrl = 'https://api-cloud.browserstack.com/app-automate/sessions'
        }

        this._scenariosThatRan = []

        if (this._observability && this._browser) {
            await this.insightsHandler?.setUp(this._browser, this._browser.capabilities as Capabilities.Capabilities, this._isAppAutomate(), this._browser.sessionId as string)

            /**
             * register command event
             */
            this._browser.on('command', async (command) => await this.insightsHandler?.browserCommand(
                'client:beforeCommand',
                Object.assign(command, { sessionId: this._browser?.sessionId }),
                this._currentTest
            ))
            /**
             * register result event
             */
            this._browser.on('result', async (result) => await this.insightsHandler?.browserCommand(
                'client:afterCommand',
                Object.assign(result, { sessionId: this._browser?.sessionId }),
                this._currentTest
            ))
        }

        return await this._printSessionURL()
    }

    beforeSuite (suite: Frameworks.Suite) {
        this._fullTitle = suite.title
    }

    async beforeHook (test: Frameworks.Test, context: any) {
        if (this._config.framework !== 'cucumber') this._currentTest = test // not update currentTest when this is called for cucumber step
        await this.insightsHandler?.beforeHook(test, context)
    }

    async afterHook (test: Frameworks.Test, context: unknown, result: Frameworks.TestResult) {
        await this.insightsHandler?.afterHook(test, result)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async beforeTest(test: Frameworks.Test, context: unknown) {
        this._currentTest = test
        await this.insightsHandler?.beforeTest(test)
    }

    async afterTest(test: Frameworks.Test, context: never, results: Frameworks.TestResult) {
        const { error, passed } = results

        // Jasmine
        if (test.fullName) {
            const testSuiteName = test.fullName.slice(0, test.fullName.indexOf(test.description || '') - 1)
            if (this._fullTitle === 'Jasmine__TopLevel__Suite') {
                this._fullTitle = testSuiteName
            } else if (this._fullTitle) {
                this._fullTitle = getParentSuiteName(this._fullTitle, testSuiteName)
            }
        } else {
            // Mocha
            this._fullTitle = `${test.parent} - ${test.title}`
        }

        if (!passed) {
            this._failReasons.push((error && error.message) || 'Unknown Error')
        }

        await this.insightsHandler?.afterTest(test, results)
    }

    after (result: number) {
        // For Cucumber: Checks scenarios that ran (i.e. not skipped) on the session
        // Only 1 Scenario ran and option enabled => Redefine session name to Scenario's name
        if (this._options.preferScenarioName && this._scenariosThatRan.length === 1){
            this._fullTitle = this._scenariosThatRan.pop()
        }

        const hasReasons = Boolean(this._failReasons.filter(Boolean).length)

        return this._updateJob({
            status: result === 0 ? 'passed' : 'failed',
            name: this._fullTitle,
            reason: hasReasons ? this._failReasons.join('\n') : undefined
        })
    }

    /**
     * For CucumberJS
     */

    beforeFeature(uri: unknown, feature: Feature) {
        this._fullTitle = feature.name
        return this._updateJob({ name: this._fullTitle })
    }

    async beforeScenario (world: ITestCaseHookParameter) {
        this._currentTest = world
        await this.insightsHandler?.beforeScenario(world)
    }

    async afterScenario (world: ITestCaseHookParameter) {
        const status = world.result?.status.toLowerCase()
        if (status !== 'skipped') {
            this._scenariosThatRan.push(world.pickle.name || 'unknown pickle name')
        }

        if (status && this._failureStatuses.includes(status)) {
            const exception = (
                (world.result && world.result.message) ||
                (status === 'pending'
                    ? `Some steps/hooks are pending for scenario "${world.pickle.name}"`
                    : 'Unknown Error'
                )
            )

            this._failReasons.push(exception)
        }

        await this.insightsHandler?.afterScenario(world)
    }

    async beforeStep (step: Frameworks.PickleStep, scenario: Pickle) {
        await this.insightsHandler?.beforeStep(step, scenario)
    }

    async afterStep (step: Frameworks.PickleStep, scenario: Pickle, result: Frameworks.PickleResult) {
        await this.insightsHandler?.afterStep(step, scenario, result)
    }

    async onReload(oldSessionId: string, newSessionId: string) {
        if (!this._browser) {
            return Promise.resolve()
        }

        const hasReasons = Boolean(this._failReasons.filter(Boolean).length)

        let status = hasReasons ? 'failed' : 'passed'
        if (!this._browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
        } else {
            const browserName = (this._browser as MultiRemoteBrowser<'async'>).instances.filter(
                (browserName: string) => this._browser && (this._browser as MultiRemoteBrowser<'async'>)[browserName].sessionId === newSessionId)[0]
            log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        }

        await this._update(oldSessionId, {
            name: this._fullTitle,
            status,
            reason: hasReasons ? this._failReasons.join('\n') : undefined
        })
        this._scenariosThatRan = []
        delete this._fullTitle
        this._failReasons = []
        await this._printSessionURL()
    }

    _isAppAutomate(): boolean {
        const browserDesiredCapabilities = (this._browser?.capabilities ?? {}) as Capabilities.DesiredCapabilities
        const desiredCapabilities = (this._caps ?? {})  as Capabilities.DesiredCapabilities

        return !!browserDesiredCapabilities['appium:app'] || !!desiredCapabilities['appium:app'] || !!browserDesiredCapabilities.app || !!desiredCapabilities.app
    }

    _updateJob (requestBody: any) {
        return this._multiRemoteAction((sessionId: string, browserName: string) => {
            log.info(browserName
                ? `Update multiremote job for browser "${browserName}" and sessionId ${sessionId}`
                : `Update job with sessionId ${sessionId}`
            )
            return this._update(sessionId, requestBody)
        })
    }

    _multiRemoteAction (action: MultiRemoteAction) {
        const { _browser } = this
        if (!_browser) {
            return Promise.resolve()
        }

        if (!_browser.isMultiremote) {
            return action(_browser.sessionId)
        }

        return Promise.all(_browser.instances
            .filter((browserName: string) => {
                const cap = getBrowserCapabilities(_browser, (this._caps as Capabilities.MultiRemoteCapabilities), browserName)
                return isBrowserstackCapability(cap)
            })
            .map((browserName: string) => (
                action(_browser[browserName].sessionId, browserName)
            ))
        )
    }

    _update(sessionId: string, requestBody: any) {
        if (!this._browser || !isBrowserstackSession(this._browser)) {
            return Promise.resolve()
        }
        const sessionUrl = `${this._sessionBaseUrl}/${sessionId}.json`
        log.debug(`Updating Browserstack session at ${sessionUrl} with request body: `, requestBody)
        return got.put(sessionUrl, {
            json: requestBody,
            username: this._config.user,
            password: this._config.key
        })
    }

    async _printSessionURL() {
        if (!this._browser || !isBrowserstackSession(this._browser)) {
            return Promise.resolve()
        }
        await this._multiRemoteAction(async (sessionId, browserName) => {
            const sessionUrl = `${this._sessionBaseUrl}/${sessionId}.json`
            log.debug(`Requesting Browserstack session URL at ${sessionUrl}`)
            const response = await got<SessionResponse>(sessionUrl, {
                username: this._config.user,
                password: this._config.key,
                responseType: 'json'
            })

            if (!this._browser) {
                return
            }

            const capabilities = getBrowserCapabilities(this._browser, this._caps, browserName)
            const browserString = getBrowserDescription(capabilities)
            log.info(`${browserString} session: ${response.body.automation_session.browser_url}`)
        })
    }
}

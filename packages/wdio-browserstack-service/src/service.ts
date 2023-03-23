import logger from '@wdio/logger'
import type { Services, Capabilities, Options, Frameworks } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { BrowserstackConfig, MultiRemoteAction, SessionResponse } from './types'
import { DEFAULT_OPTIONS } from './constants'

import got from 'got'
import type { Pickle, Feature, ITestCaseHookParameter } from './cucumber-types'

import InsightsHandler from './insights-handler'
import { getBrowserDescription, getBrowserCapabilities, isBrowserstackCapability, getParentSuiteName, isBrowserstackSession } from './util'
import TestReporter from './reporter'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService implements Services.ServiceInstance {
    private _sessionBaseUrl = 'https://api.browserstack.com/automate/sessions'
    private _failReasons: string[] = []
    private _scenariosThatRan: string[] = []
    private _failureStatuses: string[] = ['failed', 'ambiguous', 'undefined', 'unknown']
    private _browser?: Browser<'async'> | MultiRemoteBrowser<'async'>
    private _suiteTitle?: string
    private _fullTitle?: string
    private _options: BrowserstackConfig & Options.Testrunner
    private _specsRan: boolean = false
    private _observability
    private _currentTest?: Frameworks.Test | ITestCaseHookParameter
    private _insightsHandler?: InsightsHandler

    constructor (
        options: BrowserstackConfig & Options.Testrunner,
        private _caps: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        this._options = { ...DEFAULT_OPTIONS, ...options }
        // added to maintain backward compatibility with webdriverIO v5
        this._config || (this._config = this._options)
        this._observability = this._options.testObservability

        if (this._observability) {
            this._config.reporters?.push(TestReporter)
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

    beforeSession (config: Omit<Options.Testrunner, 'capabilities'>) {
        // if no user and key is specified even though a browserstack service was
        // provided set user and key with values so that the session request
        // will fail
        const testObservabilityOptions = this._options.testObservabilityOptions
        if (!config.user && !(testObservabilityOptions && testObservabilityOptions.user)) {
            config.user = 'NotSetUser'
        }

        if (!config.key && !(testObservabilityOptions && testObservabilityOptions.key)) {
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
            this._insightsHandler = new InsightsHandler(this._browser, this._browser.capabilities as Capabilities.Capabilities, this._isAppAutomate(), this._browser.sessionId as string, this._config.framework)
            await this._insightsHandler.before()

            /**
             * register command event
             */
            this._browser.on('command', async (command) => await this._insightsHandler?.browserCommand(
                'client:beforeCommand',
                Object.assign(command, { sessionId: this._browser?.sessionId }),
                this._currentTest
            ))
            /**
             * register result event
             */
            this._browser.on('result', async (result) => await this._insightsHandler?.browserCommand(
                'client:afterCommand',
                Object.assign(result, { sessionId: this._browser?.sessionId }),
                this._currentTest
            ))
        }

        return await this._printSessionURL()
    }

    /**
     * Set the default job name at the suite level to make sure we account
     * for the cases where there is a long running `before` function for a
     * suite or one that can fail.
     * Don't do this for Jasmine because `suite.title` is `Jasmine__TopLevel__Suite`
     * and `suite.fullTitle` is `undefined`, so no alternative to use for the job name.
     */
    async beforeSuite (suite: Frameworks.Suite) {
        this._suiteTitle = suite.title
        if (suite.title && suite.title !== 'Jasmine__TopLevel__Suite') {
            await this._setSessionName(suite.title)
        }
    }

    async beforeHook (test: Frameworks.Test, context: any) {
        if (this._config.framework !== 'cucumber') this._currentTest = test // not update currentTest when this is called for cucumber step
        await this._insightsHandler?.beforeHook(test, context)
    }

    async afterHook (test: Frameworks.Test, context: unknown, result: Frameworks.TestResult) {
        await this._insightsHandler?.afterHook(test, result)
    }

    async beforeTest (test: Frameworks.Test) {
        this._currentTest = test
        let suiteTitle = this._suiteTitle
        if (test.fullName) {
            // For Jasmine, `suite.title` is `Jasmine__TopLevel__Suite`.
            // This tweak allows us to set the real suite name.
            const testSuiteName = test.fullName.slice(0, test.fullName.indexOf(test.description || '') - 1)
            if (this._suiteTitle === 'Jasmine__TopLevel__Suite') {
                suiteTitle = testSuiteName
            } else if (this._suiteTitle) {
                suiteTitle = getParentSuiteName(this._suiteTitle, testSuiteName)
            }
        }

        await this._setSessionName(suiteTitle, test)
        await this._setAnnotation(`Test: ${test.fullName ?? test.title}`)
        await this._insightsHandler?.beforeTest(test)
    }

    async afterTest(test: Frameworks.Test, context: never, results: Frameworks.TestResult) {
        this._specsRan = true
        const { error, passed } = results
        if (!passed) {
            this._failReasons.push((error && error.message) || 'Unknown Error')
        }

        await this._insightsHandler?.afterTest(test, results)
    }

    async after (result: number) {
        const { preferScenarioName, setSessionName, setSessionStatus } = this._options
        // For Cucumber: Checks scenarios that ran (i.e. not skipped) on the session
        // Only 1 Scenario ran and option enabled => Redefine session name to Scenario's name
        if (preferScenarioName && this._scenariosThatRan.length === 1){
            this._fullTitle = this._scenariosThatRan.pop()
        }

        if (setSessionStatus) {
            const hasReasons = this._failReasons.length > 0
            await this._updateJob({
                status: result === 0 && this._specsRan ? 'passed' : 'failed',
                ...(setSessionName ? { name: this._fullTitle } : {}),
                ...(hasReasons ? { reason: this._failReasons.join('\n') } : {})
            })
        }

        await this._insightsHandler?.uploadPending()
        await this._insightsHandler?.teardown()
    }

    /**
     * For CucumberJS
     */

    async beforeFeature(uri: string, feature: Feature) {
        this._suiteTitle = feature.name
        await this._setSessionName(feature.name)
        await this._setAnnotation(`Feature: ${feature.name}`)
    }

    /**
     * Runs before a Cucumber Scenario.
     * @param world world object containing information on pickle and test step
     */
    async beforeScenario (world: ITestCaseHookParameter) {
        this._currentTest = world
        await this._insightsHandler?.beforeScenario(world)
        const scenarioName = world.pickle.name || 'unknown scenario'
        await this._setAnnotation(`Scenario: ${scenarioName}`)
    }

    async afterScenario (world: ITestCaseHookParameter) {
        this._specsRan = true
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

        await this._insightsHandler?.afterScenario(world)
    }

    async beforeStep (step: Frameworks.PickleStep, scenario: Pickle) {
        await this._insightsHandler?.beforeStep(step, scenario)
        await this._setAnnotation(`Step: ${step.keyword}${step.text}`)
    }

    async afterStep (step: Frameworks.PickleStep, scenario: Pickle, result: Frameworks.PickleResult) {
        await this._insightsHandler?.afterStep(step, scenario, result)
    }

    async onReload(oldSessionId: string, newSessionId: string) {
        if (!this._browser) {
            return Promise.resolve()
        }

        const { setSessionName, setSessionStatus } = this._options
        const hasReasons = this._failReasons.length > 0
        const status = hasReasons ? 'failed' : 'passed'

        if (!this._browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
        } else {
            const browserName = (this._browser as MultiRemoteBrowser<'async'>).instances.filter(
                (browserName) => this._browser && (this._browser as MultiRemoteBrowser<'async'>)[browserName].sessionId === newSessionId)[0]
            log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        }

        if (setSessionStatus) {
            await this._update(oldSessionId, {
                status,
                ...(setSessionName ? { name: this._fullTitle } : {}),
                ...(hasReasons ? { reason: this._failReasons.join('\n') } : {})
            })
        }

        this._scenariosThatRan = []
        delete this._suiteTitle
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
            .filter(browserName => {
                const cap = getBrowserCapabilities(_browser, (this._caps as Capabilities.MultiRemoteCapabilities), browserName)
                return isBrowserstackCapability(cap)
            })
            .map((browserName: string) => (
                action(_browser[browserName].sessionId, browserName)
            ))
        )
    }

    _update(sessionId: string, requestBody: any) {
        if (!isBrowserstackSession(this._browser)) {
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

    private async _setSessionName(suiteTitle: string | undefined, test?: Frameworks.Test) {
        if (!this._options.setSessionName || !suiteTitle) {
            return
        }

        let name = suiteTitle
        if (this._options.sessionNameFormat) {
            name = this._options.sessionNameFormat(
                this._config,
                this._caps,
                suiteTitle,
                test?.title
            )
        } else if (test && !test.fullName) {
            // Mocha
            const pre = this._options.sessionNamePrependTopLevelSuiteTitle ? `${suiteTitle} - ` : ''
            const post = !this._options.sessionNameOmitTestTitle ? ` - ${test.title}` : ''
            name = `${pre}${test.parent}${post}`
        }

        if (name !== this._fullTitle) {
            this._fullTitle = name
            await this._updateJob({ name })
        }
    }

    private _setAnnotation(data: string) {
        return this._executeCommand('annotate', { data, level: 'info' })
    }

    private async _executeCommand<T = any>(
        action: string,
        args?: object,
    ) {
        if (!this._browser || !isBrowserstackSession(this._browser)) {
            return Promise.resolve()
        }

        const cmd = { action, ...(args ? { arguments: args } : {}) }
        const script = `browserstack_executor: ${JSON.stringify(cmd)}`

        if (this._browser.isMultiremote) {
            const multiRemoteBrowser = this._browser as MultiRemoteBrowser<'async'>
            return Promise.all(Object.keys(this._caps).map(async (browserName) => {
                const browser = multiRemoteBrowser[browserName]
                return (await browser.execute<T, []>(script))
            }))
        }

        return (await this._browser.execute<T, []>(script))
    }
}

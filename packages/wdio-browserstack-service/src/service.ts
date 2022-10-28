import logger from '@wdio/logger'
import got from 'got'
import type { Services, Capabilities, Options, Frameworks } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import { getBrowserDescription, getBrowserCapabilities, isBrowserstackCapability, getParentSuiteName, getUniqueIdentifier, getCloudProvider, getUniqueIdentifierForCucumber, getScenarioNameWithExamples, isBrowserstackSession, removeAnsiColors, uploadEventData } from './util'
import { BrowserstackConfig, MultiRemoteAction, SessionResponse } from './types'
import { v4 as uuidv4 } from 'uuid'
import { ClientRequestInterceptor } from '@mswjs/interceptors/lib/interceptors/ClientRequest'
import { IsomorphicRequest } from '@mswjs/interceptors/lib/IsomorphicRequest'
import { IsomorphicResponse } from '@mswjs/interceptors'
import { Test, TestResult } from '@wdio/types/build/Frameworks'
import path from 'path'

const log = logger('@wdio/browserstack-service')
const interceptor = new ClientRequestInterceptor()

export default class BrowserstackService implements Services.ServiceInstance {
    private _sessionBaseUrl = 'https://api.browserstack.com/automate/sessions'
    private _failReasons: string[] = []
    private _scenariosThatRan: string[] = []
    private _failureStatuses: string[] = ['failed', 'ambiguous', 'undefined', 'unknown']
    private _browser?: Browser<'async'> | MultiRemoteBrowser<'async'>
    private _fullTitle?: string
    private _observability?: boolean = true
    private _tests: any
    private _platformMeta: any
    private _currentTest: any
    private _framework?: string
    private _hooks: any

    constructor (
        private _options: BrowserstackConfig & Options.Testrunner,
        private _caps: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        // added to maintain backward compatibility with webdriverIO v5
        this._config || (this._config = _options)
        if (this._options.testObservability == false) this._observability = false

        if (this._observability) {
            this._tests = {}
            this._hooks = {}
            this._config.reporters ? this._config.reporters.push(path.join(__dirname, 'reporter.js')) : [path.join(__dirname, 'reporter.js')]
            this._framework = this._config.framework
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

    before(caps: Capabilities.RemoteCapability, specs: string[], browser: Browser<'async'> | MultiRemoteBrowser<'async'>) {
        // added to maintain backward compatibility with webdriverIO v5
        this._browser = browser ? browser : (global as any).browser

        // Ensure capabilities are not null in case of multiremote

        if (this._isAppAutomate()) {
            this._sessionBaseUrl = 'https://api-cloud.browserstack.com/app-automate/sessions'
        }

        this._scenariosThatRan = []

        if (this._observability) {
            // capture requests

            // Enable the interception of requests.
            interceptor.apply()

            // Listen to any responses sent to "http.ClientRequest".
            // Note that this listener is read-only and cannot affect responses.
            interceptor.on('response', (request: IsomorphicRequest, response: IsomorphicResponse) => {
                this.requestHandler(request, response, this._currentTest)
            })

            if (this._browser) {
                // get platform details
                let browserCaps: any = getBrowserCapabilities(this._browser, (this._caps as Capabilities.MultiRemoteCapabilities))
                this._platformMeta = {
                    browserName: browserCaps.browserName,
                    browserVersion: browserCaps.browserVersion,
                    platformName: browserCaps.platformName,
                    caps: browserCaps,
                    sessionId: browserCaps['webdriver.remote.sessionid']
                }
            }

        }

        return this._printSessionURL()
    }

    beforeSuite (suite: Frameworks.Suite) {
        this._fullTitle = suite.title
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async beforeHook (test: any, context: any) {
        this._currentTest = test
        let hookId = uuidv4()
        if (this._observability) {
            let fullTitle = `${test.parent} - ${test.title}`
            this._tests[fullTitle] = {
                uuid: hookId,
                startedAt: (new Date()).toISOString(),
                finishedAt: null
            }
            this._attachHookData(context, hookId)
            await this.sendTestRunEvent(test, 'HookRunStarted')
        }
    }

    async afterHook (test: Test, context: any, result: TestResult) {
        if (this._observability) {
            let fullTitle = getUniqueIdentifier(test)
            if (this._tests[fullTitle]) {
                this._tests[fullTitle]['finishedAt'] = (new Date()).toISOString()
            } else {
                this._tests[fullTitle] = {
                    finishedAt: (new Date()).toISOString()
                }
            }
            await this.sendTestRunEvent(test, 'HookRunFinished', result)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async afterCommand(commandName: string, args: any[], result: any, error?: Error) {
        if (this._observability && this._currentTest && commandName == 'takeScreenshot'){
            let identifier = this._currentTest.pickle == undefined ? getUniqueIdentifier(this._currentTest) : getUniqueIdentifierForCucumber(this._currentTest)
            let log: any = {
                test_run_uuid: this._tests[identifier].uuid,
                timestamp: new Date().toISOString(),
                message: result,
                kind: 'TEST_SCREENSHOT'
            }

            await uploadEventData({
                event_type: 'LogCreated',
                logs: [log]
            })
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async beforeTest(test: Frameworks.Test, _context: any) {
        this._currentTest = test
        if (this._observability) {
            let fullTitle = getUniqueIdentifier(test)
            this._tests[fullTitle] = {
                uuid: uuidv4(),
                startedAt: (new Date()).toISOString(),
                finishedAt: null
            }
            await this.sendTestRunEvent(test, 'TestRunStarted')
        }
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

        if (this._observability) {
            let fullTitle = getUniqueIdentifier(test)
            if (this._tests[fullTitle]) {
                this._tests[fullTitle]['finishedAt'] = (new Date()).toISOString()
            } else {
                this._tests[fullTitle] = {
                    finishedAt: (new Date()).toISOString()
                }
            }
            await this.sendTestRunEvent(test, 'TestRunFinished', results)
        }
    }

    scopes(test: Frameworks.Test) {
        let value = []
        let parent = test.ctx.test.parent
        while (parent && parent.title !== '') {
            value.push(parent.title)
            parent = parent.parent
        }
        if (parent && parent.title !== '') {
            value.push(parent.title)
        }
        return value.reverse()
    }

    after (result: number) {
        // For Cucumber: Checks scenarios that ran (i.e. not skipped) on the session
        // Only 1 Scenario ran and option enabled => Redefine session name to Scenario's name
        if (this._options.preferScenarioName && this._scenariosThatRan.length === 1){
            this._fullTitle = this._scenariosThatRan.pop()
        }

        const hasReasons = Boolean(this._failReasons.filter(Boolean).length)

        if (this._observability) {
            interceptor.dispose()
        }

        return this._updateJob({
            status: result === 0 ? 'passed' : 'failed',
            name: this._fullTitle,
            reason: hasReasons ? this._failReasons.join('\n') : undefined
        })
    }

    /**
     * For CucumberJS
     */

    beforeFeature(uri: unknown, feature: { name: string }) {
        this._fullTitle = feature.name
        return this._updateJob({ name: this._fullTitle })
    }

    async beforeScenario (world: any) {

        this._currentTest = world

        if (this._observability) {
            let pickleData = world.pickle
            let featureData: any
            let gherkinDocument = world.gherkinDocument
            if (gherkinDocument) {
                featureData = gherkinDocument.feature
            }

            let testData: any = {}

            if (pickleData) {
                testData['scenario'] = {
                    name: pickleData.name,
                }
            }

            if (gherkinDocument && featureData) {
                testData['feature'] = {
                    path: gherkinDocument.uri,
                    name: featureData.name,
                    description: featureData.description,
                }
            }

            let uniqueId = getUniqueIdentifierForCucumber(world)

            let testMetaData = {
                uuid: uuidv4(),
                started_at: (new Date()).toISOString(),
                finishedAt: null,
                ...testData
            }
            this._tests[uniqueId] = testMetaData

            if (this._observability) {
                await this.sendTestRunEventForCucumber(world, 'TestRunStarted')
            }
        }
    }

    async afterScenario (world: any) {
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

        if (this._observability) {
            await this.sendTestRunEventForCucumber(world, 'TestRunFinished')
        }
    }

    beforeStep (step: any, scenario: any) {
        if (this._observability) {
            let uniqueId = getUniqueIdentifierForCucumber({ pickle: scenario })
            let testMetaData = this._tests[uniqueId]
            if (!testMetaData) {
                testMetaData = {
                    steps: []
                }
            }

            if (testMetaData && !testMetaData['steps']) {
                testMetaData['steps'] = []
            }

            testMetaData['steps'].push({
                id: step.id,
                text: step.text,
                keyword: step.keyword,
                started_at: (new Date()).toISOString()
            })

            this._tests[uniqueId] = testMetaData
        }
    }

    afterStep (step: any, scenario: any, result: any) {
        if (this._observability) {
            let uniqueId = getUniqueIdentifierForCucumber({ pickle: scenario })
            let testMetaData = this._tests[uniqueId]
            if (!testMetaData) {
                testMetaData = {
                    steps: []
                }
            }

            if (testMetaData && !testMetaData['steps']) {
                testMetaData['steps'] = []
                testMetaData['steps'].push({
                    id: step.id,
                    text: step.text,
                    keyword: step.keyword,
                    finished_at: (new Date()).toISOString(),
                    result: result.passed ? 'PASSED' : 'FAILED',
                    duration: result.duration,
                    failure: result.error ? removeAnsiColors(result.error) : result.error
                })
            } else if (testMetaData){
                let stepDetails = testMetaData['steps'].find((item: any) => item.id == step.id)
                if (stepDetails) {
                    stepDetails.finished_at = (new Date()).toISOString()
                    stepDetails.result = result.passed ? 'PASSED' : 'FAILED'
                    stepDetails.duration = result.duration
                    stepDetails.failure = result.error ? removeAnsiColors(result.error) : result.error
                }
            }

            this._tests[uniqueId] = testMetaData
        }
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
                (browserName) => this._browser && (this._browser as MultiRemoteBrowser<'async'>)[browserName].sessionId === newSessionId)[0]
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
        if (this._browser && !isBrowserstackSession(this._browser)) {
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

    async sendTestRunEvent (test: Frameworks.Test, eventType: string, results?: Frameworks.TestResult) {
        let fullTitle = getUniqueIdentifier(test)
        let testMetaData = this._tests[fullTitle]

        let testData: any = {
            uuid: testMetaData.uuid,
            type: test.type,
            name: test.title,
            body: {
                lang: 'webdriverio',
                code: test.body
            },
            scope: fullTitle,
            scopes: this.scopes(test),
            identifier: fullTitle,
            file_name: test.file,
            location: test.file,
            started_at: testMetaData.startedAt,
            finished_at: testMetaData.finishedAt,
            framework: this._framework
        }

        if ((eventType == 'TestRunFinished' || eventType == 'HookRunFinished') && results) {
            const { error, passed } = results
            if (!passed) {
                testData['result'] = (error && error.message && error.message.includes('sync skip; aborting execution')) ? 'ignore' : 'failed'
                if (error && testData['result'] != 'skipped') {
                    testData['failure'] = [{ backtrace: [removeAnsiColors(error.message)] }] // add all errors here
                    testData['failure_reason'] = removeAnsiColors(error.message)
                    testData['failure_type'] = error.message == null ? null : error.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError' //verify if this is working
                }
            } else {
                testData['result'] = 'passed'
            }

            testData['retries'] = results.retries
            testData['duration_in_ms'] = results.duration
            if (this._hooks[fullTitle]) {
                testData['hooks'] = this._hooks[fullTitle]
            }
        }

        if (eventType == 'TestRunStarted') {
            if (this._platformMeta) {
                testData['integrations'] = {}
                testData['integrations'][getCloudProvider(this._browser)] = {
                    'capabilities': this._platformMeta.caps,
                    'session_id': this._platformMeta.sessionId,
                    'browser': this._platformMeta.browserName,
                    'browser_version': this._platformMeta.browserVersion,
                    'platform': this._platformMeta.platformName,
                }
            }
        }

        let uploadData: any = {
            event_type: eventType,
        }

        if (eventType.match(/HookRun/)) {
            testData['hook_type'] = this._getHookType(testData.name.toLowerCase())
            uploadData['hook_run'] = testData
        } else {
            uploadData['test_run'] = testData
        }
        await uploadEventData(uploadData)
    }

    _getHookType(hookName: string): string {
        if (hookName.includes('before each')) {
            return 'BEFORE_EACH'
        } else if (hookName.includes('before all')) {
            return 'BEFORE_ALL'
        } else if (hookName.includes('after each')) {
            return 'AFTER_EACH'
        } else if (hookName.includes('after all')) {
            return 'AFTER_ALL'
        }
        return 'unknown'
    }

    _attachHookData(context: any, hookId: string): void {
        if (context.currentTest && context.currentTest.parent) {
            let parentTest = `${context.currentTest.parent.title} - ${context.currentTest.title}`
            if (this._hooks[parentTest]) {
                this._hooks[parentTest].push(hookId)
            } else {
                this._hooks[parentTest] = [hookId]
            }
        }
    }

    async sendTestRunEventForCucumber (world: any, eventType: string) {
        let uniqueId = getUniqueIdentifierForCucumber(world)

        let testMetaData = this._tests[uniqueId]
        if (!testMetaData) testMetaData = {}

        if (world.result) {
            let result: string = world.result.status.toLowerCase()
            testMetaData['finished_at'] = (new Date()).toISOString()
            testMetaData['result'] = result
            testMetaData['duration_in_ms'] = world.result.duration.nanos / 1000000 // send duration in ms

            if (result == 'failed') {
                testMetaData['failure'] = [
                    {
                        'backtrace': [world.result.message ? removeAnsiColors(world.result.message) : world.result.message]
                    }
                ],
                testMetaData['failure_reason'] = world.result.message ? removeAnsiColors(world.result.message) : world.result.message,
                testMetaData['failure_type'] = world.result.message == undefined ? null : world.result.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError'
            }
        }

        if (world.pickle) {
            testMetaData['tags'] = world.pickle.tags.map( ({ name }: { name: string }) => (name) )
        }

        const { feature, scenario, steps } = testMetaData

        let fullNameWithExamples: string = getScenarioNameWithExamples(world)

        let testData: any = {
            ...testMetaData,
            type: 'test',
            body: {
                lang: 'webdriverio',
                code: null
            },
            name: fullNameWithExamples,
            scope: fullNameWithExamples,
            scopes: [testMetaData.feature.name],
            identifier: testMetaData.scenario.name,
            file_name: testMetaData.feature.path,
            location: testMetaData.feature.path,
            framework: this._framework,
            meta: {
                feature: feature,
                scenario: scenario,
                steps: steps
            }
        }

        if (eventType == 'TestRunStarted') {
            if (this._platformMeta) {
                testData['integrations'] = {}
                testData['integrations'][getCloudProvider(this._browser)] = {
                    'capabilities': this._platformMeta.caps,
                    'session_id': this._platformMeta.sessionId,
                    'browser': this._platformMeta.browserName,
                    'browser_version': this._platformMeta.browserVersion,
                    'platform': this._platformMeta.platformName,
                }
            }
        }

        delete testData['feature']
        // delete testData['tags']
        delete testData['scenario']
        delete testData['steps']

        let uploadData: any = {
            event_type: eventType,
            test_run: testData
        }
        await uploadEventData(uploadData)
    }

    requestHandler (request: IsomorphicRequest, response: IsomorphicResponse, currentTest: any) {
        let requestData = {
            hostname: request.url ? request.url.host || request.url.hostname : null,
            path: request.url ? request.url.pathname : null,
            method: request.method,
            headers: request.headers.all(),
            status_code: response.status,
            body: response.body,
        }

        if (request.headers.all()['x-bstack-obs'] !== 'true' && currentTest) {
            let identifier = currentTest.pickle == undefined ? getUniqueIdentifier(currentTest) : getUniqueIdentifierForCucumber(currentTest)

            let log = {
                test_run_uuid: this._tests[identifier].uuid,
                timestamp: new Date().toISOString(),
                kind: 'HTTP',
                http_response: requestData
            }

            uploadEventData({
                event_type: 'LogCreated',
                logs: [log]
            })
        }
    }
}

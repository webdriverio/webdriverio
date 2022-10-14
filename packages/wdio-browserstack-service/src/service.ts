import logger from '@wdio/logger'
import got from 'got'
import stripAnsi from 'strip-ansi'
import type { Services, Capabilities, Options, Frameworks } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import { getBrowserDescription, getBrowserCapabilities, isBrowserstackCapability, getParentSuiteName, getUniqueIdentifier, getCloudProvider, getUniqueIdentifierForCucumber, getScenarioNameWithExamples } from './util'
import { BrowserstackConfig, MultiRemoteAction, SessionResponse } from './types'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { DATA_ENDPOINT } from './constants'
// import { requestTracer, requestRestore } from './request-tracer'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService implements Services.ServiceInstance {
    private _sessionBaseUrl = 'https://api.browserstack.com/automate/sessions'
    private _failReasons: string[] = []
    private _scenariosThatRan: string[] = []
    private _failureStatuses: string[] = ['failed', 'ambiguous', 'undefined', 'unknown']
    private _browser?: Browser<'async'> | MultiRemoteBrowser<'async'>
    private _fullTitle?: string
    private _cloudProvider?: string
    private _observability?: boolean = true
    private _tests: any
    private _platformMeta: any
    private _currentTest: any
    private _framework?: string

    constructor (
        private _options: BrowserstackConfig & Options.Testrunner,
        private _caps: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        // added to maintain backward compatibility with webdriverIO v5
        this._config || (this._config = _options)
        if (this._options.observability == false) this._observability = false

        if (this._observability) {
            this._tests = {}
            // this._config.reporters ? this._config.reporters.push(path.join(__dirname, 'reporter.js')) : [path.join(__dirname, 'reporter.js')]
            this._cloudProvider = getCloudProvider(_config)
            this._framework = _config.framework
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

        this._observability = true // TODO: update later as per args
        if (this._observability) {
            // capture requests
            // requestTracer((error: any, requestData: any) => {
            //     console.log('========')
            //     console.log(require('util').inspect(requestData, { depth: null }))
            //     console.log('========')

            //     // if (requestData && !(requestData.headers && requestData.headers['X-BSTACK-TESTOPS'] == 'true')) {
            //     // process.emit('bs:addLog', {
            //     //     test_run_uuid: this._tests[getUniqueIdentifier(this._currentTest)].uuid,
            //     //     timestamp: new Date().toISOString(),
            //     //     kind: 'HTTP',
            //     //     http_response: requestData
            //     // })

            //     let log = {
            //         test_run_uuid: this._tests[getUniqueIdentifier(this._currentTest)].uuid,
            //         timestamp: new Date().toISOString(),
            //         kind: 'HTTP',
            //         http_response: requestData
            //     }

            //     this.uploadEventData({
            //         event_type: 'LogCreated',
            //         logs: [log]
            //     })

            //     // }

            //     // if (requestData && requestData.hostname.includes('browserstack.com')) {
            //     //     this._cloudProvider = 'browserstack'
            //     // } else if (requestData && requestData.hostname.includes('localhost')) {
            //     //     this._cloudProvider = 'local'
            //     // } else {
            //     //     this._cloudProvider = 'UNKNOWN'
            //     // }
            // })

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

    beforeCommand(commandName: string, args: any[]) {
    }

    async afterCommand(commandName: string, args: any[], result: any, error?: Error) {
        if (this._observability && this._currentTest && commandName == 'takeScreenshot'){
            let log: any = {
                test_run_uuid: this._tests[getUniqueIdentifier(this._currentTest)].uuid, // handle for cucumber
                timestamp: new Date().toISOString(),
                message: result,
                kind: 'TEST_SCREENSHOT'
            }

            this.uploadEventData({
                event_type: 'LogCreated',
                logs: [log]
            })
        }
    }

    beforeTest(test: Frameworks.Test, context: any) {
        this._currentTest = test
        if (this._observability) {
            let fullTitle = `${test.parent} - ${test.title}`
            this._tests[fullTitle] = {
                uuid: uuidv4(),
                startedAt: (new Date()).toISOString(),
                finishedAt: null
            }
            this.sendTestRunEvent(test, 'TestRunStarted')
        }
    }

    afterTest(test: Frameworks.Test, context: never, results: Frameworks.TestResult) {
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
            this.sendTestRunEvent(test, 'TestRunFinished', results)
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
            // requestRestore()
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

    afterFeature(uri: string, feature: any) {
    }

    beforeScenario (world: any) {

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
                this.sendTestRunEventForCucumber(world, 'TestRunStarted')
            }
        }
    }

    afterScenario (world: any) {
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
            this.sendTestRunEventForCucumber(world, 'TestRunFinished')
        }
    }

    beforeStep (step: any, scenario: any) {
    }

    afterStep (step: any, scenario: any, result: any) {
        if (this._observability) {
            let uniqueId = getUniqueIdentifierForCucumber({ pickle: scenario })
            // console.log(`uniqueId=${uniqueId}`)
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
                text: step.text,
                keyword: step.keyword,
                result: result.passed ? 'PASSED' : 'FAILED',
                duration: result.duration,
                failure: result.error ? stripAnsi(result.error) : result.error
            })

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
        const sessionUrl = `${this._sessionBaseUrl}/${sessionId}.json`
        log.debug(`Updating Browserstack session at ${sessionUrl} with request body: `, requestBody)
        return got.put(sessionUrl, {
            json: requestBody,
            username: this._config.user,
            password: this._config.key
        })
    }

    async _printSessionURL() {
        if (!this._browser) {
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

    sendTestRunEvent (test: Frameworks.Test, eventType: string, results?: Frameworks.TestResult) {
        let fullTitle = getUniqueIdentifier(test)
        let testMetaData = this._tests[fullTitle]

        let testData: any = {
            uuid: testMetaData.uuid,
            type: test.type, // test, hook etc (not passed in sdk)
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

        if (eventType == 'TestRunFinished' && results != null) {
            const { error, passed } = results
            if (!passed) {
                testData['result'] = 'failed'
                if (error) {
                    testData['failure'] = [{ backtrace: [stripAnsi(error.message)] }] // add all errors here
                    testData['failure_reason'] = stripAnsi(error.message)
                    testData['failure_type'] = error.message == null ? null : error.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError' //verify if this is working
                }
            } else {
                testData['result'] = 'passed'
            }

            testData['duration_in_ms'] = results.duration
        }

        if (eventType == 'TestRunStarted') {
            if (this._platformMeta) {
                let provider = this._cloudProvider ? this._cloudProvider : 'UNKNOWN'
                testData['integrations'] = {}
                testData['integrations'][provider] = {
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
            test_run: testData
        }
        this.uploadEventData(uploadData)
    }

    sendTestRunEventForCucumber (world: any, eventType: string) {
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
                        'backtrace': [world.result.message ? stripAnsi(world.result.message) : world.result.message]
                    }
                ],
                testMetaData['failure_reason'] = world.result.message ? stripAnsi(world.result.message) : world.result.message,
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
                let provider = this._cloudProvider ? this._cloudProvider : 'UNKNOWN'
                testData['integrations'] = {}
                testData['integrations'][provider] = {
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
        this.uploadEventData(uploadData)
    }

    async uploadEventData (eventData: any) {
        const logTag = 'TestRunStarted'
        // logTag = {
        //     ['TestRunStarted']: 'Test_Upload',
        //     ['TestRunFinished']: 'Test_Upload',
        //     ['LogCreated']: 'Log_Upload',
        //     ['HookRunStarted']: 'Hook_Upload',
        //     ['HookRunFinished']: 'Hook_Upload',
        // }[eventData.eventType]

        // if (run === 0) pendingTestUploads += 1

        if (process.env.BS_TESTOPS_BUILD_COMPLETED) {
            if (!process.env.BS_TESTOPS_JWT) {
                console.log(`[${logTag}] Missing Authentication Token/ Build ID`)
                // pendingTestUploads = Math.max(0, pendingTestUploads-1);
                return {
                    status: 'error',
                    message: 'Token/buildID is undefined, build creation might have failed'
                }
            }
            const config = {
                headers: {
                    'Authorization': `Bearer ${process.env.BS_TESTOPS_JWT}`,
                    'Content-Type': 'application/json',
                    'X-BSTACK-OBS': 'true'
                },
                timeout: {
                    // request: 60000
                },
                // agent: httpKeepAliveAgent
            }

            try {
                // const response: any = await nodeRequest('POST', 'api/v1/event', data, config)
                // console.log(`${DATA_ENDPOINT}/api/v1/event`)
                let url = `http://${DATA_ENDPOINT}/api/v1/event`
                let response: any
                try {
                    // response = await got.post(url, { json: eventData, ...config })

                    const readStream: any = got.post(url, { json: eventData, ...config }).json()
                    const onError = (error: any) => {
                        console.log('inside onError')
                        console.log(error)
                        // Do something with it.
                    }

                    readStream.on('response', async (response: any) => {
                        console.log('inside onResponse')
                        if (response.headers.age > 3600) {
                            console.log('Failure - response too old')
                            // readStream.destroy() // Destroy the stream to prevent hanging resources.
                            return
                        }

                        // Prevent `onError` being called twice.
                        // readStream.off('error', onError)

                        try {
                            // console.log(readStream.json())
                            console.log(`[${logTag}] Browserstack TestOps success response: ${response}`)
                            // console.log(`[${logTag}] run[${run}] Browserstack TestOps success response: ${JSON.stringify(response.data)}`)
                            // await pipeline(
                            //     readStream,
                            //     createWriteStream('image.png')
                            // )
                            console.log('Success')
                        } catch (error) {
                            onError(error)
                        }
                    })
                    // readStream.once('error', onError)
                } catch (error) {
                    console.log(error)
                    // console.error(error.response.statusCode)
                }
                // if (response.data.error) {
                //     throw ({ message: response.data.error })
                // } else {
                // console.log(`[${logTag}] run[${run}] Browserstack TestOps success response: ${JSON.stringify(response.data)}`)
                // pendingTestUploads = Math.max(0,pendingTestUploads-1)
                // return {
                //     status: 'success',
                //     message: ''
                // }
                // }
            } catch (error: any) {
                console.log(error)
                // if (error.response) {
                //     console.log(`[${logTag}] Browserstack TestOps error response: ${error.response.status} ${error.response.statusText} ${JSON.stringify(error.response.data)}`)
                // } else {
                //     console.log(`[${logTag}] Browserstack TestOps error: ${error.message || error}`)
                // }
                // // pendingTestUploads = Math.max(0, pendingTestUploads - 1)
                // return {
                //     status: 'error',
                //     message: error.message || (error.response ? `${error.response.status}:${error.response.statusText}` : error)
                // }
            }
        }
        // else if (run >= 5) {
        //     console.log(`[${logTag}] BuildStart is not completed and ${logTag} retry runs exceeded`)
        //     // pendingTestUploads = Math.max(0, pendingTestUploads - 1)
        //     return {
        //         status: 'error',
        //         message: 'Retry runs exceeded'
        //     }
        // } else {
        //     setTimeout(function(){ exports.uploadEventData(eventData, run+1) }, 1000)
        // }
    }
}

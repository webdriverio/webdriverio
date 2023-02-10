import path from 'node:path'

import type { Capabilities, Frameworks } from '@wdio/types'
import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'

import { v4 as uuidv4 } from 'uuid'
import type { Pickle, ITestCaseHookParameter } from './cucumber-types.js'

import { getCloudProvider, getGitMetaData, getHookType, getScenarioExamples, getUniqueIdentifier, getUniqueIdentifierForCucumber, isBrowserstackSession, isScreenshotCommand, removeAnsiColors, sleep, uploadEventData } from './util.js'
import type { TestData, TestMeta, PlatformMeta, UploadType } from './types.js'
import RequestQueueHandler from './request-handler.js'
import { DATA_SCREENSHOT_ENDPOINT, DEFAULT_WAIT_INTERVAL_FOR_PENDING_UPLOADS, DEFAULT_WAIT_TIMEOUT_FOR_PENDING_UPLOADS } from './constants.js'

export default class InsightsHandler {
    private _tests: Record<string, TestMeta> = {}
    private _hooks: Record<string, string[]> = {}
    private _platformMeta: PlatformMeta
    private _commands: Record<string, BeforeCommandArgs & AfterCommandArgs> = {}
    private _gitConfigPath?: string
    private _requestQueueHandler = RequestQueueHandler.getInstance()

    constructor (private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, isAppAutomate?: boolean, private _framework?: string) {
        this._requestQueueHandler.start()
        const caps = (this._browser as WebdriverIO.Browser).capabilities as Capabilities.Capabilities
        const sessionId = (this._browser as WebdriverIO.Browser).sessionId

        this._platformMeta = {
            browserName: caps.browserName,
            browserVersion: caps?.browserVersion,
            platformName: caps?.platformName,
            caps: caps,
            sessionId,
            product: isAppAutomate ? 'app-automate' : 'automate'
        }
    }

    async before () {
        if (isBrowserstackSession(this._browser)) {
            await (this._browser as WebdriverIO.Browser).execute(`browserstack_executor: ${JSON.stringify({
                action: 'annotate',
                arguments: {
                    data: `ObservabilitySync:${Date.now()}`,
                    level: 'debug'
                }
            })}`)
        }

        const gitMeta = await getGitMetaData()
        if (gitMeta) {
            this._gitConfigPath = gitMeta.root
        }
    }

    async beforeHook (test: Frameworks.Test, context: any) {
        const fullTitle = `${test.parent} - ${test.title}`
        const hookId = uuidv4()
        this._tests[fullTitle] = {
            uuid: hookId,
            startedAt: (new Date()).toISOString()
        }
        this.attachHookData(context, hookId)
        if (this._framework === 'mocha') {
            await this.sendTestRunEvent(test, 'HookRunStarted')
        }
    }

    async afterHook (test: Frameworks.Test, result: Frameworks.TestResult) {
        const fullTitle = getUniqueIdentifier(test)
        if (this._tests[fullTitle]) {
            this._tests[fullTitle].finishedAt = (new Date()).toISOString()
        } else {
            this._tests[fullTitle] = {
                finishedAt: (new Date()).toISOString()
            }
        }
        if (this._framework === 'mocha') {
            await this.sendTestRunEvent(test, 'HookRunFinished', result)
        }
    }

    async beforeTest (test: Frameworks.Test) {
        const fullTitle = getUniqueIdentifier(test)
        this._tests[fullTitle] = {
            uuid: uuidv4(),
            startedAt: (new Date()).toISOString()
        }
        await this.sendTestRunEvent(test, 'TestRunStarted')
    }

    async afterTest (test: Frameworks.Test, result: Frameworks.TestResult) {
        const fullTitle = getUniqueIdentifier(test)
        this._tests[fullTitle] = {
            ...(this._tests[fullTitle] || {}),
            finishedAt: (new Date()).toISOString()
        }
        await this.sendTestRunEvent(test, 'TestRunFinished', result)
    }

    /**
      * Cucumber Only
      */

    async beforeScenario (world: ITestCaseHookParameter) {
        const pickleData = world.pickle
        const gherkinDocument = world.gherkinDocument
        const featureData = gherkinDocument.feature
        const uniqueId = getUniqueIdentifierForCucumber(world)
        const testMetaData: TestMeta = {
            uuid: uuidv4(),
            startedAt: (new Date()).toISOString()
        }

        if (pickleData) {
            testMetaData.scenario = {
                name: pickleData.name,
            }
        }

        if (gherkinDocument && featureData) {
            testMetaData.feature = {
                path: gherkinDocument.uri,
                name: featureData.name,
                description: featureData.description,
            }
        }

        this._tests[uniqueId] = testMetaData
        await this.sendTestRunEventForCucumber(world, 'TestRunStarted')
    }

    async afterScenario (world: ITestCaseHookParameter) {
        await this.sendTestRunEventForCucumber(world, 'TestRunFinished')
    }

    async beforeStep (step: Frameworks.PickleStep, scenario: Pickle) {
        const uniqueId = getUniqueIdentifierForCucumber({ pickle: scenario } as ITestCaseHookParameter)
        const testMetaData = this._tests[uniqueId] || { steps: [] }

        if (testMetaData && !testMetaData.steps) {
            testMetaData.steps = []
        }

        testMetaData.steps?.push({
            id: step.id,
            text: step.text,
            keyword: step.keyword,
            started_at: (new Date()).toISOString()
        })

        this._tests[uniqueId] = testMetaData
    }

    async afterStep (step: Frameworks.PickleStep, scenario: Pickle, result: Frameworks.PickleResult) {
        const uniqueId = getUniqueIdentifierForCucumber({ pickle: scenario } as ITestCaseHookParameter)
        const testMetaData = this._tests[uniqueId] || { steps: [] }

        if (!testMetaData.steps) {
            testMetaData.steps = [{
                id: step.id,
                text: step.text,
                keyword: step.keyword,
                finished_at: (new Date()).toISOString(),
                result: result.passed ? 'PASSED' : 'FAILED',
                duration: result.duration,
                failure: result.error ? removeAnsiColors(result.error) : result.error
            }]
        }
        const stepDetails = testMetaData.steps?.find(item => item.id === step.id)
        if (stepDetails) {
            stepDetails.finished_at = (new Date()).toISOString()
            stepDetails.result = result.passed ? 'PASSED' : 'FAILED'
            stepDetails.duration = result.duration
            stepDetails.failure = result.error ? removeAnsiColors(result.error) : result.error
        }

        this._tests[uniqueId] = testMetaData
    }

    async uploadPending (
        waitTimeout = DEFAULT_WAIT_TIMEOUT_FOR_PENDING_UPLOADS,
        waitInterval = DEFAULT_WAIT_INTERVAL_FOR_PENDING_UPLOADS
    ): Promise<unknown> {
        if (this._requestQueueHandler.pendingUploads <= 0 || waitTimeout <= 0) {
            return
        }

        await sleep(waitInterval)
        return this.uploadPending(waitTimeout - waitInterval)
    }

    async teardown () {
        await this._requestQueueHandler.shutdown()
    }

    /**
     * misc methods
     */
    async browserCommand (commandType: string, args: BeforeCommandArgs & AfterCommandArgs, test?: Frameworks.Test | ITestCaseHookParameter) {
        const dataKey = `${args.sessionId}_${args.method}_${args.endpoint}`
        if (commandType === 'client:beforeCommand') {
            this._commands[dataKey] = args
            return
        }

        if (!test) {
            return
        }
        const identifier = this.getIdentifier(test)

        if (!this._tests[identifier]) {
            return
        }

        // log screenshot
        if (Boolean(process.env.BS_TESTOPS_ALLOW_SCREENSHOTS) && isScreenshotCommand(args) && args.result.value) {
            await uploadEventData([{
                event_type: 'LogCreated',
                logs: [{
                    test_run_uuid: this._tests[identifier].uuid,
                    timestamp: new Date().toISOString(),
                    message: args.result.value,
                    kind: 'TEST_SCREENSHOT'
                }]
            }], DATA_SCREENSHOT_ENDPOINT)
        }

        const requestData = this._commands[dataKey]
        if (!requestData) {
            return
        }

        // log http request
        const req = this._requestQueueHandler.add({
            event_type: 'LogCreated',
            logs: [{
                test_run_uuid: this._tests[identifier].uuid,
                timestamp: new Date().toISOString(),
                kind: 'HTTP',
                http_response: {
                    path: requestData.endpoint,
                    method: requestData.method,
                    body: requestData.body,
                    response: args.result
                }
            }]
        })

        if (req.proceed && req.data) {
            await uploadEventData(req.data, req.url)
        }
    }

    /*
     * private methods
     */

    private attachHookData (context: any, hookId: string): void {
        if (!context.currentTest || !context.currentTest.parent) {
            return
        }
        const parentTest = `${context.currentTest.parent.title} - ${context.currentTest.title}`
        if (!this._hooks[parentTest]) {
            this._hooks[parentTest] = []
        }
        this._hooks[parentTest].push(hookId)
    }

    /*
     * Get hierarchy info
     */
    private getHierarchy (test: Frameworks.Test) {
        const value: string[] = []
        if (test.ctx && test.ctx.test) {
            let parent = test.ctx.test.parent
            while (parent && parent.title !== '') {
                value.push(parent.title)
                parent = parent.parent
            }
        }
        return value.reverse()
    }

    private async sendTestRunEvent (test: Frameworks.Test, eventType: string, results?: Frameworks.TestResult) {
        const fullTitle = getUniqueIdentifier(test)
        const testMetaData = this._tests[fullTitle]

        const testData: TestData = {
            uuid: testMetaData.uuid,
            type: test.type,
            name: test.title,
            body: {
                lang: 'webdriverio',
                code: test.body
            },
            scope: fullTitle,
            scopes: this.getHierarchy(test),
            identifier: fullTitle,
            file_name: test.file,
            location: test.file,
            vc_filepath: (this._gitConfigPath && test.file) ? path.relative(this._gitConfigPath, test.file) : undefined,
            started_at: testMetaData.startedAt,
            finished_at: testMetaData.finishedAt,
            result: 'pending',
            framework: this._framework
        }

        if ((eventType === 'TestRunFinished' || eventType === 'HookRunFinished') && results) {
            const { error, passed } = results
            if (!passed) {
                testData.result = (error && error.message && error.message.includes('sync skip; aborting execution')) ? 'ignore' : 'failed'
                if (error && testData.result !== 'skipped') {
                    testData.failure = [{ backtrace: [removeAnsiColors(error.message)] }] // add all errors here
                    testData.failure_reason = removeAnsiColors(error.message)
                    testData.failure_type = error.message === null ? null : error.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError' //verify if this is working
                }
            } else {
                testData.result = 'passed'
            }

            testData.retries = results.retries
            testData.duration_in_ms = results.duration
            if (this._hooks[fullTitle]) {
                testData.hooks = this._hooks[fullTitle]
            }
        }

        if (eventType === 'TestRunStarted') {
            testData.integrations = {}
            if (this._browser && this._platformMeta) {
                const provider = getCloudProvider(this._browser)
                testData.integrations[provider] = this.getIntegrationsObject()
            }
        }

        const uploadData: UploadType = {
            event_type: eventType,
        }

        /* istanbul ignore if */
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

    private async sendTestRunEventForCucumber (world: ITestCaseHookParameter, eventType: string) {
        const uniqueId = getUniqueIdentifierForCucumber(world)
        const { feature, scenario, steps, uuid, startedAt, finishedAt } = this._tests[uniqueId] || {}

        const examples = getScenarioExamples(world)
        const fullNameWithExamples = examples
            ? world.pickle.name + ' (' + examples.join(', ')  + ')'
            : world.pickle.name

        const testData: TestData = {
            uuid: uuid,
            started_at: startedAt,
            finished_at: finishedAt,
            type: 'test',
            body: {
                lang: 'webdriverio',
                code: null
            },
            name: fullNameWithExamples,
            scope: fullNameWithExamples,
            scopes: [feature?.name || ''],
            identifier: scenario?.name,
            file_name: feature?.path,
            vc_filepath: (this._gitConfigPath && feature?.path) ? path.relative(this._gitConfigPath, feature?.path) : undefined,
            location: feature?.path,
            framework: this._framework,
            result: 'pending',
            meta: {
                feature: feature,
                scenario: scenario,
                steps: steps,
                examples: examples
            }
        }

        if (eventType === 'TestRunStarted') {
            testData.integrations = {}
            if (this._browser && this._platformMeta) {
                const provider = getCloudProvider(this._browser)
                testData.integrations[provider] = this.getIntegrationsObject()
            }
        }

        /* istanbul ignore if */
        if (world.result) {
            let result = world.result.status.toLowerCase()
            if (result !== 'passed' && result !== 'failed') {
                result = 'skipped' // mark UNKNOWN/UNDEFINED/AMBIGUOUS/PENDING as skipped
            }
            testData.finished_at = (new Date()).toISOString()
            testData.result = result
            testData.duration_in_ms = world.result.duration.nanos / 1000000 // send duration in ms

            if (result === 'failed') {
                testData.failure = [
                    {
                        'backtrace': [world.result.message ? removeAnsiColors(world.result.message) : 'unknown']
                    }
                ],
                testData.failure_reason = world.result.message ? removeAnsiColors(world.result.message) : world.result.message
                if (world.result.message) {
                    testData.failure_type = world.result.message.match(/AssertionError/)
                        ? 'AssertionError'
                        : 'UnhandledError'
                }
            }
        }

        if (world.pickle) {
            testData.tags = world.pickle.tags.map( ({ name }: { name: string }) => (name) )
        }

        const uploadData: UploadType = {
            event_type: eventType,
            test_run: testData
        }

        const req = this._requestQueueHandler.add(uploadData)
        if (req.proceed && req.data) {
            await uploadEventData(req.data, req.url)
        }
    }

    private getIntegrationsObject () {
        return {
            capabilities: this._platformMeta?.caps,
            session_id: this._platformMeta?.sessionId,
            browser: this._platformMeta?.browserName,
            browser_version: this._platformMeta?.browserVersion,
            platform: this._platformMeta?.platformName,
            product: this._platformMeta?.product
        }
    }

    private getIdentifier (test: Frameworks.Test | ITestCaseHookParameter) {
        if ('pickle' in test) {
            return getUniqueIdentifierForCucumber(test)
        }
        return getUniqueIdentifier(test)
    }
}

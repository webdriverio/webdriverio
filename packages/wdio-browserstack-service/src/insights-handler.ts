import path from 'node:path'

import type { Capabilities, Frameworks } from '@wdio/types'
import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'

import { v4 as uuidv4 } from 'uuid'
import type { Pickle, ITestCaseHookParameter } from './cucumber-types.js'
import TestReporter from './reporter.js'

import {
    frameworkSupportsHook,
    getCloudProvider,
    getGitMetaData,
    getHookType,
    getScenarioExamples,
    getUniqueIdentifier,
    getUniqueIdentifierForCucumber,
    isBrowserstackSession,
    isScreenshotCommand,
    o11yClassErrorHandler,
    removeAnsiColors,
    sleep,
    uploadEventData
} from './util.js'
import type { TestData, TestMeta, PlatformMeta, UploadType } from './types.js'
import RequestQueueHandler from './request-handler.js'
import { DATA_SCREENSHOT_ENDPOINT, DEFAULT_WAIT_INTERVAL_FOR_PENDING_UPLOADS, DEFAULT_WAIT_TIMEOUT_FOR_PENDING_UPLOADS } from './constants.js'

class _InsightsHandler {
    private _tests: Record<string, TestMeta> = {}
    private _hooks: Record<string, string[]> = {}
    private _platformMeta: PlatformMeta
    private _commands: Record<string, BeforeCommandArgs & AfterCommandArgs> = {}
    private _gitConfigPath?: string
    private _suiteFile?: string
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

    setSuiteFile(filename: string) {
        this._suiteFile = filename
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
        if (!frameworkSupportsHook('before', this._framework)) {
            return
        }

        const fullTitle = getUniqueIdentifier(test, this._framework)

        const hookId = uuidv4()
        this._tests[fullTitle] = {
            uuid: hookId,
            startedAt: (new Date()).toISOString()
        }
        this.attachHookData(context, hookId)
        await this.sendTestRunEvent(test, 'HookRunStarted')
    }

    async afterHook (test: Frameworks.Test, result: Frameworks.TestResult) {
        if (!frameworkSupportsHook('after', this._framework)) {
            return
        }

        const fullTitle = getUniqueIdentifier(test, this._framework)
        if (this._tests[fullTitle]) {
            this._tests[fullTitle].finishedAt = (new Date()).toISOString()
        } else {
            this._tests[fullTitle] = {
                finishedAt: (new Date()).toISOString()
            }
        }
        await this.sendTestRunEvent(test, 'HookRunFinished', result)

        const hookType = getHookType(test.title)
        /*
            If any of the `beforeAll`, `beforeEach`, `afterEach` then the tests after the hook won't run in mocha (https://github.com/mochajs/mocha/issues/4392)
            So if any of this hook fails, then we are sending the next tests in the suite as skipped.
            This won't be needed for `afterAll`, as even if `afterAll` fails all the tests that we need are already run by then, so we don't need to send the stats for them separately
         */
        if (!result.passed && (hookType === 'BEFORE_EACH' || hookType === 'BEFORE_ALL' || hookType === 'AFTER_EACH')) {
            const sendTestSkip = async (skippedTest: any) => {

                // We only need to send the tests that whose state is not determined yet. The state of tests which is determined will already be sent.
                if (skippedTest.state === undefined) {
                    const fullTitle = `${skippedTest.parent.title} - ${skippedTest.title}`
                    this._tests[fullTitle] = {
                        uuid: uuidv4(),
                        startedAt: (new Date()).toISOString(),
                        finishedAt: (new Date()).toISOString()
                    }
                    await this.sendTestRunEvent(skippedTest, 'TestRunSkipped')
                }
            }

            /*
                Recursively send the tests as skipped for all suites below the hook. This is to handle nested describe blocks
             */
            const sendSuiteSkipped = async (suite: any) => {
                for (const skippedTest of suite.tests) {
                    await sendTestSkip(skippedTest)
                }
                for (const skippedSuite of suite.suites) {
                    await sendSuiteSkipped(skippedSuite)
                }
            }

            await sendSuiteSkipped(test.ctx.test.parent)
        }
    }

    async beforeTest (test: Frameworks.Test) {
        if (this._framework !== 'mocha') {
            return
        }
        const fullTitle = getUniqueIdentifier(test, this._framework)
        this._tests[fullTitle] = {
            uuid: uuidv4(),
            startedAt: (new Date()).toISOString()
        }
        await this.sendTestRunEvent(test, 'TestRunStarted')
    }

    async afterTest (test: Frameworks.Test, result: Frameworks.TestResult) {
        if (this._framework !== 'mocha') {
            return
        }
        const fullTitle = getUniqueIdentifier(test, this._framework)
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
        const testMeta = this._tests[identifier] || TestReporter.getTests()[identifier]

        if (!testMeta) {
            return
        }

        // log screenshot
        if (Boolean(process.env.BS_TESTOPS_ALLOW_SCREENSHOTS) && isScreenshotCommand(args) && args.result.value) {
            await uploadEventData([{
                event_type: 'LogCreated',
                logs: [{
                    test_run_uuid: testMeta.uuid,
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
                test_run_uuid: testMeta.uuid,
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
        if (context.currentTest && context.currentTest.parent) {
            const parentTest = `${context.currentTest.parent.title} - ${context.currentTest.title}`
            if (!this._hooks[parentTest]) {
                this._hooks[parentTest] = []
            }

            this._hooks[parentTest].push(hookId)
            return
        } else if (context.test) {
            const setHooksFromSuite = (parent: any): boolean => {
                for (const test of parent.tests) {
                    const uniqueIdentifier = getUniqueIdentifier(test, this._framework)
                    if (!this._hooks[uniqueIdentifier]) {
                        this._hooks[uniqueIdentifier] = []
                    }
                    this._hooks[uniqueIdentifier].push(hookId)
                    return true
                }

                for (const suite of parent.suites) {
                    const result = setHooksFromSuite(suite)
                    if (result) {
                        return true
                    }
                }
                return false
            }
            setHooksFromSuite(context.test.parent)
        }
    }

    /*
     * Get hierarchy info
     */
    private getHierarchy (test: Frameworks.Test) {
        const value: string[] = []
        if (test.ctx && test.ctx.test) {
            // If we already have the parent object, utilize it else get from context
            let parent = typeof test.parent === 'object' ? test.parent : test.ctx.test.parent
            while (parent && parent.title !== '') {
                value.push(parent.title)
                parent = parent.parent
            }
        } else if (test.description && test.fullName) {
            // for Jasmine
            value.push(test.description)
            value.push(test.fullName.replace(new RegExp(' ' + test.description + '$'), ''))
        }
        return value.reverse()
    }

    private async sendTestRunEvent (test: Frameworks.Test, eventType: string, results?: Frameworks.TestResult) {
        const fullTitle = getUniqueIdentifier(test, this._framework)
        const testMetaData = this._tests[fullTitle]

        const filename = test.file || this._suiteFile

        const testData: TestData = {
            uuid: testMetaData.uuid,
            type: test.type || 'test',
            name: test.title || test.description,
            body: {
                lang: 'webdriverio',
                code: test.body
            },
            scope: fullTitle,
            scopes: this.getHierarchy(test),
            identifier: fullTitle,
            file_name: filename ? path.relative(process.cwd(), filename) : undefined,
            location: filename ? path.relative(process.cwd(), filename) : undefined,
            vc_filepath: (this._gitConfigPath && filename) ? path.relative(this._gitConfigPath, filename) : undefined,
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

        if (eventType === 'TestRunStarted' || eventType === 'TestRunSkipped' || eventType === 'HookRunStarted') {
            testData.integrations = {}
            if (this._browser && this._platformMeta) {
                const provider = getCloudProvider(this._browser)
                testData.integrations[provider] = this.getIntegrationsObject()
            }
        }

        if (eventType === 'TestRunSkipped') {
            testData.result = 'skipped'
            eventType = 'TestRunFinished'
        }

        const uploadData: UploadType = {
            event_type: eventType,
        }

        /* istanbul ignore if */
        if (eventType.match(/HookRun/)) {
            testData.hook_type = testData.name?.toLowerCase() ? getHookType(testData.name.toLowerCase()) : 'undefined'
            testData.test_run_id = this.getTestRunId(test.ctx)
            uploadData.hook_run = testData
        } else {
            uploadData.test_run = testData
        }

        const req = this._requestQueueHandler.add(uploadData)
        if (req.proceed && req.data) {
            await uploadEventData(req.data, req.url)
        }
    }

    getTestRunId(context: any): string|undefined {
        if (!context) {return}

        if (context.currentTest) {
            const uniqueIdentifier = getUniqueIdentifier(context.currentTest, this._framework)
            return this._tests[uniqueIdentifier] && this._tests[uniqueIdentifier].uuid
        }

        if (!context.test) {
            return
        }

        const getTestRunIdFromSuite = (parent: any): string|undefined => {
            for (const test of parent.tests) {
                const uniqueIdentifier = getUniqueIdentifier(test, this._framework)
                if (this._tests[uniqueIdentifier]) {
                    return this._tests[uniqueIdentifier].uuid
                }
            }

            for (const suite of parent.suites) {
                const testRunId: string|undefined = getTestRunIdFromSuite(suite)
                if (testRunId) {
                    return testRunId
                }
            }
            return
        }
        return getTestRunIdFromSuite(context.test.parent)
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
            file_name: feature && feature.path ? path.relative(process.cwd(), feature.path) : undefined,
            location: feature && feature.path ? path.relative(process.cwd(), feature.path) : undefined,
            vc_filepath: (this._gitConfigPath && feature?.path) ? path.relative(this._gitConfigPath, feature?.path) : undefined,
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
        return getUniqueIdentifier(test, this._framework)
    }
}

// https://github.com/microsoft/TypeScript/issues/6543
const InsightsHandler: typeof _InsightsHandler = o11yClassErrorHandler(_InsightsHandler)
type InsightsHandler = _InsightsHandler

export default InsightsHandler


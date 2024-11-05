import path from 'node:path'

import type { Frameworks, Options } from '@wdio/types'
import type { BeforeCommandArgs, AfterCommandArgs } from '@wdio/reporter'

import { v4 as uuidv4 } from 'uuid'
import type { CucumberStore, Feature, Scenario, Step, FeatureChild, CucumberHook, CucumberHookParams, Pickle, ITestCaseHookParameter } from './cucumber-types.js'
import TestReporter from './reporter.js'

import type { BrowserstackConfig } from './types.js'

import {
    frameworkSupportsHook,
    getCloudProvider, getFailureObject,
    getGitMetaData,
    getHookType, getPlatformVersion,
    getScenarioExamples,
    getUniqueIdentifier,
    getUniqueIdentifierForCucumber,
    isBrowserstackSession,
    isScreenshotCommand,
    isUndefined,
    o11yClassErrorHandler,
    removeAnsiColors,
    getObservabilityProduct
} from './util.js'
import type {
    TestData,
    TestMeta,
    PlatformMeta,
    CurrentRunInfo,
    StdLog,
    CBTData
} from './types.js'
import { BStackLogger } from './bstackLogger.js'
import type { Capabilities } from '@wdio/types'
import Listener from './testOps/listener.js'
import { TESTOPS_SCREENSHOT_ENV } from './constants.js'

class _InsightsHandler {
    private _tests: Record<string, TestMeta> = {}
    private _hooks: Record<string, string[]> = {}
    private _platformMeta: PlatformMeta
    private _commands: Record<string, BeforeCommandArgs | AfterCommandArgs> = {}
    private _gitConfigPath?: string
    private _suiteFile?: string
    public static currentTest: CurrentRunInfo = {}
    private _currentHook: CurrentRunInfo = {}
    private _cucumberData: CucumberStore = {
        stepsStarted: false,
        scenariosStarted: false,
        steps: []
    }
    private _userCaps?: Capabilities.RemoteCapability = {}
    private listener = Listener.getInstance()
    public currentTestId: string | undefined
    public cbtQueue: Array<CBTData> = []

    constructor (private _browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, private _framework?: string, _userCaps?: Capabilities.RemoteCapability, _options?: BrowserstackConfig & Options.Testrunner) {
        const caps = (this._browser as WebdriverIO.Browser).capabilities as WebdriverIO.Capabilities
        const sessionId = (this._browser as WebdriverIO.Browser).sessionId

        this._userCaps = _userCaps

        this._platformMeta = {
            browserName: caps.browserName,
            browserVersion: caps?.browserVersion,
            platformName: caps?.platformName,
            caps: caps,
            sessionId,
            product: getObservabilityProduct(_options, this._isAppAutomate())
        }

        this.registerListeners()
    }

    _isAppAutomate(): boolean {
        const browserDesiredCapabilities = (this._browser?.capabilities ?? {}) as Capabilities.DesiredCapabilities
        const desiredCapabilities = (this._userCaps ?? {})  as Capabilities.DesiredCapabilities
        return !!browserDesiredCapabilities['appium:app'] || !!desiredCapabilities['appium:app'] || !!(( desiredCapabilities as any)['appium:options']?.app)
    }

    registerListeners() {
        if (!(this._framework === 'mocha' || this._framework === 'cucumber')) {
            return
        }
        process.removeAllListeners(`bs:addLog:${process.pid}`)
        process.on(`bs:addLog:${process.pid}`, this.appendTestItemLog.bind(this))
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

    getCucumberHookType(test: CucumberHook|undefined) {
        let hookType = null
        if (!test) {
            hookType = this._cucumberData.scenariosStarted ? 'AFTER_ALL' : 'BEFORE_ALL'
        } else if (!this._cucumberData.stepsStarted) {
            hookType = 'BEFORE_EACH'
        } else if (this._cucumberData.steps?.length > 0) {
            // beforeStep or afterStep
        } else {
            hookType = 'AFTER_EACH'
        }
        return hookType
    }

    getCucumberHookName(hookType: string|undefined): string {
        switch (hookType) {
        case 'BEFORE_EACH':
        case 'AFTER_EACH':
            return `${hookType} for ${this._cucumberData.scenario?.name}`
        case 'BEFORE_ALL':
        case 'AFTER_ALL':
            return `${hookType} for ${this._cucumberData.feature?.name}`
        }
        return ''
    }

    getCucumberHookUniqueId(hookType: string, hook: CucumberHook|undefined): string|null {
        switch (hookType) {
        case 'BEFORE_EACH':
        case 'AFTER_EACH':
            return (hook as CucumberHook).hookId
        case 'BEFORE_ALL':
        case 'AFTER_ALL':
            // Can only work for single beforeAll or afterAll
            return `${hookType} for ${this.getCucumberFeatureUniqueId()}`
        }
        return null
    }

    getCucumberFeatureUniqueId() {
        const { uri, feature } = this._cucumberData
        return `${uri}:${feature?.name}`
    }

    setCurrentHook(hookDetails: CurrentRunInfo) {
        if (hookDetails.finished) {
            if (this._currentHook.uuid === hookDetails.uuid) {
                this._currentHook.finished = true
            }
            return
        }
        this._currentHook = {
            uuid: hookDetails.uuid,
            finished: false
        }
    }

    async sendScenarioObjectSkipped(scenario: Scenario, feature: Feature, uri: string) {
        const testMetaData: TestMeta = {
            uuid: uuidv4(),
            startedAt: (new Date()).toISOString(),
            finishedAt: (new Date()).toISOString(),
            scenario: {
                name: scenario.name
            },
            feature: {
                path: uri,
                name: feature.name,
                description: feature.description
            },
            steps: scenario.steps.map((step: Step) => {
                return {
                    id: step.id,
                    text: step.text,
                    keyword: step.keyword,
                    result: 'skipped',
                }
            }),
        }
        this.listener.testFinished(this.getTestRunDataForCucumber(null, 'TestRunSkipped', testMetaData))
    }

    async processCucumberHook(test: CucumberHook|undefined, params: CucumberHookParams, result?: Frameworks.TestResult) {
        const hookType = this.getCucumberHookType(test)
        if (!hookType) {
            return
        }

        const { event, hookUUID } = params
        const hookId = this.getCucumberHookUniqueId(hookType, test)
        if (!hookId) {
            return
        }
        if (event === 'before') {
            this.setCurrentHook({ uuid: hookUUID })
            const hookMetaData = {
                uuid: hookUUID,
                startedAt: (new Date()).toISOString(),
                testRunId: InsightsHandler.currentTest.uuid,
                hookType: hookType
            }

            this._tests[hookId] = hookMetaData
            this.listener.hookStarted(this.getHookRunDataForCucumber(hookMetaData, 'HookRunStarted'))
        } else {
            this._tests[hookId].finishedAt = (new Date()).toISOString()
            this.setCurrentHook({ uuid: this._tests[hookId].uuid, finished: true })
            this.listener.hookFinished(this.getHookRunDataForCucumber(this._tests[hookId], 'HookRunFinished', result))

            if (hookType === 'BEFORE_ALL' && result && !result.passed) {
                const { feature, uri } = this._cucumberData
                if (!feature) {
                    return
                }
                feature.children.map(async (childObj: FeatureChild) => {
                    if (childObj.rule) {
                        childObj.rule.children.map(async (scenarioObj: FeatureChild) => {
                            if (scenarioObj.scenario) {
                                await this.sendScenarioObjectSkipped(scenarioObj.scenario, feature, uri as string)
                            }
                        })
                    } else if (childObj.scenario) {
                        await this.sendScenarioObjectSkipped(childObj.scenario, feature, uri as string)
                    }
                })
            }
        }
    }

    async beforeHook (test: Frameworks.Test|CucumberHook|undefined, context: any) {
        if (!frameworkSupportsHook('before', this._framework)) {
            return
        }
        const hookUUID = uuidv4()

        if (this._framework === 'cucumber') {
            test = test as CucumberHook|undefined
            await this.processCucumberHook(test, { event: 'before', hookUUID })
            return
        }

        test = test as Frameworks.Test
        const fullTitle = getUniqueIdentifier(test, this._framework)

        this._tests[fullTitle] = {
            uuid: hookUUID,
            startedAt: (new Date()).toISOString()
        }
        this.setCurrentHook({ uuid: hookUUID })
        this.attachHookData(context, hookUUID)
        this.listener.hookStarted(this.getRunData(test, 'HookRunStarted'))
    }

    async afterHook (test: Frameworks.Test|CucumberHook|undefined, result: Frameworks.TestResult) {
        if (!frameworkSupportsHook('after', this._framework)) {
            return
        }
        if (this._framework === 'cucumber') {
            await this.processCucumberHook(test as CucumberHook|undefined, { event: 'after' }, result)
            return
        }

        test = test as Frameworks.Test
        const fullTitle = getUniqueIdentifier(test as Frameworks.Test, this._framework)
        if (this._tests[fullTitle]) {
            this._tests[fullTitle].finishedAt = (new Date()).toISOString()
        } else {
            this._tests[fullTitle] = {
                finishedAt: (new Date()).toISOString()
            }
        }

        this.setCurrentHook({ uuid: this._tests[fullTitle].uuid, finished: true })
        this.listener.hookFinished(this.getRunData(test, 'HookRunFinished', result))

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
                    this.listener.testFinished(this.getRunData(skippedTest, 'TestRunSkipped'))
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

    public getHookRunDataForCucumber (hookData: TestMeta, eventType: string, result?: Frameworks.TestResult) {
        const { uri, feature } = this._cucumberData

        const testData: TestData = {
            uuid: hookData.uuid,
            type: 'hook',
            name: this.getCucumberHookName(hookData.hookType),
            body: {
                lang: 'webdriverio',
                code: null
            },
            started_at: hookData.startedAt,
            finished_at: hookData.finishedAt,
            hook_type: hookData.hookType,
            test_run_id: hookData.testRunId,
            scope: feature?.name,
            scopes: [feature?.name || ''],
            file_name: uri ? path.relative(process.cwd(), uri) : undefined,
            location: uri ? path.relative(process.cwd(), uri) : undefined,
            vc_filepath: (this._gitConfigPath && uri) ? path.relative(this._gitConfigPath, uri) : undefined,
            result: 'pending',
            framework: this._framework
        }

        if (eventType === 'HookRunFinished' && result) {
            testData.result = result.passed ? 'passed' : 'failed'
            testData.retries = result.retries
            testData.duration_in_ms = result.duration

            if (!result.passed) {
                Object.assign(testData, getFailureObject(result.error))
            }
        }

        if (eventType === 'HookRunStarted') {
            testData.integrations = {}
            if (this._browser && this._platformMeta) {
                const provider = getCloudProvider(this._browser)
                testData.integrations[provider] = this.getIntegrationsObject()
            }
        }

        return testData
    }

    async beforeTest (test: Frameworks.Test) {
        const uuid = uuidv4()
        InsightsHandler.currentTest = {
            test, uuid
        }
        if (this._framework !== 'mocha') {
            return
        }
        const fullTitle = getUniqueIdentifier(test, this._framework)
        this._tests[fullTitle] = {
            uuid,
            startedAt: (new Date()).toISOString()
        }
        this.listener.testStarted(this.getRunData(test, 'TestRunStarted'))
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
        BStackLogger.debug('calling testFinished')
        this.flushCBTDataQueue()
        this.listener.testFinished(this.getRunData(test, 'TestRunFinished', result))
    }

    /**
      * Cucumber Only
      */

    async beforeFeature(uri: string, feature: Feature) {
        this._cucumberData.scenariosStarted = false
        this._cucumberData.feature = feature
        this._cucumberData.uri = uri
    }

    async beforeScenario (world: ITestCaseHookParameter) {
        const uuid = uuidv4()
        InsightsHandler.currentTest = {
            uuid
        }
        this._cucumberData.scenario = world.pickle
        this._cucumberData.scenariosStarted = true
        this._cucumberData.stepsStarted = false
        const pickleData = world.pickle
        const gherkinDocument = world.gherkinDocument
        const featureData = gherkinDocument.feature
        const uniqueId = getUniqueIdentifierForCucumber(world)
        const testMetaData: TestMeta = {
            uuid: uuid,
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
        this.listener.testStarted(this.getTestRunDataForCucumber(world, 'TestRunStarted'))
    }

    async afterScenario (world: ITestCaseHookParameter) {
        this._cucumberData.scenario = undefined
        this.flushCBTDataQueue()
        this.listener.testFinished(this.getTestRunDataForCucumber(world, 'TestRunFinished'))
    }

    async beforeStep (step: Frameworks.PickleStep, scenario: Pickle) {
        this._cucumberData.stepsStarted = true
        this._cucumberData.steps.push(step)
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
        this._cucumberData.steps.pop()

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

    /**
     * misc methods
     */

    appendTestItemLog = async (stdLog: StdLog) => {
        try {
            if (this._currentHook.uuid && !this._currentHook.finished && (this._framework === 'mocha' || this._framework === 'cucumber')) {
                stdLog.hook_run_uuid = this._currentHook.uuid
            } else if (InsightsHandler.currentTest.uuid && (this._framework === 'mocha' || this._framework === 'cucumber')) {
                stdLog.test_run_uuid = InsightsHandler.currentTest.uuid
            }
            if (stdLog.hook_run_uuid || stdLog.test_run_uuid) {
                this.listener.logCreated([stdLog])
            }
        } catch (error) {
            BStackLogger.debug(`Exception in uploading log data to Observability with error : ${error}`)
        }
    }

    async browserCommand (commandType: string, args: BeforeCommandArgs | AfterCommandArgs, test?: Frameworks.Test | ITestCaseHookParameter) {
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
        const body = 'body' in args ? args.body : undefined
        const result = 'result' in args ? args.result : undefined
        if (Boolean(process.env[TESTOPS_SCREENSHOT_ENV]) && isScreenshotCommand(args) && result?.value) {
            await this.listener.onScreenshot([{
                test_run_uuid: testMeta.uuid,
                timestamp: new Date().toISOString(),
                message: result.value,
                kind: 'TEST_SCREENSHOT'
            }])
        }

        const requestData = this._commands[dataKey]
        if (!requestData) {
            return
        }

        // log http request
        this.listener.logCreated([{
            test_run_uuid: testMeta.uuid,
            timestamp: new Date().toISOString(),
            kind: 'HTTP',
            http_response: {
                path: requestData.endpoint,
                method: requestData.method,
                body,
                response: result
            }
        }])
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
            this.setHooksFromSuite(context.test.parent, hookId)
        }
    }

    private setHooksFromSuite(parent: any, hookId: string): boolean {
        if (!parent) {
            return false
        }

        if (parent.tests && parent.tests.length > 0) {
            const uniqueIdentifier = getUniqueIdentifier(parent.tests[0], this._framework)
            if (!this._hooks[uniqueIdentifier]) {
                this._hooks[uniqueIdentifier] = []
            }
            this._hooks[uniqueIdentifier].push(hookId)
            return true
        }

        for (const suite of parent.suites) {
            const result = this.setHooksFromSuite(suite, hookId)
            if (result) {
                return true
            }
        }
        return false
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

    private getRunData (test: Frameworks.Test, eventType: string, results?: Frameworks.TestResult): TestData {
        const fullTitle = getUniqueIdentifier(test, this._framework)
        const testMetaData = this._tests[fullTitle]

        const filename = test.file || this._suiteFile
        this.currentTestId = testMetaData.uuid

        if (eventType === 'TestRunStarted') {
            InsightsHandler.currentTest.name = test.title || test.description
        }

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
                    testData.failure_type = isUndefined(error.message) ? null : error.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError' //verify if this is working
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

        /* istanbul ignore if */
        if (eventType.match(/HookRun/)) {
            testData.hook_type = testData.name?.toLowerCase() ? getHookType(testData.name.toLowerCase()) : 'undefined'
            testData.test_run_id = this.getTestRunId(test.ctx)
        }

        return testData
    }

    private getTestRunId(context: any): string|undefined {
        if (!context) {
            return
        }

        if (context.currentTest) {
            const uniqueIdentifier = getUniqueIdentifier(context.currentTest, this._framework)
            return this._tests[uniqueIdentifier] && this._tests[uniqueIdentifier].uuid
        }

        if (!context.test) {
            return
        }
        return this.getTestRunIdFromSuite(context.test.parent)
    }

    private getTestRunIdFromSuite(parent: any): string|undefined {
        if (!parent) {
            return
        }
        for (const test of parent.tests) {
            const uniqueIdentifier = getUniqueIdentifier(test, this._framework)
            if (this._tests[uniqueIdentifier]) {
                return this._tests[uniqueIdentifier].uuid
            }
        }

        for (const suite of parent.suites) {
            const testRunId: string|undefined = this.getTestRunIdFromSuite(suite)
            if (testRunId) {
                return testRunId
            }
        }
        return
    }

    private getTestRunDataForCucumber (worldObj: ITestCaseHookParameter|null, eventType: string, testMetaData: TestMeta|null = null) {
        const world: ITestCaseHookParameter = worldObj as ITestCaseHookParameter
        const dataHub = testMetaData ? testMetaData : (this._tests[getUniqueIdentifierForCucumber((world as ITestCaseHookParameter))] || {})
        const { feature, scenario, steps, uuid, startedAt, finishedAt } = dataHub

        const examples = !testMetaData ? getScenarioExamples(world as ITestCaseHookParameter) : undefined
        let fullNameWithExamples: string
        if (!testMetaData) {
            fullNameWithExamples = examples
                ? world.pickle.name + ' (' + examples.join(', ')  + ')'
                : world.pickle.name
        } else {
            fullNameWithExamples = scenario?.name || ''
        }

        this.currentTestId = uuid

        if (eventType === 'TestRunStarted') {
            InsightsHandler.currentTest.name = fullNameWithExamples
        }

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

        if (eventType === 'TestRunStarted' || eventType === 'TestRunSkipped') {
            testData.integrations = {}
            if (this._browser && this._platformMeta) {
                const provider = getCloudProvider(this._browser)
                testData.integrations[provider] = this.getIntegrationsObject()
            }
        }

        /* istanbul ignore if */
        if (world?.result) {
            let result = world.result.status.toLowerCase()
            if (result !== 'passed' && result !== 'failed') {
                result = 'skipped' // mark UNKNOWN/UNDEFINED/AMBIGUOUS/PENDING as skipped
            }
            testData.finished_at = (new Date()).toISOString()
            testData.result = result
            testData.duration_in_ms = world.result.duration.seconds * 1000 + world.result.duration.nanos / 1000000 // send duration in ms

            if (result === 'failed') {
                testData.failure = [
                    {
                        'backtrace': [world.result.message ? removeAnsiColors(world.result.message) : 'unknown']
                    }
                ]
                testData.failure_reason = world.result.message ? removeAnsiColors(world.result.message) : world.result.message
                if (world.result.message) {
                    testData.failure_type = world.result.message.match(/AssertionError/)
                        ? 'AssertionError'
                        : 'UnhandledError'
                }
            }
        }

        if (world?.pickle) {
            testData.tags = world.pickle.tags.map( ({ name }: { name: string }) => (name) )
        }

        if (eventType === 'TestRunSkipped') {
            testData.result = 'skipped'
            eventType = 'TestRunFinished'
        }

        return testData
    }

    public async flushCBTDataQueue() {
        if (isUndefined(this.currentTestId)) {return}
        this.cbtQueue.forEach(cbtData => {
            cbtData.uuid = this.currentTestId!
            this.listener.cbtSessionCreated(cbtData)
        })
        this.currentTestId = undefined // set undefined for next test
    }

    async sendCBTInfo() {
        const integrationsData: any = {}

        if (this._browser && this._platformMeta) {
            const provider = getCloudProvider(this._browser)
            integrationsData[provider] = this.getIntegrationsObject()
        }

        const cbtData: CBTData = {
            uuid: '',
            integrations: integrationsData
        }

        if (this.currentTestId !== undefined) {
            cbtData.uuid = this.currentTestId
            this.listener.cbtSessionCreated(cbtData)
        } else {
            this.cbtQueue.push(cbtData)
        }
    }

    private getIntegrationsObject () {
        const caps = (this._browser as WebdriverIO.Browser)?.capabilities as WebdriverIO.Capabilities
        const sessionId = (this._browser as WebdriverIO.Browser)?.sessionId

        return {
            capabilities: caps,
            session_id: sessionId,
            browser: caps?.browserName,
            browser_version: caps?.browserVersion,
            platform: caps?.platformName,
            product: this._platformMeta?.product,
            platform_version: getPlatformVersion(this._userCaps as WebdriverIO.Capabilities)
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


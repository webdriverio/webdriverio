import { Capabilities, Frameworks } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'
import type { Pickle } from '@cucumber/messages'
import { ITestCaseHookParameter } from '@cucumber/cucumber/lib/support_code_library_builder/types'

import { v4 as uuidv4 } from 'uuid'

import { getCloudProvider, getGitMetaData, getScenarioExamples, getUniqueIdentifier, getUniqueIdentifierForCucumber, isBrowserstackSession, removeAnsiColors, uploadEventData } from './util'
import { TestData, TestMeta, PlatformMeta } from './types'
import path from 'path'

export default class InsightsHandler {

    private _browser?: Browser<'async'> | MultiRemoteBrowser<'async'>
    private _tests: { [index: string]: TestMeta }
    private _hooks: { [index: string]: string[] }
    private _platformMeta?: PlatformMeta
    private _framework?: string
    private _commands: { [index: string]: any }
    private _gitConfigPath?: string

    constructor (framework?: string) {
        this._tests = {}
        this._hooks = {}
        this._commands = {}
        this._framework = framework
    }

    async setUp(browser?: Browser<'async'> | MultiRemoteBrowser<'async'>, browserCaps?: Capabilities.Capabilities, isAppAutomate?: boolean, sessionId?: string) {
        this._browser = browser

        if (this._browser) {
            this._platformMeta = {
                browserName: browserCaps?.browserName,
                browserVersion: browserCaps?.browserVersion,
                platformName: browserCaps?.platformName,
                caps: browserCaps,
                sessionId: sessionId,
                product: isAppAutomate ? 'app-automate' : 'automate'
            }

            if (isBrowserstackSession(this._browser)) {
                this._browser.execute(`browserstack_executor: {"action": "annotate", "arguments": {"data": "ObservabilitySync:${Date.now()}","level": "debug"}}`)
            }
        }

        const gitMeta = await getGitMetaData()
        if (gitMeta) {
            this._gitConfigPath = gitMeta['root']
        }
    }

    async beforeHook(test: Frameworks.Test, context: any) {
        const fullTitle = `${test.parent} - ${test.title}`
        const hookId = uuidv4()
        this._tests[fullTitle] = {
            uuid: hookId,
            startedAt: (new Date()).toISOString()
        }
        this._attachHookData(context, hookId)
        if (this._framework == 'mocha') await this._sendTestRunEvent(test, 'HookRunStarted')
    }

    async afterHook(test: Frameworks.Test, context: any, result: Frameworks.TestResult) {
        const fullTitle = getUniqueIdentifier(test)
        if (this._tests[fullTitle]) {
            this._tests[fullTitle]['finishedAt'] = (new Date()).toISOString()
        } else {
            this._tests[fullTitle] = {
                finishedAt: (new Date()).toISOString()
            }
        }
        if (this._framework == 'mocha') await this._sendTestRunEvent(test, 'HookRunFinished', result)
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async beforeTest(test: Frameworks.Test, context: any) {
        const fullTitle = getUniqueIdentifier(test)
        this._tests[fullTitle] = {
            uuid: uuidv4(),
            startedAt: (new Date()).toISOString()
        }
        await this._sendTestRunEvent(test, 'TestRunStarted')
    }

    async afterTest(test: Frameworks.Test, context: never, result: Frameworks.TestResult) {
        const fullTitle = getUniqueIdentifier(test)
        if (this._tests[fullTitle]) {
            this._tests[fullTitle]['finishedAt'] = (new Date()).toISOString()
        } else {
            this._tests[fullTitle] = {
                finishedAt: (new Date()).toISOString()
            }
        }
        await this._sendTestRunEvent(test, 'TestRunFinished', result)
    }

    // Cucumber Only

    async beforeScenario (world: ITestCaseHookParameter) {
        let pickleData = world.pickle
        const gherkinDocument = world.gherkinDocument
        const featureData = gherkinDocument.feature

        const uniqueId = getUniqueIdentifierForCucumber(world)

        let testMetaData: TestMeta = {
            uuid: uuidv4(),
            startedAt: (new Date()).toISOString()
        }

        if (pickleData) {
            testMetaData['scenario'] = {
                name: pickleData.name,
            }
        }

        if (gherkinDocument && featureData) {
            testMetaData['feature'] = {
                path: gherkinDocument.uri,
                name: featureData.name,
                description: featureData.description,
            }
        }

        this._tests[uniqueId] = testMetaData

        await this._sendTestRunEventForCucumber(world, 'TestRunStarted')
    }

    async afterScenario (world: ITestCaseHookParameter) {
        await this._sendTestRunEventForCucumber(world, 'TestRunFinished')
    }

    beforeStep (step: Frameworks.PickleStep, scenario: Pickle) {
        const uniqueId = getUniqueIdentifierForCucumber({ pickle: scenario } as any)
        let testMetaData = this._tests[uniqueId]
        if (!testMetaData) {
            testMetaData = {
                steps: []
            }
        }

        if (testMetaData && !testMetaData['steps']) {
            testMetaData['steps'] = []
        }

        testMetaData['steps']?.push({
            id: step.id,
            text: step.text,
            keyword: step.keyword,
            started_at: (new Date()).toISOString()
        })

        this._tests[uniqueId] = testMetaData
    }

    afterStep (step: Frameworks.PickleStep, scenario: Pickle, result: Frameworks.PickleResult) {
        const uniqueId = getUniqueIdentifierForCucumber({ pickle: scenario } as any)
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
            let stepDetails = testMetaData['steps']?.find((item: any) => item.id == step.id)
            if (stepDetails) {
                stepDetails.finished_at = (new Date()).toISOString()
                stepDetails.result = result.passed ? 'PASSED' : 'FAILED'
                stepDetails.duration = result.duration
                stepDetails.failure = result.error ? removeAnsiColors(result.error) : result.error
            }
        }

        this._tests[uniqueId] = testMetaData
    }

    // misc methods

    async afterCommand(commandName: string, args: any[], result: any, error?: Error, test?: any) {
        if (test && commandName == 'takeScreenshot') {
            const identifier = this.getIdentifier(test)
            let log = {
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

    async browserCommand(commandType: string, args: any, test?: any) {
        if (commandType == 'client:beforeCommand') {
            this._commands[`${args.sessionId}_${args.method}_${args.endpoint}`] = args
        } else {
            if (test == undefined) return

            const dataKey = `${args.sessionId}_${args.method}_${args.endpoint}`
            const requestData = this._commands[dataKey]
            const identifier = this.getIdentifier(test)

            let log = {
                test_run_uuid: this._tests[identifier].uuid,
                timestamp: new Date().toISOString(),
                kind: 'HTTP',
                http_response: {
                    path: requestData.endpoint,
                    method: requestData.method,
                    body: requestData.body,
                    response: args.result
                }
            }

            await uploadEventData({
                event_type: 'LogCreated',
                logs: [log]
            })
        }
    }

    // private methods

    private _getHookType(hookName: string): string {
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

    private _attachHookData(context: any, hookId: string): void {
        if (context.currentTest && context.currentTest.parent) {
            const parentTest = `${context.currentTest.parent.title} - ${context.currentTest.title}`
            if (this._hooks[parentTest]) {
                this._hooks[parentTest].push(hookId)
            } else {
                this._hooks[parentTest] = [hookId]
            }
        }
    }

    /*
     * Get hierarchy info
     */
    private getHierarchy(test: Frameworks.Test) {
        let value: any[] = []
        if (test.ctx && test.ctx.test) {
            let parent = test.ctx.test.parent
            while (parent && parent.title !== '') {
                value.push(parent.title)
                parent = parent.parent
            }
            return value.reverse()
        }
        return value.reverse()
    }

    private async _sendTestRunEvent (test: Frameworks.Test, eventType: string, results?: Frameworks.TestResult) {
        const fullTitle = getUniqueIdentifier(test)
        let testMetaData = this._tests[fullTitle]

        let testData: TestData = {
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
            testData['integrations'] = {}
            if (this._browser && this._platformMeta) testData['integrations'][getCloudProvider(this._browser)] = this.getIntegrationsObject()
        }

        let uploadData: any = {
            event_type: eventType,
        }

        if (eventType.match(/HookRun/)) {
            testData['hook_type'] = testData.name?.toLowerCase() ? this._getHookType(testData.name.toLowerCase()) : 'undefined'
            uploadData['hook_run'] = testData
        } else {
            uploadData['test_run'] = testData
        }
        await uploadEventData(uploadData)
    }

    private async _sendTestRunEventForCucumber (world: ITestCaseHookParameter, eventType: string) {
        const uniqueId = getUniqueIdentifierForCucumber(world)

        let testMetaData = this._tests[uniqueId]
        if (!testMetaData) testMetaData = {}

        const { feature, scenario, steps } = testMetaData

        let fullNameWithExamples = world.pickle.name
        const examples = getScenarioExamples(world)
        if (examples) {
            fullNameWithExamples = world.pickle.name + ' (' + examples.join(', ')  + ')'
        }

        let testData: TestData = {
            uuid: testMetaData.uuid,
            started_at: testMetaData.startedAt,
            finished_at: testMetaData.finishedAt,
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

        if (eventType == 'TestRunStarted') {
            testData['integrations'] = {}
            if (this._browser && this._platformMeta) testData['integrations'][getCloudProvider(this._browser)] = this.getIntegrationsObject()
        }

        if (world.result) {
            let result: string = world.result.status.toLowerCase()
            if (result !== 'passed' && result !== 'failed') result = 'skipped' // mark UNKNOWN/UNDEFINED/AMBIGUOUS/PENDING as skipped
            testData['finished_at'] = (new Date()).toISOString()
            testData['result'] = result
            testData['duration_in_ms'] = world.result.duration.nanos / 1000000 // send duration in ms

            if (result == 'failed') {
                testData['failure'] = [
                    {
                        'backtrace': [world.result.message ? removeAnsiColors(world.result.message) : 'unknown']
                    }
                ],
                testData['failure_reason'] = world.result.message ? removeAnsiColors(world.result.message) : world.result.message,
                testData['failure_type'] = world.result.message == undefined ? null : world.result.message.toString().match(/AssertionError/) ? 'AssertionError' : 'UnhandledError'
            }
        }

        if (world.pickle) {
            testData['tags'] = world.pickle.tags.map( ({ name }: { name: string }) => (name) )
        }

        let uploadData: any = {
            event_type: eventType,
            test_run: testData
        }
        await uploadEventData(uploadData)
    }

    private getIntegrationsObject() {
        return {
            'capabilities': this._platformMeta?.caps,
            'session_id': this._platformMeta?.sessionId,
            'browser': this._platformMeta?.browserName,
            'browser_version': this._platformMeta?.browserVersion,
            'platform': this._platformMeta?.platformName,
            'product': this._platformMeta?.product
        }
    }

    private getIdentifier(test: any) {
        if ('pickle' in test) {
            return getUniqueIdentifierForCucumber(test)
        }
        return getUniqueIdentifier(test)
    }
}

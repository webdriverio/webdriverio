import { createRequire } from 'node:module'
import { stringify } from 'csv-stringify/sync'
import type {
    SuiteStats, Tag, HookStats, RunnerStats, TestStats, BeforeCommandArgs,
    AfterCommandArgs, CommandArgs, Argument
} from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import type { Capabilities, Options } from '@wdio/types'

import {
    addFeature, addLabel, addSeverity, addIssue, addTestId, addStory, addEnvironment,
    addDescription, addAttachment, startStep, endStep, addStep, addArgument
} from './common/api.js'
import {
    getTestStatus, isEmpty, isMochaEachHooks, getErrorFromFailedTest,
    isMochaAllHooks, getLinkByTemplate, attachConsoleLogs
} from './utils.js'
import { events, PASSED, PENDING, SKIPPED, stepStatuses } from './constants.js'
import type {
    AddAttachmentEventArgs, AddDescriptionEventArgs, AddEnvironmentEventArgs,
    AddFeatureEventArgs, AddIssueEventArgs, AddLabelEventArgs, AddSeverityEventArgs,
    AddStoryEventArgs, AddTestIdEventArgs, Status, AllureReporterOptions
} from './types.js'

const require = createRequire(import.meta.url)

/**
 * Allure v1 has no proper TS support
 * ToDo(Christian): update to Allure v2 (https://github.com/webdriverio/webdriverio/issues/6313)
 */
const Allure = require('allure-js-commons')
const Step = require('allure-js-commons/beans/step.js')

export default class AllureReporter extends WDIOReporter {
    private _allure: any
    private _capabilities: Capabilities.RemoteCapability
    private _isMultiremote?: boolean
    private _config?: Options.Testrunner
    private _lastScreenshot?: string
    private _options: AllureReporterOptions
    private _consoleOutput: string
    private _originalStdoutWrite: Function
    private _addConsoleLogs: boolean
    private _startedFeatures: SuiteStats[] = []

    constructor(options: AllureReporterOptions = {}) {
        const outputDir = options.outputDir || 'allure-results'
        super({
            ...options,
            outputDir,
        })
        this._addConsoleLogs = false
        this._consoleOutput = ''
        this._originalStdoutWrite = process.stdout.write.bind(process.stdout)
        this._allure = new Allure()
        this._capabilities = {}
        this._options = options

        this._allure.setOptions({ targetDir: outputDir })
        this.registerListeners()

        this._lastScreenshot = undefined

        const processObj:any = process
        if (options.addConsoleLogs || this._addConsoleLogs) {
            processObj.stdout.write = (chunk: string, encoding: BufferEncoding, callback:  ((err?: Error) => void)) => {
                if (typeof chunk === 'string' && !chunk.includes('mwebdriver')) {
                    this._consoleOutput += chunk
                }
                return this._originalStdoutWrite(chunk, encoding, callback)
            }
        }
    }

    registerListeners() {
        process.on(events.addLabel, this.addLabel.bind(this))
        process.on(events.addFeature, this.addFeature.bind(this))
        process.on(events.addStory, this.addStory.bind(this))
        process.on(events.addSeverity, this.addSeverity.bind(this))
        process.on(events.addIssue, this.addIssue.bind(this))
        process.on(events.addTestId, this.addTestId.bind(this))
        process.on(events.addEnvironment, this.addEnvironment.bind(this))
        process.on(events.addAttachment, this.addAttachment.bind(this))
        process.on(events.addDescription, this.addDescription.bind(this))
        process.on(events.startStep, this.startStep.bind(this))
        process.on(events.endStep, this.endStep.bind(this))
        process.on(events.addStep, this.addStep.bind(this))
        process.on(events.addArgument, this.addArgument.bind(this))
    }

    onRunnerStart(runner: RunnerStats) {
        this._config = runner.config
        this._capabilities = runner.capabilities
        this._isMultiremote = runner.isMultiremote || false
    }

    onSuiteStart(suite: SuiteStats) {
        const isFeature = suite.type === 'feature'

        if (!this._options.useCucumberStepReporter) {
            const currentSuite = this._allure.getCurrentSuite()
            const prefix = currentSuite ? currentSuite.name + ': ' : ''

            this._allure.startSuite(prefix + suite.title)
            return
        }

        // handle cucumber features as allure "suite"
        if (isFeature) {
            // temp solution to keep suites stats index for saving allure test ops feature based structure
            this._startedFeatures.push(suite)
            this._allure.startSuite(suite.title)
            return
        }

        // handle cucumber scenario as allure "case" instead of "suite"
        this._allure.startCase(suite.title)

        const currentTest = this._allure.getCurrentTest()

        let featureLabelPresent = false

        this.getLabels(suite).forEach(({ name, value }) => {
            if (name === 'issue') {
                this.addIssue({ issue: value })
            } else if (name === 'testId') {
                this.addTestId({ testId: value })
            } else {
                if (name === 'feature') {
                    featureLabelPresent = true
                }
                currentTest.addLabel(name, value)
            }
        })

        if (suite.description) {
            this.addDescription(suite)
        }

        this.setCaseParameters(suite.cid, suite.parent, !featureLabelPresent)
    }

    onSuiteEnd(suite: SuiteStats) {
        // cleanup suites index to prevent resource leaks
        if (suite.type === 'feature') {
            this._startedFeatures = this._startedFeatures.filter((suite) => suite.uid !== suite.uid)
        }

        if (this._options.useCucumberStepReporter && suite.type === 'scenario') {
            // passing hooks are missing the 'state' property
            suite.hooks = suite.hooks!.map((hook) => {
                hook.state = hook.state ? hook.state : 'passed'
                return hook
            })
            const suiteChildren = [...suite.tests!, ...suite.hooks]
            const isPassed = !suiteChildren.some(item => item.state !== 'passed')
            if (isPassed) {
                return this._allure.endCase('passed')
            }

            // A scenario is it skipped if every steps are skipped and hooks are passed or skipped
            const isSkipped = suite.tests.every(item => [SKIPPED].indexOf(item.state!) >= 0) && suite.hooks.every(item => [PASSED, SKIPPED].indexOf(item.state!) >= 0)
            if (isSkipped) {
                return this._allure.endCase(PENDING)
            }

            // A scenario is it passed if certain steps are passed and all other are skipped and every hooks are passed or skipped
            const isPartiallySkipped = suiteChildren.every(item => [PASSED, SKIPPED].indexOf(item.state!) >= 0)
            if (isPartiallySkipped) {
                return this._allure.endCase('passed')
            }

            // Only close passing and skipped tests because
            // failing tests are closed in onTestFailed event
            return
        }

        this._allure.endSuite()
    }

    onTestStart(test: TestStats | HookStats) {
        this._consoleOutput = ''

        const testTitle = test.currentTest ? test.currentTest : test.title

        if (this.isAnyTestRunning() && this._allure.getCurrentTest().name === testTitle) {
            // Test already in progress, most likely started by a before each hook
            this.setCaseParameters(test.cid, test.parent)
            return
        }

        if (this._options.useCucumberStepReporter) {
            this._allure.startStep(testTitle)

            const testObj = test as TestStats
            const argument = testObj?.argument as Argument
            const dataTable = argument?.rows?.map((a: { cells: string[] }) => a?.cells)

            if (dataTable) {
                this._allure.addAttachment('Data Table', stringify(dataTable), 'text/csv')
            }

            return
        }

        this._allure.startCase(testTitle)
        this.setCaseParameters(test.cid, test.parent)
    }

    setCaseParameters(cid: string | undefined, parentUid: string | undefined, addFeatureLabel: boolean = true ) {
        const parentSuite = this.getParentSuite(parentUid)
        const currentTest = this._allure.getCurrentTest()

        if (!this._isMultiremote) {
            const caps = this._capabilities as Capabilities.DesiredCapabilities
            const { browserName, deviceName, desired, device } = caps
            let targetName = device || browserName || deviceName || cid
            // custom mobile grids can have device information in a `desired` cap
            if (desired && desired.deviceName && desired.platformVersion) {
                targetName = `${device || desired.deviceName} ${desired.platformVersion}`
            }
            const browserstackVersion = caps.os_version || caps.osVersion
            const version = browserstackVersion || caps.browserVersion || caps.version || caps.platformVersion || ''
            const paramName = (deviceName || device) ? 'device' : 'browser'
            const paramValue = version ? `${targetName}-${version}` : targetName
            currentTest.addParameter('argument', paramName, paramValue)
        } else {
            currentTest.addParameter('argument', 'isMultiremote', 'true')
        }

        // Allure analytics labels. See https://github.com/allure-framework/allure2/blob/master/Analytics.md
        currentTest.addLabel('language', 'javascript')
        currentTest.addLabel('framework', 'wdio')
        currentTest.addLabel('thread', cid)

        if (addFeatureLabel && parentSuite) {
            const labelValue = this.getLabels(parentSuite).find(label => label.name === 'feature')?.value ?? parentSuite.title
            if (labelValue) {
                currentTest.addLabel('feature', labelValue)
            }
        }
    }

    getParentSuite(uid?: string): SuiteStats | undefined {
        if (!uid) {
            return undefined
        }

        return this._startedFeatures.find((suite) => suite.uid === uid)
    }

    getLabels({
        tags
    }: SuiteStats) {
        const labels: { name: string, value: string }[] = []
        if (tags) {
            (tags as Tag[]).forEach((tag: Tag) => {
                const label = tag.name.replace(/[@]/, '').split('=')
                if (label.length === 2) {
                    labels.push({ name: label[0], value: label[1] })
                }
            })
        }
        return labels
    }

    onTestPass() {
        attachConsoleLogs(this._consoleOutput, this._allure)
        if (this._options.useCucumberStepReporter) {
            const suite = this._allure.getCurrentSuite()
            if (suite && suite.currentStep instanceof Step) {
                return this._allure.endStep('passed')
            }
        }

        this._allure.endCase(PASSED)
    }

    onTestFail(test: TestStats | HookStats) {
        if (this._options.useCucumberStepReporter) {
            attachConsoleLogs(this._consoleOutput, this._allure)
            const testStatus = getTestStatus(test, this._config)
            const stepStatus: Status = Object.values(stepStatuses).indexOf(testStatus) >= 0 ?
                testStatus : 'failed'
            const suite = this._allure.getCurrentSuite()
            if (suite && suite.currentStep instanceof Step) {
                this._allure.endStep(stepStatus)
            }
            this._allure.endCase(testStatus, getErrorFromFailedTest(test))
            return
        }

        if (!this.isAnyTestRunning()) { // is any CASE running

            this.onTestStart(test)
        } else {

            this._allure.getCurrentTest().name = test.title
        }
        attachConsoleLogs(this._consoleOutput, this._allure)
        const status = getTestStatus(test, this._config)
        while (this._allure.getCurrentSuite().currentStep instanceof Step) {
            this._allure.endStep(status)
        }

        this._allure.endCase(status, getErrorFromFailedTest(test))
    }

    onTestSkip(test: TestStats) {
        attachConsoleLogs(this._consoleOutput, this._allure)
        if (this._options.useCucumberStepReporter) {
            const suite = this._allure.getCurrentSuite()
            if (suite && suite.currentStep instanceof Step) {
                this._allure.endStep('canceled')
            }
        } else if (!this._allure.getCurrentTest() || this._allure.getCurrentTest().name !== test.title) {
            this._allure.pendingCase(test.title)
        } else {
            this._allure.endCase('pending')
        }
    }

    onBeforeCommand(command: BeforeCommandArgs) {
        if (!this.isAnyTestRunning()) {
            return
        }

        const { disableWebdriverStepsReporting } = this._options

        if (disableWebdriverStepsReporting || this._isMultiremote) {
            return
        }

        this._allure.startStep(command.method
            ? `${command.method} ${command.endpoint}`
            : command.command
        )

        const payload = command.body || command.params
        if (!isEmpty(payload)) {
            this.dumpJSON('Request', payload)
        }
    }

    onAfterCommand(command: AfterCommandArgs) {
        const { disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting } = this._options
        if (this.isScreenshotCommand(command) && command.result.value) {
            if (!disableWebdriverScreenshotsReporting) {
                this._lastScreenshot = command.result.value
            }
        }

        if (!this.isAnyTestRunning()) {
            return
        }

        this.attachScreenshot()

        if (this._isMultiremote) {
            return
        }

        if (!disableWebdriverStepsReporting) {
            if (command.result && command.result.value && !this.isScreenshotCommand(command)) {
                this.dumpJSON('Response', command.result.value)
            }

            const suite = this._allure.getCurrentSuite()
            if (!suite || !(suite.currentStep instanceof Step)) {
                return
            }

            this._allure.endStep('passed')
        }
    }

    onHookStart(hook: HookStats) {
        // ignore global hooks
        if (!hook.parent || !this._allure.getCurrentSuite()) {
            return false
        }

        // add beforeEach / afterEach hook as step to test
        if (this._options.disableMochaHooks && isMochaEachHooks(hook.title)) {
            if (this._allure.getCurrentTest()) {
                this._allure.startStep(hook.title)
            }
            return
        }

        // don't add hook as test to suite for mocha All hooks
        if (this._options.disableMochaHooks && isMochaAllHooks(hook.title)) {
            return
        }

        // add hook as test to suite
        this.onTestStart(hook)
    }

    onHookEnd(hook: HookStats) {
        // ignore global hooks
        if (!hook.parent || !this._allure.getCurrentSuite() || (this._options.disableMochaHooks && !isMochaAllHooks(hook.title) && !this._allure.getCurrentTest())) {
            return false
        }

        // set beforeEach / afterEach hook (step) status
        if (this._options.disableMochaHooks && isMochaEachHooks(hook.title)) {
            hook.error
                ? this._allure.endStep('failed')
                : this._allure.endStep('passed')
            return
        }

        // set hook (test) status
        if (hook.error) {
            if (this._options.disableMochaHooks && isMochaAllHooks(hook.title)) {
                this.onTestStart(hook)
                this.attachScreenshot()
            }
            this.onTestFail(hook)
        } else if (
            (this._options.disableMochaHooks || this._options.useCucumberStepReporter) &&
            !isMochaAllHooks(hook.title)
        ) {
            this.onTestPass()

            // remove hook from suite if it has no steps
            if (this._allure.getCurrentTest().steps.length === 0 && !this._options.useCucumberStepReporter) {
                this._allure.getCurrentSuite().testcases.pop()
            } else if (this._options.useCucumberStepReporter) {
                // remove hook when it's registered as a step and if it's passed
                const step = this._allure.getCurrentTest().steps.pop()

                // if it had any attachments, reattach them to current test
                if (step && step.attachments.length >= 1) {
                    step.attachments.forEach((attachment: any) => {
                        this._allure.getCurrentTest().addAttachment(attachment)
                    })
                }
            }
        } else if (!this._options.disableMochaHooks) {
            this.onTestPass()
        }
    }

    addLabel({
        name,
        value
    }: AddLabelEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        test.addLabel(name, value)
    }

    addStory({
        storyName
    }: AddStoryEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        test.addLabel('story', storyName)
    }

    addFeature({
        featureName
    }: AddFeatureEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        test.addLabel('feature', featureName)
    }

    addSeverity({
        severity
    }: AddSeverityEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        test.addLabel('severity', severity)
    }

    addIssue({
        issue
    }: AddIssueEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        const issueLink = getLinkByTemplate(this._options.issueLinkTemplate, issue)
        test.addLabel('issue', issueLink)
    }

    addTestId({
        testId
    }: AddTestIdEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        const tmsLink = getLinkByTemplate(this._options.tmsLinkTemplate, testId)
        test.addLabel('testId', tmsLink)
    }

    addEnvironment({
        name,
        value
    }: AddEnvironmentEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        test.addParameter('environment-variable', name, value)
    }

    addDescription({
        description,
        descriptionType
    }: AddDescriptionEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        test.setDescription(description, descriptionType)
    }

    addAttachment({
        name,
        content,
        type = 'text/plain'
    }: AddAttachmentEventArgs) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        if (type === 'application/json') {
            this.dumpJSON(name, content as object)
        } else {
            this._allure.addAttachment(name, Buffer.from(content as string), type)
        }
    }

    startStep(title: string) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        this._allure.startStep(title)
    }

    endStep(status: Status) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        this._allure.endStep(status)
    }

    addStep({
        step
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        this.startStep(step.title)
        if (step.attachment) {
            this.addAttachment(step.attachment)
        }
        this.endStep(step.status)
    }

    addArgument({
        name,
        value
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this._allure.getCurrentTest()
        test.addParameter('argument', name, value)
    }

    isAnyTestRunning() {
        return this._allure.getCurrentSuite() && this._allure.getCurrentTest()
    }

    isScreenshotCommand(command: CommandArgs) {
        const isScrenshotEndpoint = /\/session\/[^/]*(\/element\/[^/]*)?\/screenshot/
        return (
            // WebDriver protocol
            (command.endpoint && isScrenshotEndpoint.test(command.endpoint)) ||
            // DevTools protocol
            command.command === 'takeScreenshot'
        )
    }

    dumpJSON(name: string, json: object) {
        const content = JSON.stringify(json, null, 2)
        const isStr = typeof content === 'string'
        this._allure.addAttachment(name, isStr ? content : `${content}`, isStr ? 'application/json' : 'text/plain')
    }

    attachScreenshot() {
        if (this._lastScreenshot && !this._options.disableWebdriverScreenshotsReporting) {
            this._allure.addAttachment('Screenshot', Buffer.from(this._lastScreenshot, 'base64'))
            this._lastScreenshot = undefined
        }
    }

    /**
     * public API attached to the reporter
     * deprecated approach and only here for backwards compatibility
     */
    static addFeature = addFeature
    static addLabel = addLabel
    static addSeverity = addSeverity
    static addIssue = addIssue
    static addTestId = addTestId
    static addStory = addStory
    static addEnvironment = addEnvironment
    static addDescription = addDescription
    static addAttachment = addAttachment
    static startStep = startStep
    static endStep = endStep
    static addStep = addStep
    static addArgument = addArgument
}

import WDIOReporter, { SuiteStats, Tag, HookStats, TestStats, BeforeCommandArgs, AfterCommandArgs, CommandArgs, WDIOReporterBaseOptions } from '@wdio/reporter'
import Allure from 'allure-js-commons'
import Step from 'allure-js-commons/beans/step'
import { getTestStatus, isEmpty, tellReporter, isMochaEachHooks, getErrorFromFailedTest, isMochaAllHooks, getLinkByTemplate } from './utils'
import { events, PASSED, PENDING, SKIPPED, stepStatuses } from './constants'

/**
 * When you add a new option, please also update the docs at ./packages/wdio-allure-reporter/README.md
 */
interface AllureReporterOptions extends WDIOReporterBaseOptions {
    /**
     * defaults to `./allure-results`. After a test run is complete, you will find that this directory
     * has been populated with an `.xml` file for each spec, plus a number of `.txt` and `.png`
     * files and other attachments.
     */
    outputDir?: string;
    /**
     * optional parameter (`false` by default), set it to true in order to change the report hierarchy
     * when using cucumber. Try it for yourself and see how it looks.
     */
    useCucumberStepReporter?: boolean;
    /**
     * optional parameter (`false` by default), set it to true in order to not fetch the `before/after`
     * stacktrace/screenshot/result hooks into the Allure Reporter.
     */
    disableMochaHooks?: boolean;
    /**
     * optional parameter(`false` by default), in order to log only custom steps to the reporter.
     */
    disableWebdriverStepsReporting?: boolean;
    /**
     * optional parameter(`false` by default), in order to not attach screenshots to the reporter.
     */
    disableWebdriverScreenshotsReporting?: boolean;
    /**
     * optional parameter, in order to specify the issue link pattern. Reporter will replace `{}` placeholder
     * with value specified in `addIssue(value)` call parameter.
     * Example `https://example.org/issue/{}`
     */
    issueLinkTemplate?: string;
    /**
     * optional parameter, in order to specify the tms link pattern. Reporter will replace `{}` placeholder
     * with value specified in `addTestId(value)` call parameter. Example `https://example.org/tms/{}`
     */
    tmsLinkTemplate?: string;
}

class AllureReporter extends WDIOReporter {
    allure: Allure;
    capabilities: WebDriver.DesiredCapabilities;
    config: any;
    isMultiremote?: boolean;
    lastScreenshot?: string;
    options: AllureReporterOptions;

    constructor(options: AllureReporterOptions = {}) {
        const outputDir = options.outputDir || 'allure-results'
        super({
            ...options,
            outputDir,
        })
        this.options = options
        this.config = {}
        this.capabilities = {}
        this.allure = new Allure()

        this.allure.setOptions({ targetDir: outputDir })
        this.registerListeners()

        this.lastScreenshot = undefined
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

    onRunnerStart(runner: any) {
        this.config = runner.config
        this.capabilities = runner.capabilities
        this.isMultiremote = runner.isMultiremote || false
    }

    onSuiteStart(suite: SuiteStats) {
        if (this.options.useCucumberStepReporter) {
            if (suite.type === 'feature') {
                // handle cucumber features as allure "suite"
                return this.allure.startSuite(suite.title)
            }

            // handle cucumber scenarii as allure "case" instead of "suite"
            this.allure.startCase(suite.title)
            const currentTest = this.allure.getCurrentTest()
            this.getLabels(suite).forEach(({ name, value }) => {
                currentTest.addLabel(name, value)
            })
            if (suite.description) {
                this.addDescription(suite)
            }
            return this.setCaseParameters(suite.cid)
        }

        const currentSuite = this.allure.getCurrentSuite()
        const prefix = currentSuite ? currentSuite.name + ': ' : ''
        this.allure.startSuite(prefix + suite.title)
    }

    onSuiteEnd(suite: SuiteStats) {
        if (this.options.useCucumberStepReporter && suite.type === 'scenario') {
            // passing hooks are missing the 'state' property
            suite.hooks = suite.hooks!.map((hook) => {
                hook.state = hook.state ? hook.state : 'passed'
                return hook
            })
            const suiteChildren = [...suite.tests!, ...suite.hooks]
            const isPassed = !suiteChildren.some(item => item.state !== 'passed')
            if (isPassed) {
                return this.allure.endCase('passed')
            }

            // A scenario is it skipped if is not passed and every steps/hooks are passed or skipped
            const isSkipped = suiteChildren.every(item => [PASSED, SKIPPED].indexOf(item.state!) >= 0)
            if (isSkipped) {
                return this.allure.endCase(PENDING)
            }

            // Only close passing and skipped tests because
            // failing tests are closed in onTestFailed event
            return
        }

        this.allure.endSuite()
    }

    onTestStart(test: TestStats | HookStats) {
        const testTitle = test.currentTest ? test.currentTest : test.title
        if (this.isAnyTestRunning() && this.allure.getCurrentTest().name == testTitle) {
            // Test already in progress, most likely started by a before each hook
            this.setCaseParameters(test.cid)
            return
        }

        if (this.options.useCucumberStepReporter) {
            return this.allure.startStep(testTitle)
        }

        this.allure.startCase(testTitle)
        this.setCaseParameters(test.cid)
    }

    setCaseParameters(cid?: string) {
        const currentTest = this.allure.getCurrentTest()

        if (!this.isMultiremote) {
            const { browserName, deviceName, desired, device } = this.capabilities
            let targetName = device || browserName || deviceName || cid
            // custom mobile grids can have device information in a `desired` cap
            if (desired && desired.deviceName && desired.platformVersion) {
                targetName = `${device || desired.deviceName} ${desired.platformVersion}`
            }
            const browserstackVersion = this.capabilities.os_version || this.capabilities.osVersion
            const version = browserstackVersion || this.capabilities.browserVersion || this.capabilities.version || this.capabilities.platformVersion || ''
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
        if (this.options.useCucumberStepReporter) {
            return this.allure.endStep('passed')
        }

        this.allure.endCase(PASSED)
    }

    onTestFail(test: TestStats | HookStats) {
        if (this.options.useCucumberStepReporter) {
            const testStatus = getTestStatus(test, this.config)
            const stepStatus: Allure.Status = Object.values(stepStatuses).indexOf(testStatus) >= 0 ?
                testStatus : 'failed'
            this.allure.endStep(stepStatus)
            this.allure.endCase(testStatus, getErrorFromFailedTest(test))
            return
        }

        if (!this.isAnyTestRunning()) { // is any CASE running

            this.onTestStart(test)
        } else {

            this.allure.getCurrentTest().name = test.title
        }

        const status = getTestStatus(test, this.config)
        while (this.allure.getCurrentSuite().currentStep instanceof Step) {
            this.allure.endStep(status)
        }

        this.allure.endCase(status, getErrorFromFailedTest(test))
    }

    onTestSkip(test: TestStats) {
        if (this.options.useCucumberStepReporter) {
            this.allure.endStep('canceled')
        } else if (!this.allure.getCurrentTest() || this.allure.getCurrentTest().name !== test.title) {
            this.allure.pendingCase(test.title)
        } else {
            this.allure.endCase('pending')
        }
    }

    onBeforeCommand(command: BeforeCommandArgs) {
        if (!this.isAnyTestRunning()) {
            return
        }

        const { disableWebdriverStepsReporting } = this.options

        if (disableWebdriverStepsReporting || this.isMultiremote) {
            return
        }

        this.allure.startStep(command.method
            ? `${command.method} ${command.endpoint}`
            : command.command
        )

        const payload = command.body || command.params
        if (!isEmpty(payload)) {
            this.dumpJSON('Request', payload)
        }
    }

    onAfterCommand(command: AfterCommandArgs) {
        const { disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting } = this.options
        if (this.isScreenshotCommand(command) && command.result.value) {
            if (!disableWebdriverScreenshotsReporting) {
                this.lastScreenshot = command.result.value
            }
        }

        if (!this.isAnyTestRunning()) {
            return
        }

        this.attachScreenshot()

        if (this.isMultiremote) {
            return
        }

        if (!disableWebdriverStepsReporting) {
            if (command.result && command.result.value && !this.isScreenshotCommand(command)) {
                this.dumpJSON('Response', command.result.value)
            }

            const suite = this.allure.getCurrentSuite()
            if (!suite || !(suite.currentStep instanceof Step)) {
                return
            }

            this.allure.endStep('passed')
        }
    }

    onHookStart(hook: HookStats) {
        // ignore global hooks
        if (!hook.parent || !this.allure.getCurrentSuite()) {
            return false
        }

        // add beforeEach / afterEach hook as step to test
        if (this.options.disableMochaHooks && isMochaEachHooks(hook.title)) {
            if (this.allure.getCurrentTest()) {
                this.allure.startStep(hook.title)
            }
            return
        }

        // don't add hook as test to suite for mocha All hooks
        if (this.options.disableMochaHooks && isMochaAllHooks(hook.title)) {
            return
        }

        // add hook as test to suite
        this.onTestStart(hook)
    }

    onHookEnd(hook: HookStats) {
        // ignore global hooks
        if (!hook.parent || !this.allure.getCurrentSuite() || (this.options.disableMochaHooks && !isMochaAllHooks(hook.title) && !this.allure.getCurrentTest())) {
            return false
        }

        // set beforeEach / afterEach hook (step) status
        if (this.options.disableMochaHooks && isMochaEachHooks(hook.title)) {
            if (hook.error) {
                this.allure.endStep('failed')
            } else {
                this.allure.endStep('passed')
            }
            return
        }

        // set hook (test) status
        if (hook.error) {
            if (this.options.disableMochaHooks && isMochaAllHooks(hook.title)) {
                this.onTestStart(hook)
                this.attachScreenshot()
            }
            this.onTestFail(hook)
        } else if (this.options.disableMochaHooks || this.options.useCucumberStepReporter) {
            if (!isMochaAllHooks(hook.title)) {
                this.onTestPass()

                // remove hook from suite if it has no steps
                if (this.allure.getCurrentTest().steps.length === 0 && !this.options.useCucumberStepReporter) {
                    this.allure.getCurrentSuite().testcases.pop()
                } else if (this.options.useCucumberStepReporter) {
                    // remove hook when it's registered as a step and if it's passed
                    const step = this.allure.getCurrentTest().steps.pop()

                    // if it had any attachments, reattach them to current test
                    if (step && step.attachments.length >= 1) {
                        step.attachments.forEach(attachment => {
                            this.allure.getCurrentTest().addAttachment(attachment)
                        })
                    }
                }
            }
        } else if (!this.options.disableMochaHooks) this.onTestPass()
    }

    addLabel({
        name,
        value
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel(name, value)
    }

    addStory({
        storyName
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('story', storyName)
    }

    addFeature({
        featureName
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('feature', featureName)
    }

    addSeverity({
        severity
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('severity', severity)
    }

    addIssue({
        issue
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        const issueLink = getLinkByTemplate(this.options.issueLinkTemplate, issue)
        test.addLabel('issue', issueLink)
    }

    addTestId({
        testId
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        const tmsLink = getLinkByTemplate(this.options.tmsLinkTemplate, testId)
        test.addLabel('testId', tmsLink)
    }

    addEnvironment({
        name,
        value
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addParameter('environment-variable', name, value)
    }

    addDescription({
        description,
        descriptionType
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.setDescription(description, descriptionType)
    }

    addAttachment({
        name,
        content,
        type = 'text/plain'
    }: any) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        if (type === 'application/json') {
            this.dumpJSON(name, content)
        } else {
            this.allure.addAttachment(name, Buffer.from(content), type)
        }
    }

    startStep(title: string) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        this.allure.startStep(title)
    }

    endStep(status: Allure.Status) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        this.allure.endStep(status)
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

        const test = this.allure.getCurrentTest()
        test.addParameter('argument', name, value)
    }

    isAnyTestRunning() {
        return this.allure.getCurrentSuite() && this.allure.getCurrentTest()
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
        this.allure.addAttachment(name, isStr ? content : `${content}`, isStr ? 'application/json' : 'text/plain')
    }

    attachScreenshot() {
        if (this.lastScreenshot && !this.options.disableWebdriverScreenshotsReporting) {
            this.allure.addAttachment('Screenshot', Buffer.from(this.lastScreenshot, 'base64'))
            this.lastScreenshot = undefined
        }
    }

    /**
     * Assign feature to test
     * @name addFeature
     * @param {(string)} featureName - feature name or an array of names
     */
    static addFeature = (featureName: string) => {
        tellReporter(events.addFeature, { featureName })
    }

    /**
     * Assign label to test
     * @name addLabel
     * @param {string} name - label name
     * @param {string} value - label value
     */
    static addLabel = (name: string, value: string) => {
        tellReporter(events.addLabel, { name, value })
    }
    /**
     * Assign severity to test
     * @name addSeverity
     * @param {string} severity - severity value
     */
    static addSeverity = (severity: string) => {
        tellReporter(events.addSeverity, { severity })
    }

    /**
     * Assign issue id to test
     * @name addIssue
     * @param {string} issue - issue id value
     */
    static addIssue = (issue: string) => {
        tellReporter(events.addIssue, { issue })
    }

    /**
     * Assign TMS test id to test
     * @name addTestId
     * @param {string} testId - test id value
     */
    static addTestId = (testId: string) => {
        tellReporter(events.addTestId, { testId })
    }

    /**
     * Assign story to test
     * @name addStory
     * @param {string} storyName - story name for test
     */
    static addStory = (storyName: string) => {
        tellReporter(events.addStory, { storyName })
    }

    /**
     * Add environment value
     * @name addEnvironment
     * @param {string} name - environment name
     * @param {string} value - environment value
     */
    static addEnvironment = (name: string, value: string) => {
        tellReporter(events.addEnvironment, { name, value })
    }

    /**
     * Assign test description to test
     * @name addDescription
     * @param {string} description - description for test
     * @param {string} descriptionType - description type 'text'\'html'\'markdown'
     */
    static addDescription = (description: string, descriptionType: string) => {
        tellReporter(events.addDescription, { description, descriptionType })
    }

    /**
     * Add attachment
     * @name addAttachment
     * @param {string} name         - attachment file name
     * @param {*} content           - attachment content
     * @param {string=} mimeType    - attachment mime type
     */
    static addAttachment = (name: string, content: string | Buffer | object, type: string) => {
        if (!type) {
            type = content instanceof Buffer ? 'image/png' : typeof content === 'string' ? 'text/plain' : 'application/json'
        }
        tellReporter(events.addAttachment, { name, content, type })
    }

    /**
     * Start allure step
     * @name startStep
     * @param {string} title - step name in report
     */
    static startStep = (title: string) => {
        tellReporter(events.startStep, title)
    }

    /**
     * End current allure step
     * @name endStep
     * @param {StepStatus} [status='passed'] - step status
     */
    static endStep = (status: Allure.Status = 'passed') => {
        if (!Object.values(stepStatuses).includes(status)) {
            throw new Error(`Step status must be ${Object.values(stepStatuses).join(' or ')}. You tried to set "${status}"`)
        }
        tellReporter(events.endStep, status)
    }

    /**
     * Create allure step
     * @name addStep
     * @param {string} title - step name in report
     * @param {Object} [attachmentObject={}] - attachment for step
     * @param {string} attachmentObject.content - attachment content
     * @param {string} [attachmentObject.name='attachment'] - attachment name
     * @param {string} [attachmentObject.type='text/plain'] - attachment type
     * @param {string} [status='passed'] - step status
     */
    static addStep = (title: string, {
        content,
        name = 'attachment',
        type = 'text/plain'
    }: any = {}, status: Allure.Status = 'passed') => {
        if (!Object.values(stepStatuses).includes(status)) {
            throw new Error(`Step status must be ${Object.values(stepStatuses).join(' or ')}. You tried to set "${status}"`)
        }

        const step = content ? { title, attachment: { content, name, type }, status } : { title, status }
        tellReporter(events.addStep, { step })
    }

    /**
     * Add additional argument to test
     * @name addArgument
     * @param {string} name - argument name
     * @param {string} value - argument value
     */
    static addArgument = (name: string, value: string) => {
        tellReporter(events.addArgument, { name, value })
    }
}

export default AllureReporter

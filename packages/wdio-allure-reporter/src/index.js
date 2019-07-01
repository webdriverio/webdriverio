import WDIOReporter from '@wdio/reporter'
import Allure from 'allure-js-commons'
import Step from 'allure-js-commons/beans/step'
import { getTestStatus, isEmpty, tellReporter, isMochaEachHooks, getErrorFromFailedTest } from './utils'
import { events, stepStatuses, testStatuses } from './constants'

class AllureReporter extends WDIOReporter {
    constructor(options) {
        const outputDir = options.outputDir || 'allure-results'

        super({
            ...options,
            outputDir
        })
        this.config = {}
        this.allure = new Allure()

        this.allure.setOptions({ targetDir: outputDir })
        this.registerListeners()
    }

    registerListeners() {
        process.on(events.addFeature, ::this.addFeature)
        process.on(events.addStory, ::this.addStory)
        process.on(events.addSeverity, ::this.addSeverity)
        process.on(events.addIssue, ::this.addIssue)
        process.on(events.addTestId, ::this.addTestId)
        process.on(events.addEnvironment, ::this.addEnvironment)
        process.on(events.addAttachment, ::this.addAttachment)
        process.on(events.addDescription, ::this.addDescription)
        process.on(events.startStep, ::this.startStep)
        process.on(events.endStep, ::this.endStep)
        process.on(events.addStep, ::this.addStep)
        process.on(events.addArgument, ::this.addArgument)
    }

    onRunnerStart(runner) {
        this.config = runner.config
        this.isMultiremote = runner.isMultiremote || false
    }

    onSuiteStart(suite) {
        const currentSuite = this.allure.getCurrentSuite()
        const prefix = currentSuite ? currentSuite.name + ' ' : ''
        this.allure.startSuite(prefix + suite.title)
    }

    onSuiteEnd() {
        this.allure.endSuite()
    }

    onTestStart(test) {
        this.allure.startCase(test.title)

        const currentTest = this.allure.getCurrentTest()

        if (!this.isMultiremote) {
            const { browserName, deviceName } = this.config.capabilities
            const targetName = browserName || deviceName || test.cid
            const version = this.config.capabilities.version || this.config.capabilities.platformVersion || ''
            const paramName = deviceName ? 'device' : 'browser'
            const paramValue = version ? `${targetName}-${version}` : targetName
            currentTest.addParameter('argument', paramName, paramValue)
        } else {
            currentTest.addParameter('argument', 'isMultiremote', 'true')
        }

        // Allure analytics labels. See https://github.com/allure-framework/allure2/blob/master/Analytics.md
        currentTest.addLabel('language', 'javascript')
        currentTest.addLabel('framework', 'wdio')
        currentTest.addLabel('thread', test.cid)
    }

    onTestPass() {
        this.allure.endCase(testStatuses.PASSED)
    }

    onTestFail(test) {
        if (!this.isAnyTestRunning()) {
            this.allure.startCase(test.title)
        } else {
            this.allure.getCurrentTest().name = test.title
        }

        const status = getTestStatus(test, this.config)
        while (this.allure.getCurrentSuite().currentStep instanceof Step) {
            this.allure.endStep(status)
        }

        this.allure.endCase(status, getErrorFromFailedTest(test))
    }

    onTestSkip(test) {
        if (!this.allure.getCurrentTest() || this.allure.getCurrentTest().name !== test.title) {
            this.allure.pendingCase(test.title)
        } else {
            this.allure.endCase(testStatuses.PENDING)
        }
    }

    onBeforeCommand(command) {
        if (!this.isAnyTestRunning()) {
            return
        }

        if (this.options.disableWebdriverStepsReporting || this.isMultiremote) {
            return
        }

        this.allure.startStep(`${command.method} ${command.endpoint}`)

        if (!isEmpty(command.body)) {
            this.dumpJSON('Request', command.body)
        }
    }

    onAfterCommand(command) {
        if (!this.isAnyTestRunning() || this.isMultiremote) {
            return
        }

        const { disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting } = this.options
        if (this.isScreenshotCommand(command) && command.result.value) {
            if (!disableWebdriverScreenshotsReporting) {
                this.allure.addAttachment('Screenshot', Buffer.from(command.result.value, 'base64'))
            }
        }
        if (!disableWebdriverStepsReporting) {
            if (command.result && command.result.value && !this.isScreenshotCommand(command)) {
                this.dumpJSON('Response', command.result.value)
            }

            const suite = this.allure.getCurrentSuite()
            if (!suite || !(suite.currentStep instanceof Step)) {
                return
            }

            this.allure.endStep(testStatuses.PASSED)
        }
    }

    onHookStart(hook) {
        // ignore global hooks
        if (!hook.parent || !this.allure.getCurrentSuite()) {
            return false
        }

        // add beforeEach / afterEach hook as step to test
        if (isMochaEachHooks(hook.title)) {
            if (this.allure.getCurrentTest()) {
                this.allure.startStep(hook.title)
            }
            return
        }

        // add hook as test to suite
        this.onTestStart(hook)
    }

    onHookEnd(hook) {
        // ignore global hooks
        if (!hook.parent || !this.allure.getCurrentSuite() || !this.allure.getCurrentTest()) {
            return false
        }

        // set beforeEach / afterEach hook (step) status
        if (isMochaEachHooks(hook.title)) {
            if (hook.error) {
                this.allure.endStep(stepStatuses.FAILED)
            } else {
                this.allure.endStep(stepStatuses.PASSED)
            }
            return
        }

        // set hook (test) status
        if (hook.error) {
            this.onTestFail(hook)
        } else {
            this.onTestPass()

            // remove hook from suite if it has no steps
            if (this.allure.getCurrentTest().steps.length === 0) {
                this.allure.getCurrentSuite().testcases.pop()
            }
        }
    }

    addStory({ storyName }) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('story', storyName)
    }

    addFeature({ featureName }) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('feature', featureName)
    }

    addSeverity({ severity }) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('severity', severity)
    }

    addIssue({ issue }) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('issue', issue)
    }

    addTestId({ testId }) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('testId', testId)
    }

    addEnvironment({ name, value }) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addParameter('environment-variable', name, value)
    }

    addDescription({ description, type }) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.setDescription(description, type)
    }

    addAttachment({ name, content, type = 'text/plain' }) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        if (type === 'application/json') {
            this.dumpJSON(name, content)
        } else {
            this.allure.addAttachment(name, Buffer.from(content), type)
        }
    }

    startStep(title) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        this.allure.startStep(title)
    }

    endStep(status) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        this.allure.endStep(status)
    }

    addStep({ step }) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        this.startStep(step.title)
        if (step.attachment) {
            this.addAttachment(step.attachment)
        }
        this.endStep(step.status)
    }

    addArgument({ name, value }) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        const test = this.allure.getCurrentTest()
        test.addParameter('argument', name, value)
    }

    isAnyTestRunning() {
        return this.allure.getCurrentSuite() && this.allure.getCurrentTest()
    }

    isScreenshotCommand(command) {
        const isScrenshotEndpoint = /\/session\/[^/]*\/screenshot/
        return isScrenshotEndpoint.test(command.endpoint)
    }

    dumpJSON(name, json) {
        this.allure.addAttachment(name, JSON.stringify(json, null, 2), 'application/json')
    }

    /**
     * Assign feature to test
     * @name addFeature
     * @param {(string)} featureName - feature name or an array of names
     */
    static addFeature = (featureName) => {
        tellReporter(events.addFeature, { featureName })
    }

    /**
     * Assign severity to test
     * @name addSeverity
     * @param {string} severity - severity value
     */
    static addSeverity = (severity) => {
        tellReporter(events.addSeverity, { severity })
    }

    /**
     * Assign issue id to test
     * @name addIssue
     * @param {string} issue - issue id value
     */
    static addIssue = (issue) => {
        tellReporter(events.addIssue, { issue })
    }

    /**
     * Assign TMS test id to test
     * @name addTestId
     * @param {string} testId - test id value
     */
    static addTestId = (testId) => {
        tellReporter(events.addTestId, { testId })
    }

    /**
     * Assign story to test
     * @name addStory
     * @param {string} storyName - story name for test
     */
    static addStory = (storyName) => {
        tellReporter(events.addStory, { storyName })
    }

    /**
     * Add environment value
     * @name addEnvironment
     * @param {string} name - environment name
     * @param {string} value - environment value
     */
    static addEnvironment = (name, value) => {
        tellReporter(events.addEnvironment, { name, value })
    }

    /**
     * Assign test description to test
     * @name addDescription
     * @param {string} description - description for test
     * @param {string} type - description type 'text'\'html'\'markdown'
     */
    static addDescription = (description, type) => {
        tellReporter(events.addDescription, { description, type })
    }

    /**
     * Add attachment
     * @name addAttachment
     * @param {string} name - attachment file name
     * @param {string | Buffer} content - attachment content
     * @param {string} [type='text/plain'] - attachment mime type
     */
    static addAttachment = (name, content, type = 'text/plain') => {
        tellReporter(events.addAttachment, { name, content, type })
    }

    /**
     * Start allure step
     * @name startStep
     * @param {string} title - step name in report
     */
    static startStep = (title) => {
        tellReporter(events.startStep, title)
    }

    /**
     * End current allure step
     * @name endStep
     * @param {string} [status='passed'] - step status
     */
    static endStep = (status = stepStatuses.PASSED) => {
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
    static addStep = (title, { content, name = 'attachment', type = 'text/plain' } = {}, status = stepStatuses.PASSED) => {
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
    static addArgument = (name, value) => {
        tellReporter(events.addArgument, { name, value })
    }
}

export default AllureReporter

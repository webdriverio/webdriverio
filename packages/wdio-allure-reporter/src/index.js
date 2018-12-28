import WDIOReporter from '@wdio/reporter'
import Allure from 'allure-js-commons'
import Step from 'allure-js-commons/beans/step'
import {getTestStatus, ignoredHooks, isEmpty, tellReporter} from './utils'
import {events, stepStatuses, testStatuses} from './constants'

class AllureReporter extends WDIOReporter {
    constructor(options) {
        super(options)
        this.config = {}
        this.allure = new Allure()
        this.allure.setOptions({targetDir: options.outputDir || 'allure-results'})
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

        const { browserName, deviceName } = this.config.capabilities
        const targetName = browserName || deviceName || test.cid
        const version = this.config.capabilities.version || this.config.capabilities.platformVersion || ''
        const paramName = deviceName ? 'device' : 'browser'
        const paramValue = version ? `${targetName}-${version}` : targetName
        currentTest.addParameter('argument', paramName, paramValue)

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

        this.allure.endCase(status, test.error)
    }

    onTestSkip(test) {
        if (this.allure.getCurrentTest() && this.allure.getCurrentTest().status !== testStatuses.PENDING) {
            this.allure.endCase(testStatuses.PENDING)
        } else {
            this.allure.pendingCase(test.title)
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

        const {disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting} = this.options
        if (this.isScreenshotCommand(command) && command.result.value) {
            if (!disableWebdriverScreenshotsReporting) {
                this.allure.addAttachment('Screenshot', Buffer.from(command.result.value, 'base64'))
            }
        }
        if (!disableWebdriverStepsReporting) {
            if (command.result && command.result.value && !this.isScreenshotCommand(command)) {
                this.dumpJSON('Response', command.result.value)
            }
            this.allure.endStep(testStatuses.PASSED)
        }
    }

    onHookStart(hook) {
        if (!this.allure.getCurrentSuite() || ignoredHooks(hook.title)) {
            return false
        }

        this.allure.startCase(hook.title)
    }

    onHookEnd(hook) {
        if (!this.allure.getCurrentSuite() || ignoredHooks(hook.title)) {
            return false
        }

        this.allure.endCase(testStatuses.PASSED)

        if (this.allure.getCurrentTest().steps.length === 0) {
            this.allure.getCurrentSuite().testcases.pop()
        }
    }

    addStory({storyName}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('story', storyName)
    }

    addFeature({featureName}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('feature', featureName)
    }

    addSeverity({severity}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('severity', severity)
    }

    addIssue({issue}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('issue', issue)
    }

    addTestId({testId}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addLabel('testId', testId)
    }

    addEnvironment({name, value}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.addParameter('environment-variable', name, value)
    }

    addDescription({description, type}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        const test = this.allure.getCurrentTest()
        test.setDescription(description, type)
    }

    addAttachment({name, content, type = 'text/plain'}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        if (type === 'application/json') {
            this.dumpJSON(name, content)
        } else {
            this.allure.addAttachment(name, Buffer.from(content), type)
        }
    }

    addStep({step}) {
        if (!this.isAnyTestRunning()) {
            return false
        }

        this.allure.startStep(step.title)
        if (step.attachment) {
            this.addAttachment(step.attachment)
        }
        this.allure.endStep(step.status)
    }

    addArgument({name, value}) {
        if (!this.isAnyTestRunning()) {
            return false
        }
        const test = this.allure.getCurrentTest()
        test.addParameter('argument', name, value)
    }

    isAnyTestRunning() {
        return this.allure.getCurrentSuite() && this.allure.getCurrentTest()
    }

    isScreenshotCommand(command){
        const isScrenshotEndpoint = /\/session\/[^/]*\/screenshot/
        return isScrenshotEndpoint.test(command.endpoint)
    }

    dumpJSON(name, json) {
        this.allure.addAttachment(name, JSON.stringify(json, null, 2), 'application/json')
    }


    /**
     * Assign feature to test
     * @param {(string)} featureName - feature name or an array of names
     */
    static addFeature = (featureName) => {
        tellReporter(events.addFeature, {featureName})
    }

    /**
     * Assign severity to test
     * @param {string} severity - severity value
     */
    static addSeverity = (severity) => {
        tellReporter(events.addSeverity, {severity})
    }

    /**
     * Assign issue id to test
     * @param {string} issue - issue id value
     */
    static addIssue = (issue) => {
        tellReporter(events.addIssue, {issue})
    }

    /**
     * Assign TMS test id to test
     * @param {string} testId - test id value
     */
    static addTestId = (testId) => {
        tellReporter(events.addTestId, {testId})
    }

    /**
     * Assign story to test
     * @param {string} storyName - story name for test
     */
    static addStory = (storyName) => {
        tellReporter(events.addStory, {storyName})
    }

    /**
     * Add environment value
     * @param {string} name - environment name
     * @param {string} value - environment value
     */
    static addEnvironment = (name, value) => {
        tellReporter(events.addEnvironment, {name, value})
    }

    /**
     * Assign test description to test
     * @param {string} description - description for test
     * @param {string} type - description type 'text'\'html'\'markdown'
     */
    static addDescription = (description, type) => {
        tellReporter(events.addDescription, {description, type})
    }

    /**
     * Add attachment
     * @param {string} name - attachment file name
     * @param {string} content - attachment content
     * @param {string} [type='text/plain'] - attachment mime type
     */
    static addAttachment = (name, content, type = 'text/plain') => {
        tellReporter(events.addAttachment, {name, content, type})
    }
    /**
     * Create allure step
     * @param {string} title - step name in report
     * @param {Object} attachmentObject - attachment for step
     * @param {string} attachmentObject.content - attachment content
     * @param {string} [attachmentObject.name='attachment'] - attachment name
     * @param {string} [status='passed'] - step status
     */
    static addStep = (title, {content, name = 'attachment'}, status = stepStatuses.PASSED) => {
        if (!Object.values(stepStatuses).includes(status)) {
            throw new Error(`Step status must be ${Object.values(stepStatuses).join(' or ')}. You tried to set "${status}"`)
        }

        const step = {
            title,
            attachment: {
                content,
                name
            },
            status
        }
        tellReporter(events.addStep, {step})
    }

    /**
     * Add additional argument to test
     * @param {string} name - argument name
     * @param {string} value - argument value
     */
    static addArgument = (name, value) => {
        tellReporter(events.addArgument, {name, value})
    }
}

export default AllureReporter

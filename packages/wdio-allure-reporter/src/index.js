import WDIOReporter from 'wdio-reporter'
import Allure from 'allure-js-commons'
import Step from 'allure-js-commons/beans/step'
import {getTestStatus, ignoredHooks, isEmpty} from './utils'
import {events, testStatuses} from './constants'

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
        process.on(events.addEnvironment, ::this.addEnvironment)
        process.on(events.addAttachment, ::this.addAttachment)
        process.on(events.addDescription, ::this.addDescription)
        process.on(events.addStep, ::this.addStep)
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

        currentTest.addParameter('argument', 'browser', this.config.capabilities.browserName || test.cid)

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
}

export default AllureReporter

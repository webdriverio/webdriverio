import { stringify } from 'csv-stringify/sync'
import type {
    SuiteStats, HookStats, RunnerStats, TestStats, BeforeCommandArgs,
    AfterCommandArgs, Argument
} from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import type { Capabilities, Options } from '@wdio/types'
import type { Label, MetadataMessage, AllureStep } from 'allure-js-commons'
import { AllureRuntime, AllureGroup, AllureTest, Status as AllureStatus, Stage, LabelName, LinkType, ContentType, AllureCommandStepExecutable } from 'allure-js-commons'
import {
    addFeature, addLink, addOwner, addEpic, addSuite, addSubSuite, addParentSuite, addTag, addLabel, addSeverity, addIssue, addTestId, addStory, addEnvironment, addAllureId,
    addDescription, addAttachment, startStep, endStep, addStep, addArgument, step,
} from './common/api.js'
import { AllureReporterState } from './state.js'
import {
    getTestStatus, isEmpty, isMochaEachHooks, getErrorFromFailedTest,
    isMochaAllHooks, getLinkByTemplate, isScreenshotCommand, getSuiteLabels,
} from './utils.js'
import { events } from './constants.js'
import type {
    AddAttachmentEventArgs, AddDescriptionEventArgs, AddEnvironmentEventArgs,
    AddFeatureEventArgs, AddIssueEventArgs, AddLabelEventArgs, AddSeverityEventArgs,
    AddEpicEventArgs, AddOwnerEventArgs, AddParentSuiteEventArgs, AddSubSuiteEventArgs,
    AddLinkEventArgs, AddAllureIdEventArgs, AddSuiteEventArgs, AddTagEventArgs,
    AddStoryEventArgs, AddTestIdEventArgs, AllureReporterOptions } from './types.js'
import {
    TYPE as DescriptionType
} from './types.js'

export default class AllureReporter extends WDIOReporter {
    private _allure: AllureRuntime
    private _capabilities: Capabilities.RemoteCapability
    private _isMultiremote?: boolean
    private _config?: Options.Testrunner
    private _options: AllureReporterOptions
    private _consoleOutput: string
    private _originalStdoutWrite: Function

    _state: AllureReporterState

    _runningUnits: Array<AllureGroup | AllureTest | AllureStep> = []

    constructor(options: AllureReporterOptions = {}) {
        const { outputDir = 'allure-results', ...rest } = options

        super({
            ...rest,
            outputDir,
        })
        this._consoleOutput = ''
        this._originalStdoutWrite = process.stdout.write.bind(process.stdout)
        this._allure = new AllureRuntime({
            resultsDir: outputDir,
        })
        this._state = new AllureReporterState()
        this._capabilities = {}
        this._options = options

        this.registerListeners()

        const processObj:any = process

        if (options.addConsoleLogs) {
            processObj.stdout.write = (chunk: string, encoding: BufferEncoding, callback:  ((err?: Error) => void)) => {
                if (typeof chunk === 'string' && !chunk.includes('mwebdriver')) {
                    this._consoleOutput += chunk
                }

                return this._originalStdoutWrite(chunk, encoding, callback)
            }
        }
    }

    attachLogs() {
        if (!this._consoleOutput || !this._state.currentAllureTestOrStep) {
            return
        }

        const logsContent = `.........Console Logs.........\n\n${this._consoleOutput}`
        const attachmentFilename = this._allure.writeAttachment(logsContent, ContentType.TEXT)

        this._state.currentAllureTestOrStep.addAttachment(
            'Console Logs',
            {
                contentType: ContentType.TEXT,
            },
            attachmentFilename,
        )
    }

    attachFile(name: string, content: string | Buffer, contentType: ContentType) {
        if (!this._state.currentAllureTestOrStep) {
            throw new Error("There isn't any active test!")
        }

        const attachmentFilename = this._allure.writeAttachment(content, contentType)

        this._state.currentAllureTestOrStep.addAttachment(
            name,
            {
                contentType,
            },
            attachmentFilename
        )
    }

    attachJSON(name: string, json: any) {
        const isStr = typeof json === 'string'
        const content = isStr ? json : JSON.stringify(json, null, 2)

        this.attachFile(name, String(content), isStr ? ContentType.JSON : ContentType.TEXT)
    }

    attachScreenshot(name: string, content: Buffer) {
        this.attachFile(name, content, ContentType.PNG)
    }

    _startSuite(suiteTitle: string) {
        const newSuite: AllureGroup = this._state.currentSuite ? this._state.currentSuite.startGroup() : new AllureGroup(this._allure)

        newSuite.name = suiteTitle

        this._state.push(newSuite)
    }

    _endSuite() {
        if (!this._state.currentSuite) {
            throw new Error("There isn't any active suite!")
        }

        while (this._state.currentAllureTestOrStep) {
            const currentTest = this._state.pop() as AllureTest | AllureStep

            if (currentTest instanceof AllureTest) {
                currentTest.endTest()
            } else {
                currentTest.endStep()
            }
        }

        const currentSuite = this._state.pop() as AllureGroup

        currentSuite.endGroup()
    }

    _startTest(testTitle: string, cid?: string) {
        const newTest = this._state.currentSuite ? this._state.currentSuite.startTest() : new AllureTest(this._allure)

        newTest.name = testTitle

        this._state.push(newTest)
        this.setTestParameters(cid)
    }

    _skipTest() {
        if (!this._state.currentAllureTestOrStep) {
            return
        }

        const currentTest = this._state.pop() as AllureTest | AllureStep

        currentTest.stage = Stage.PENDING
        currentTest.status = AllureStatus.SKIPPED

        if (currentTest instanceof AllureTest) {
            currentTest.endTest()
        } else {
            currentTest.endStep()
        }
    }

    _endTest(status: AllureStatus, error?: Error) {
        if (!this._state.currentAllureTestOrStep) {
            return
        }

        const currentSpec = this._state.pop() as AllureTest | AllureStep

        currentSpec.stage = Stage.FINISHED
        currentSpec.status = status

        if (error) {
            currentSpec.detailsMessage = error.message
            currentSpec.detailsTrace = error.stack
        }

        if (currentSpec instanceof AllureTest) {
            currentSpec.endTest()
        } else {
            currentSpec.endStep()
        }
    }

    _startStep(testTitle: string) {
        if (!this._state.currentAllureTestOrStep) {
            throw new Error("There isn't any active test!")
        }

        const newStep = this._state.currentAllureTestOrStep.startStep(testTitle)

        this._state.push(newStep)
    }

    setTestParameters(cid?: string) {
        if (!this._state.currentTest) {
            return
        }

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

            if (!paramValue) {
                return
            }

            this._state.currentTest.addParameter(paramName, paramValue)
        } else {
            this._state.currentTest.addParameter('isMultiremote', 'true')
        }

        // Allure analytics labels. See https://github.com/allure-framework/allure2/blob/master/Analytics.md
        this._state.currentTest.addLabel(LabelName.LANGUAGE, 'javascript')
        this._state.currentTest.addLabel(LabelName.FRAMEWORK, 'wdio')

        if (this._state.currentPackageLabel) {
            this._state.currentTest.addLabel(LabelName.PACKAGE, this._state.currentPackageLabel)
        }

        if (cid) {
            this._state.currentTest.addLabel(LabelName.THREAD, cid)
        }

        if (!this._state.currentSuite) {
            return
        }

        // TODO: need to add ability to get labels from allure entitites
        // @ts-ignore
        const isFeaturePresent = this._state.currentTest.wrappedItem.labels.some((label: Label) => label.name === LabelName.FEATURE)

        this._state.currentTest.addLabel(LabelName.SUITE, this._state.currentSuite.name)

        if (isFeaturePresent) {
            return
        }

        this._state.currentTest.addLabel(LabelName.FEATURE, this._state.currentSuite.name)
    }

    registerListeners() {
        process.on(events.addLink, this.addLink.bind(this))
        process.on(events.addLabel, this.addLabel.bind(this))
        process.on(events.addAllureId, this.addAllureId.bind(this))
        process.on(events.addFeature, this.addFeature.bind(this))
        process.on(events.addStory, this.addStory.bind(this))
        process.on(events.addSeverity, this.addSeverity.bind(this))
        process.on(events.addSuite, this.addSuite.bind(this))
        process.on(events.addSubSuite, this.addSubSuite.bind(this))
        process.on(events.addOwner, this.addOwner.bind(this))
        process.on(events.addTag, this.addTag.bind(this))
        process.on(events.addParentSuite, this.addParentSuite.bind(this))
        process.on(events.addEpic, this.addEpic.bind(this))
        process.on(events.addIssue, this.addIssue.bind(this))
        process.on(events.addTestId, this.addTestId.bind(this))
        process.on(events.addEnvironment, this.addEnvironment.bind(this))
        process.on(events.addAttachment, this.addAttachment.bind(this))
        process.on(events.addDescription, this.addDescription.bind(this))
        process.on(events.startStep, this.startStep.bind(this))
        process.on(events.endStep, this.endStep.bind(this))
        process.on(events.addStep, this.addStep.bind(this))
        process.on(events.addArgument, this.addArgument.bind(this))
        process.on(events.addAllureStep, this.addAllureStep.bind(this))
    }

    onRunnerStart(runner: RunnerStats) {
        this._config = runner.config
        this._capabilities = runner.capabilities
        this._isMultiremote = runner.isMultiremote || false
    }

    onSuiteStart(suite: SuiteStats) {
        const { useCucumberStepReporter } = this._options
        const isScenario = suite.type === 'scenario'
        const isFeature = suite.type === 'feature'

        this._state.currentFile = suite.file

        // handle cucumber scenario as allure "case" instead of "suite"
        if (useCucumberStepReporter && isScenario) {
            this._startTest(suite.title, suite.cid)

            getSuiteLabels(suite).forEach((label: Label) => {
                switch (label.name) {
                case 'issue':
                    this.addIssue({ issue: label.value })
                    break
                case 'testId':
                    this.addTestId({ testId: label.value })
                    break
                default:
                    this.addLabel(label)
                }
            })

            if (suite.description) {
                this.addDescription(suite)
            }

            return
        }

        const prefix = this._state.currentSuite ? this._state.currentSuite.name + ': ' : ''
        const suiteTitle = isFeature ? suite.title : prefix + suite.title

        this._startSuite(suiteTitle)
    }

    onSuiteEnd(suite: SuiteStats) {
        const { useCucumberStepReporter } = this._options
        const isScenario = suite.type === 'scenario'

        this._state.currentFile = undefined

        if (useCucumberStepReporter && isScenario) {
            // passing hooks are missing the 'state' property
            suite.hooks = suite.hooks!.map((hook) => {
                hook.state = hook.state || AllureStatus.PASSED
                return hook
            })

            const suiteChildren = [...suite.tests!, ...suite.hooks]

            // A scenario is it skipped if every steps are skipped and hooks are passed or skipped
            const isSkipped = suite.tests.every(item => [AllureStatus.SKIPPED].includes(item.state as AllureStatus)) && suite.hooks.every(item => [AllureStatus.PASSED, AllureStatus.SKIPPED].includes(item.state as AllureStatus))

            if (isSkipped) {
                const currentTest = this._state.pop() as AllureTest

                currentTest.status = AllureStatus.SKIPPED
                currentTest.stage = Stage.PENDING
                currentTest.endTest()
                return
            }

            const isFailed = suiteChildren.some(item => item.state === AllureStatus.FAILED)

            if (isFailed) {
                const currentTest = this._state.pop() as AllureTest

                currentTest.status = AllureStatus.FAILED
                currentTest.stage = Stage.FINISHED
                currentTest.endTest()
                return
            }

            const isPassed = suiteChildren.every(item => item.state === AllureStatus.PASSED)
            // A scenario is it passed if certain steps are passed and all other are skipped and every hooks are passed or skipped
            const isPartiallySkipped = suiteChildren.every(item => [AllureStatus.PASSED, AllureStatus.SKIPPED].includes(item.state as AllureStatus))

            if (isPassed || isPartiallySkipped) {
                const currentTest = this._state.pop() as AllureTest

                currentTest.status = AllureStatus.PASSED
                currentTest.stage = Stage.FINISHED
                currentTest.endTest()
                return
            }

            // Only close passing and skipped tests because
            // failing tests are closed in onTestFailed event
            return
        }

        this._endSuite()
    }

    onTestStart(test: TestStats | HookStats) {
        const { useCucumberStepReporter } = this._options

        this._consoleOutput = ''

        const testTitle = test.currentTest ? test.currentTest : test.title

        if (this._state.currentTest?.wrappedItem.name === testTitle) {
            // Test already in progress, most likely started by a before each hook
            return
        }

        if (useCucumberStepReporter) {
            const testObj = test as TestStats
            const argument = testObj?.argument as Argument
            const dataTable = argument?.rows?.map((a: { cells: string[] }) => a?.cells)

            this._startStep(testTitle)

            if (dataTable) {
                this.attachFile('Data Table', stringify(dataTable), ContentType.CSV)
            }
            return
        }

        this._startTest(testTitle, test.cid)
    }

    onTestPass() {
        this.attachLogs()
        this._endTest(AllureStatus.PASSED)
    }

    onTestFail(test: TestStats | HookStats) {
        const { useCucumberStepReporter } = this._options

        if (useCucumberStepReporter) {
            this.attachLogs()

            const testStatus = getTestStatus(test, this._config)

            this._endTest(testStatus, getErrorFromFailedTest(test))
            return
        }

        if (!this._state.currentAllureTestOrStep) {
            this.onTestStart(test)
        } else {
            this._state.currentAllureTestOrStep.name = test.title
        }

        this.attachLogs()

        const status = getTestStatus(test, this._config)

        this._endTest(status, getErrorFromFailedTest(test))
    }

    onTestSkip(test: TestStats) {
        this.attachLogs()

        if (!this._state.currentAllureTestOrStep || this._state.currentAllureTestOrStep.wrappedItem.name !== test.title) {
            this._startTest(test.title, test.cid)
            this._skipTest()
            return
        }

        this._skipTest()
    }

    onBeforeCommand(command: BeforeCommandArgs) {
        if (!this._state.currentAllureTestOrStep) {
            return
        }

        const { disableWebdriverStepsReporting } = this._options

        if (disableWebdriverStepsReporting || this._isMultiremote) {
            return
        }

        const stepName = command.method ? `${command.method} ${command.endpoint}` : command.command as string
        const payload = command.body || command.params

        this._startStep(stepName)

        if (!isEmpty(payload)) {
            this.attachJSON('Request', payload)
        }
    }

    onAfterCommand(command: AfterCommandArgs) {
        const { disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting } = this._options

        if (!this._state.currentAllureTestOrStep || this._isMultiremote) {
            return
        }

        const isScreenshot = isScreenshotCommand(command)
        const { value: commandResult } = command?.result || {}

        if (!disableWebdriverScreenshotsReporting && isScreenshot && commandResult) {
            this.attachScreenshot('Screenshot', Buffer.from(commandResult, 'base64'))
        }

        if (!disableWebdriverStepsReporting) {
            this.attachJSON('Response', commandResult)
            this._endTest(AllureStatus.PASSED)
        }
    }

    onHookStart(hook: HookStats) {
        const { disableMochaHooks } = this._options

        // ignore global hooks
        if (!hook.parent || !this._state.currentSuite) {
            return
        }

        const isMochaAllHook = isMochaAllHooks(hook.title)
        const isMochaEachHook = isMochaEachHooks(hook.title)

        // don't add hook as test to suite for mocha each hooks if no current test
        if (disableMochaHooks && isMochaEachHook && !this._state.currentAllureTestOrStep) {
            return
        }

        // add beforeEach / afterEach hook as step to test
        if (disableMochaHooks && isMochaEachHook && this._state.currentAllureTestOrStep) {
            this._startStep(hook.title)
            return
        }

        // don't add hook as test to suite for mocha All hooks
        if (disableMochaHooks && isMochaAllHook) {
            return
        }

        // add hook as test to suite
        this.onTestStart(hook)
    }

    onHookEnd(hook: HookStats) {
        const { disableMochaHooks } = this._options

        // ignore global hooks
        if (!hook.parent || !this._state.currentSuite) {
            return
        }

        const isMochaAllHook = isMochaAllHooks(hook.title)
        const isMochaEachHook = isMochaEachHooks(hook.title)

        if (disableMochaHooks && !isMochaAllHook && !this._state.currentAllureTestOrStep) {
            return
        }

        // set beforeEach / afterEach hook (step) status
        if (disableMochaHooks && isMochaEachHook) {
            this._endTest(hook.error ? AllureStatus.FAILED : AllureStatus.PASSED, hook.error)
            return
        }

        if (hook.error) {
            // add hook as test to suite for mocha all hooks, when it didn't start before
            if (disableMochaHooks && isMochaAllHooks(hook.title)) {
                this.onTestStart(hook)
            }

            this.onTestFail(hook)
            return
        }

        this.onTestPass()
    }

    addLabel({
        name,
        value
    }: AddLabelEventArgs) {
        if (!this._state.currentTest) {
            return
        }

        this._state.currentTest.addLabel(name, value)
    }

    addLink({
        name,
        url,
        type,
    }: AddLinkEventArgs) {
        if (!this._state.currentTest) {
            return
        }

        this._state.currentTest.addLink(url, name, type)
    }

    addAllureId({
        id,
    }: AddAllureIdEventArgs) {
        this.addLabel({
            name: LabelName.AS_ID,
            value: id,
        })
    }

    addStory({
        storyName
    }: AddStoryEventArgs) {
        this.addLabel({
            name: LabelName.STORY,
            value: storyName,
        })
    }

    addFeature({
        featureName
    }: AddFeatureEventArgs) {
        this.addLabel({
            name: LabelName.FEATURE,
            value: featureName,
        })
    }

    addSeverity({
        severity
    }: AddSeverityEventArgs) {
        this.addLabel({
            name: LabelName.SEVERITY,
            value: severity,
        })
    }

    addEpic({
        epicName,
    }: AddEpicEventArgs) {
        this.addLabel({
            name: LabelName.EPIC,
            value: epicName,
        })
    }

    addOwner({
        owner,
    }: AddOwnerEventArgs) {
        this.addLabel({
            name: LabelName.OWNER,
            value: owner,
        })
    }

    addSuite({
        suiteName,
    }: AddSuiteEventArgs) {
        this.addLabel({
            name: LabelName.SUITE,
            value: suiteName,
        })
    }

    addParentSuite({
        suiteName,
    }: AddParentSuiteEventArgs) {
        this.addLabel({
            name: LabelName.PARENT_SUITE,
            value: suiteName,
        })
    }

    addSubSuite({
        suiteName,
    }: AddSubSuiteEventArgs) {
        this.addLabel({
            name: LabelName.SUB_SUITE,
            value: suiteName,
        })
    }

    addTag({
        tag,
    }: AddTagEventArgs) {
        this.addLabel({
            name: LabelName.TAG,
            value: tag,
        })
    }

    addTestId({
        testId,
        linkName,
    }: AddTestIdEventArgs) {
        if (!this._options.tmsLinkTemplate) {
            this.addLabel({
                name: 'tms',
                value: testId
            })
            return
        }

        const tmsLink = getLinkByTemplate(this._options.tmsLinkTemplate, testId)

        this.addLink({
            url: tmsLink,
            name: linkName,
            type: LinkType.TMS
        })
    }

    addIssue({
        issue,
        linkName,
    }: AddIssueEventArgs) {
        if (!this._options.issueLinkTemplate) {
            this.addLabel({
                name: 'issue',
                value: issue,
            })
            return
        }

        const issueLink = getLinkByTemplate(this._options.issueLinkTemplate, issue)

        this.addLink({
            url: issueLink,
            name: linkName,
            type: LinkType.ISSUE
        })
    }

    addEnvironment({
        name,
        value
    }: AddEnvironmentEventArgs) {
        this._allure.writeEnvironmentInfo({
            [name]: value,
        })
    }

    addDescription({
        description,
        descriptionType
    }: AddDescriptionEventArgs) {
        if (!this._state.currentTest) {
            return
        }

        if (descriptionType === DescriptionType.HTML) {
            this._state.currentTest.descriptionHtml = description
            return
        }

        this._state.currentTest.description = description
    }

    addAttachment({
        name,
        content,
        type = ContentType.TEXT
    }: AddAttachmentEventArgs) {
        if (!this._state.currentTest) {
            return
        }

        if (type === ContentType.JSON) {
            this.attachJSON(name, content)
            return
        }

        this.attachFile(name, Buffer.from(content as string), type as ContentType)
    }

    startStep(title: string) {
        if (!this._state.currentAllureTestOrStep) {
            return
        }

        this._startStep(title)
    }

    endStep(status: AllureStatus) {
        if (!this._state.currentAllureTestOrStep) {
            return
        }

        this._endTest(status)
    }

    addStep({
        step
    }: any) {
        if (!this._state.currentAllureTestOrStep) {
            return
        }

        this._startStep(step.title)

        if (step.attachment) {
            this.attachFile(step.attachment.name, step.attachment.content, step.attachment.type || ContentType.TEXT)
        }

        this._endTest(step.status)
    }

    addArgument({
        name,
        value
    }: any) {
        if (!this._state.currentTest) {
            return
        }

        this._state.currentTest.addParameter(name, value)
    }

    addAllureStep(metadata: MetadataMessage) {
        const { currentAllureTestOrStep: currentAllureSpec } = this._state

        if (!currentAllureSpec) {
            throw new Error("Couldn't add step: no test case running!")
        }

        const {
            attachments = [],
            labels = [],
            links = [],
            parameter = [],
            steps = [],
            description,
            descriptionHtml,
        } = metadata

        if (description) {
            this.addDescription({
                description,
                descriptionType: DescriptionType.MARKDOWN
            })
        }

        if (descriptionHtml) {
            this.addDescription({
                description: descriptionHtml,
                descriptionType: DescriptionType.HTML
            })
        }

        labels.forEach((label) => {
            this.addLabel(label)
        })
        parameter.forEach((param) => {
            this.addArgument(param)
        })
        links.forEach((link) => {
            this.addLink(link)
        })
        attachments.forEach((attachment) => {
            this.addAttachment(attachment)
        })
        steps.forEach((step) => {
            currentAllureSpec.addStep(AllureCommandStepExecutable.toExecutableItem(this._allure, step))
        })
    }

    /**
     * public API attached to the reporter
     * deprecated approach and only here for backwards compatibility
     */
    static addFeature = addFeature
    static addLink = addLink
    static addEpic = addEpic
    static addOwner = addOwner
    static addTag = addTag
    static addLabel = addLabel
    static addSeverity = addSeverity
    static addIssue = addIssue
    static addSuite = addSuite
    static addSubSuite = addSubSuite
    static addParentSuite = addParentSuite
    static addTestId = addTestId
    static addStory = addStory
    static addEnvironment = addEnvironment
    static addDescription = addDescription
    static addAttachment = addAttachment
    static startStep = startStep
    static endStep = endStep
    static addStep = addStep
    static addArgument = addArgument
    static addAllureId = addAllureId
    static step = step
}

import { stringify } from 'csv-stringify/sync'
import type {
    SuiteStats, HookStats, RunnerStats, TestStats, BeforeCommandArgs,
    AfterCommandArgs, Argument
} from '@wdio/reporter'
import { getBrowserName } from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import type { Capabilities, Options } from '@wdio/types'
import type { Label, MetadataMessage } from 'allure-js-commons'
import {
    AllureRuntime, AllureGroup, AllureTest, Status as AllureStatus, Stage, LabelName,
    LinkType, ContentType, AllureCommandStepExecutable, ExecutableItemWrapper, AllureStep, Status
} from 'allure-js-commons'
import {
    addFeature, addLink, addOwner, addEpic, addSuite, addSubSuite, addParentSuite,
    addTag, addLabel, addSeverity, addIssue, addTestId, addStory, addAllureId,
    addDescription, addAttachment, startStep, endStep, addStep, addArgument, step,
} from './common/api.js'
import { AllureReporterState } from './state.js'
import {
    getTestStatus, isEmpty, isEachTypeHooks, getErrorFromFailedTest,
    isAllTypeHooks, getLinkByTemplate, isScreenshotCommand, getSuiteLabels, setAllureIds, isBeforeTypeHook, cleanCucumberHooks, getHookStatus
} from './utils.js'
import { events } from './constants.js'
import type {
    AddAttachmentEventArgs, AddDescriptionEventArgs,
    AddFeatureEventArgs, AddIssueEventArgs, AddLabelEventArgs, AddSeverityEventArgs,
    AddEpicEventArgs, AddOwnerEventArgs, AddParentSuiteEventArgs, AddSubSuiteEventArgs,
    AddLinkEventArgs, AddAllureIdEventArgs, AddSuiteEventArgs, AddTagEventArgs,
    AddStoryEventArgs, AddTestIdEventArgs, AllureReporterOptions, AllureStepableUnit } from './types.js'
import {
    TYPE as DescriptionType
} from './types.js'
import type { BeforeCommand, CustomCommand } from 'node_modules/@wdio/reporter/build/types.js'

export default class AllureReporter extends WDIOReporter {
    private _allure: AllureRuntime
    private _capabilities: Capabilities.ResolvedTestrunnerCapabilities
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const processObj: any = process

        if (options.addConsoleLogs) {
            processObj.stdout.write = (chunk: string, encoding: BufferEncoding, callback:  ((err?: Error) => void)) => {
                if (typeof chunk === 'string' && !chunk.includes('mwebdriver')) {
                    this._consoleOutput += chunk
                }

                return this._originalStdoutWrite(chunk, encoding, callback)
            }
        }

        const { reportedEnvironmentVars } = this._options
        if (reportedEnvironmentVars) {
            this._allure.writeEnvironmentInfo(reportedEnvironmentVars)
        }
    }

    attachLogs() {
        if (!this._consoleOutput || !this._state.currentAllureStepableEntity) {
            return
        }

        const logsContent = `.........Console Logs.........\n\n${this._consoleOutput}`
        const attachmentFilename = this._allure.writeAttachment(logsContent, ContentType.TEXT)

        this._state.currentAllureStepableEntity.addAttachment(
            'Console Logs',
            {
                contentType: ContentType.TEXT,
            },
            attachmentFilename,
        )
    }

    attachFile(name: string, content: string | Buffer, contentType: ContentType) {
        if (!this._state.currentAllureStepableEntity) {
            throw new Error("There isn't any active test!")
        }

        const attachmentFilename = this._allure.writeAttachment(content, contentType)

        this._state.currentAllureStepableEntity.addAttachment(
            name,
            {
                contentType,
            },
            attachmentFilename
        )
    }

    attachJSON(name: string, json: unknown) {
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

        while (this._state.currentAllureStepableEntity) {
            const currentElement = this._state.pop() as | AllureGroup | AllureStepableUnit
            if (!(currentElement instanceof AllureGroup)) {
                const isAnyStepFailed = currentElement.wrappedItem.steps.some((step) => step.status === AllureStatus.FAILED)
                const isAnyStepBroken = currentElement.wrappedItem.steps.some((step) => step.status === AllureStatus.BROKEN)

                currentElement.stage = Stage.FINISHED
                currentElement.status = isAnyStepFailed
                    ? AllureStatus.FAILED
                    : isAnyStepBroken
                        ? AllureStatus.BROKEN
                        : AllureStatus.PASSED
            }

            if (currentElement instanceof AllureTest) {
                setAllureIds(currentElement, this._state.currentSuite)
                currentElement.endTest()
            } else if (currentElement instanceof AllureStep) {
                currentElement.endStep()
            }
        }

        const currentSuite = this._state.pop() as AllureGroup
        // if a hook were execute without a test the report will need a test to display the hook
        if (this._state.stats.hooks > 0 && this._state.stats.test === 0) {
            const test = currentSuite.startTest(currentSuite.name)
            test.status = Status.BROKEN
            test.endTest()
        }
        currentSuite.endGroup()
    }

    _startTest(testTitle: string, cid?: string) {
        const newTest = this._state.currentSuite ? this._state.currentSuite.startTest() : new AllureTest(this._allure)

        newTest.name = testTitle

        this._state.push(newTest)
        this.setTestParameters(cid)
    }

    _skipTest() {
        if (!this._state.currentAllureStepableEntity) {
            return
        }

        const currentTest = this._state.pop() as AllureTest | AllureStep

        currentTest.stage = Stage.PENDING
        currentTest.status = AllureStatus.SKIPPED

        if (currentTest instanceof AllureTest) {
            setAllureIds(currentTest, this._state.currentSuite)
            currentTest.endTest()
        } else {
            currentTest.endStep()
        }
    }

    _endTest(status: AllureStatus, error?: Error, stage?: Stage) {
        if (!this._state.currentAllureStepableEntity) {
            return
        }

        const currentSpec = this._state.pop() as AllureStepableUnit

        currentSpec.stage = stage ?? Stage.FINISHED
        currentSpec.status = status

        if (error) {
            currentSpec.detailsMessage = error.message
            currentSpec.detailsTrace = error.stack

            // if some step or sub step fails the current test will fails.
            if (this._state.currentTest) {
                this._state.currentTest.statusDetails = { message: error.message, trace: error.stack }
            }
        }

        if (currentSpec instanceof AllureTest) {
            setAllureIds(currentSpec, this._state.currentSuite)
            currentSpec.endTest()
        } else if (currentSpec instanceof AllureStep) {
            currentSpec.endStep()
        }
    }

    _startStep(testTitle: string): void {
        if (!this._state.currentAllureStepableEntity) {
            throw new Error('There are no active steppable entities!')
        }

        const newStep = this._state.currentAllureStepableEntity.startStep(testTitle)

        this._state.push(newStep)
    }

    setTestParameters(cid?: string) {
        if (!this._state.currentTest) {
            return
        }

        if (!this._isMultiremote) {
            const caps = this._capabilities
            // @ts-expect-error outdated JSONWP capabilities
            const { desired, device } = caps
            // @ts-expect-error outdated JSONWP capabilities
            const deviceName = (desired || {}).deviceName || (desired || {})['appium:deviceName'] || caps.deviceName || caps['appium:deviceName']
            let targetName = device || getBrowserName(caps) || deviceName || cid
            // custom mobile grids can have device information in a `desired` cap
            if (desired && deviceName && desired['appium:platformVersion']) {
                targetName = `${device || deviceName} ${desired['appium:platformVersion']}`
            }
            // @ts-expect-error outdated JSONWP capabilities
            const browserstackVersion = caps.os_version || caps.osVersion
            // @ts-expect-error outdated JSONWP capabilities
            const version = browserstackVersion || caps.browserVersion || caps.version || caps['appium:platformVersion'] || ''
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

        // handle a cucumber scenario as allure "case" instead of "suite"
        if (useCucumberStepReporter && isScenario) {
            this._startTest(suite.title, suite.cid)

            getSuiteLabels(suite).forEach((label: Label) => {
                switch (label.name) {
                case 'issue':
                    this.addIssue({ issue: label.value, linkName: label.value  })
                    break
                case 'testId':
                    this.addTestId({ testId: label.value, linkName: label.value  })
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
                this._endTest(AllureStatus.SKIPPED, undefined, Stage.PENDING)
                return
            }

            const isFailed = suiteChildren.find(item => item.state === AllureStatus.FAILED)

            if (isFailed) {
                const testStatus = getTestStatus(isFailed)
                const error = getErrorFromFailedTest(isFailed)

                this._endTest(testStatus, error)
                return
            }

            const isPassed = suiteChildren.every(item => item.state === AllureStatus.PASSED)
            // A scenario is it passed if certain steps are passed and all other are skipped and every hooks are passed or skipped
            const isPartiallySkipped = suiteChildren.every(item => [AllureStatus.PASSED, AllureStatus.SKIPPED].includes(item.state as AllureStatus))

            if (isPassed || isPartiallySkipped) {
                this._endTest(AllureStatus.PASSED)
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

        if (useCucumberStepReporter) {
            const testObj = test as TestStats
            const argument = testObj?.argument as Argument
            const dataTable = argument?.rows?.map((a: { cells: string[] }) => a?.cells)

            this._startStep(test.title)

            if (dataTable) {
                this.attachFile('Data Table', stringify(dataTable), ContentType.CSV)
            }
            return
        }

        this._startTest(test.title, test.cid)
    }

    onTestPass() {
        this.attachLogs()
        this._endTest(AllureStatus.PASSED)
    }

    onTestRetry(test: TestStats) {
        this.attachLogs()

        const status = getTestStatus(test, this._config)

        this._endTest(status, getErrorFromFailedTest(test))
    }

    onTestFail(test: TestStats | HookStats) {
        const { useCucumberStepReporter } = this._options

        if (useCucumberStepReporter) {
            this.attachLogs()

            const testStatus = getTestStatus(test, this._config)

            this._endTest(testStatus, getErrorFromFailedTest(test))
            return
        }

        if (!this._state.currentAllureStepableEntity) {
            this.onTestStart(test)
        } else  if (this._state.currentAllureStepableEntity instanceof AllureTest){
            this._state.currentAllureStepableEntity.name = test.title
        }

        this.attachLogs()

        const status = getTestStatus(test, this._config)

        this._endTest(status, getErrorFromFailedTest(test))
    }

    onTestSkip(test: TestStats) {
        const { useCucumberStepReporter } = this._options
        this.attachLogs()

        if (
            !this._state.currentAllureStepableEntity || this._state.currentAllureStepableEntity.wrappedItem.name !==
                test.title
        ) {
            if (useCucumberStepReporter) {
                this.onTestStart(test)
            } else {
                this._startTest(test.title, test.cid)
            }
        }

        this._skipTest()
    }

    onBeforeCommand(beforeCommand: BeforeCommandArgs) {
        if (!this._state.currentAllureStepableEntity) {
            return
        }

        const { disableWebdriverStepsReporting } = this._options

        if (disableWebdriverStepsReporting || this._isMultiremote) {
            return
        }
        let stepName: string | undefined
        let payload: string | undefined

        // Processing custom commands
        if ('name' in beforeCommand) {
            const command = beforeCommand as CustomCommand
            stepName = command.name
            payload = command.args ? command.args.join(', ') : undefined
        }

        // Processing standard commands
        if ( 'method' in beforeCommand || 'endpoint' in beforeCommand || 'command' in beforeCommand) {
            const command = beforeCommand as BeforeCommand
            const { method, endpoint } = beforeCommand

            stepName = command.command ? command.command : `${method} ${endpoint}`
            payload = command.body?.toString() || command.params?.toString()
        }

        if (stepName) {
            this._startStep(stepName as string)

            if (typeof payload === 'object' && !isEmpty(payload as object)) {
                this.attachJSON('Request', payload)
            }
        }
    }

    onAfterCommand(command: AfterCommandArgs) {
        const { disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting } = this._options

        const commandResult = (
            (command?.result as { value?: unknown } | undefined)?.value ||
            (command?.result as { error?: Error } | undefined)?.error?.name ||
            {}
        )
        const isScreenshot = isScreenshotCommand(command)
        if (!disableWebdriverScreenshotsReporting && isScreenshot && commandResult) {
            this.attachScreenshot('Screenshot', Buffer.from(commandResult as string, 'base64'))
        }

        if (disableWebdriverStepsReporting || this._isMultiremote || !this._state.currentStep) {
            return
        }

        this.attachJSON('Response', commandResult)
        this.endStep(AllureStatus.PASSED)
    }

    onHookStart(hook: HookStats) {
        const { disableMochaHooks, useCucumberStepReporter } = this._options

        // ignore global hooks or hooks when option is set in false
        // any hook is skipped if there is not a suite created.
        if (!hook.parent || !this._state.currentSuite || disableMochaHooks) {
            return
        }

        const isAllHook = isAllTypeHooks(hook.title) // if the hook is beforeAll or afterAll for mocha/jasmine
        const isEachHook = isEachTypeHooks(hook.title) // if the hook is beforeEach or afterEach for mocha/jasmine

        // if the hook is before/after from mocha/jasmine
        if (isAllHook || isEachHook) {
            const hookExecutable = isBeforeTypeHook(hook.title)
                ? this._state.currentSuite.addBefore()
                : this._state.currentSuite.addAfter()
            const hookStep = hookExecutable.startStep(hook.title)
            this._state.push(hookExecutable)
            this._state.push(hookStep)
            // if the hook is custom by default, it will be reported as test (not usual)
        } else if (!(isAllHook || isEachHook) && !useCucumberStepReporter) {
            const customHookTest = this._state.currentSuite.startTest(
                `hook:${hook.title}`,
            )
            this._state.push(customHookTest)
            // hooks in cucumber mode will be treated as Test/Step
        } else if (useCucumberStepReporter) {
            this.onTestStart(hook)
        }
    }

    onHookEnd(hook: HookStats) {
        const { disableMochaHooks, useCucumberStepReporter } = this._options

        // ignore global hooks
        // any hook is skipped if there is not a suite created.
        if (!hook.parent || !this._state.currentSuite) {
            return
        }

        const isAllHook = isAllTypeHooks(hook.title) // if the hook is beforeAll or afterAll for mocha/jasmine
        const isEachHook = isEachTypeHooks(hook.title) // if the hook is beforeEach or afterEach for mocha/jasmine

        /****
         * if the hook is before/after from mocha/jasmine and disableMochaHooks=false.
         */
        // if the hook is before/after from mocha/jasmine and disableMochaHooks=false.
        if ((isAllHook || isEachHook) && !disableMochaHooks) {
            // getting the hook root step, and the hook element from stack.
            const currentHookRootStep = this._state.pop()
            const currentHookRoot = this._state.pop()
            // check if the elements exist
            if (currentHookRootStep || currentHookRoot) {
                // check if the elements related to hook
                if (
                    currentHookRootStep instanceof AllureStep &&
                    currentHookRoot instanceof ExecutableItemWrapper
                ) {
                    getHookStatus(hook, currentHookRoot, currentHookRootStep)
                    currentHookRootStep.endStep()

                    if (isBeforeTypeHook(hook.title) && (hook.error || hook.errors?.length)) {
                        this._startTest(hook.currentTest || hook.title, hook.cid)
                        this._endTest(AllureStatus.BROKEN, getErrorFromFailedTest(hook))
                    }

                    return
                }
                // put them back to the list
                if (currentHookRoot) {
                    this._state.push(currentHookRoot)
                }
                if (currentHookRootStep) {
                    this._state.push(currentHookRootStep)
                }
            }
        }

        /****
         * if the hook is before/after from mocha/jasmine or cucumber by setting useCucumberStepReporter=true,
         * and disableMochaHooks=true with a failed hook.
         *
         * Only if the hook fails, it will be reported.
         */
        if (disableMochaHooks && hook.error) {
            // hook is from cucumber
            if (useCucumberStepReporter){
                // report a new allure hook (step)
                this.onTestStart(hook)
                // set the hook as failed one
                this.onTestFail(hook)

                // remove cucumber hook (reported as step) from suite if it has no steps or attachments.
                const currentItem = this._state.currentAllureStepableEntity?.wrappedItem

                if (currentItem) {
                    cleanCucumberHooks(currentItem)
                }
                return
            }

            // hook is before/after from mocha/jasmine
            const hookExecutable = isBeforeTypeHook(hook.title)
                ? this._state.currentSuite.addBefore()
                : this._state.currentSuite.addAfter()
            const hookStep = hookExecutable.startStep(hook.title)

            // register the hook
            this._state.stats.hooks++

            // updating the hook information
            getHookStatus(hook, hookExecutable, hookStep)
            hookStep.endStep()
            return
        }

        /****
         * if the hook is not before/after from mocha/jasmine (custom hook) and useCucumberStepReporter=false
         * Custom hooks are not affected by "disableMochaHooks" option
         */
        if (!(isAllHook || isEachHook) && !useCucumberStepReporter) {
            // getting the latest element
            const lastElement = this._state.pop()
            if (lastElement) {
                const isCustomHook =
                    lastElement instanceof AllureTest &&
                    lastElement.wrappedItem.name?.startsWith('hook:')
                this._state.push(lastElement)
                if (isCustomHook) {
                    // we end the test case (custom hook) that represents the custom hook call.
                    this._endTest(getTestStatus(hook), hook.error)
                }
            }
            return
        }

        /****
         * if the hook comes from Cucumber useCucumberStepReporter=true
         */
        if (useCucumberStepReporter && !disableMochaHooks) {
            // closing the cucumber hook (in this case, it's reported as a step)
            if (hook.error) {
                this.onTestFail(hook)
            } else {
                this.onTestPass()
            }

            // remove cucumber hook (reported as a step) from a suite if it has no steps or attachments.
            const currentItem = this._state.currentAllureStepableEntity?.wrappedItem

            if (currentItem) {
                cleanCucumberHooks(currentItem)
            }
            return
        }

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
            name: linkName || 'tms',
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
        if (!this._state.currentAllureStepableEntity) {
            return
        }

        if (type === ContentType.JSON) {
            this.attachJSON(name, content)
            return
        }

        this.attachFile(name, Buffer.from(content as string), type as ContentType)
    }

    startStep(title: string) {
        if (!this._state.currentAllureStepableEntity) {
            return
        }

        this._startStep(title)
    }

    endStep(status: AllureStatus) {
        if (!this._state.currentAllureStepableEntity) {
            return
        }

        this._endTest(status)
    }

    addStep({
        step
    }: { step: { title: string, attachment: { name: string, content: string, type: ContentType }, status: AllureStatus } }) {
        if (!this._state.currentAllureStepableEntity) {
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
    }: { name: string, value: string }) {
        if (!this._state.currentTest) {
            return
        }

        this._state.currentTest.addParameter(name, value)
    }

    addAllureStep(metadata: MetadataMessage) {
        const { currentAllureStepableEntity: currentAllureSpec } = this._state

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
    static addDescription = addDescription
    static addAttachment = addAttachment
    static startStep = startStep
    static endStep = endStep
    static addStep = addStep
    static addArgument = addArgument
    static addAllureId = addAllureId
    static step = step
}

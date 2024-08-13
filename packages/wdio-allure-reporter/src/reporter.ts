import { sep } from 'node:path'
import { stringify } from 'csv-stringify/sync'
import type {
    AfterCommandArgs,
    Argument,
    BeforeCommandArgs,
    HookStats,
    RunnerStats,
    SuiteStats,
    TestStats,
} from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
// import { WdioTestRuntime, ALLURE_RUNTIME_MESSAGE_EVENT } from './WdioTestRuntime.js'
import type { Capabilities, Options } from '@wdio/types'
// import type { Label, MetadataMessage } from 'allure-js-commons'
// import {
//     AllureRuntime, AllureGroup, AllureTest, Status as AllureStatus, Stage, LabelName,
//     LinkType, ContentType, AllureCommandStepExecutable, ExecutableItemWrapper, AllureStep, Status
// } from 'allure-js-commons'
import { ContentType, LabelName, LinkType, Stage, Status as AllureStatus } from 'allure-js-commons'
import { FileSystemWriter, getSuiteLabels, ReporterRuntime } from 'allure-js-commons/sdk/reporter'
// import { setGlobalTestRuntime } from 'allure-js-commons/sdk/runtime'
import {
    addAllureId,
    addArgument,
    addAttachment,
    addDescription,
    addEpic,
    addFeature,
    addIssue,
    addLabel,
    addLink,
    addOwner,
    addParentSuite,
    addSeverity,
    addStep,
    addStory,
    addSubSuite,
    addSuite,
    addTag,
    addTestId,
    endStep,
    startStep,
    step,
} from './common/api.js'
import {
    getErrorFromFailedTest,
    getLinkByTemplate,
    getTestStatus,
    convertSuiteTagsToLabels,
    isAllTypeHooks,
    isEachTypeHooks,
    last,
} from './utils.js'
import type {
    AddAllureIdEventArgs,
    AddAttachmentEventArgs,
    AddDescriptionEventArgs,
    AddEpicEventArgs,
    AddFeatureEventArgs,
    AddIssueEventArgs,
    AddLabelEventArgs,
    AddLinkEventArgs,
    AddOwnerEventArgs,
    AddParentSuiteEventArgs,
    AddSeverityEventArgs,
    AddStoryEventArgs,
    AddSubSuiteEventArgs,
    AddSuiteEventArgs,
    AddTagEventArgs,
    AddTestIdEventArgs,
    AllureReporterOptions,
} from './types.js'
// import { TYPE as DescriptionType } from './types.js'

// TODO:

export default class AllureReporter extends WDIOReporter {
    private _allureRuntime: ReporterRuntime
    private _allureScopesStack: string[] = []
    private _allureExecutablesStack: string[] = []

    private _capabilities: Capabilities.ResolvedTestrunnerCapabilities
    private _isMultiremote?: boolean
    private _config?: Options.Testrunner
    private _options: AllureReporterOptions
    private _consoleOutput: string
    private _originalStdoutWrite: Function
    private _currentFile?: string

    // _state: AllureReporterState

    // _runningUnits: Array<AllureGroup | AllureTest | AllureStep> = []

    constructor(options: AllureReporterOptions = {}) {
        const { outputDir = 'allure-results', ...rest } = options

        super({
            ...rest,
            outputDir,
        })
        this._consoleOutput = ''
        this._originalStdoutWrite = process.stdout.write.bind(process.stdout)

        // TODO:
        this._allureRuntime = new ReporterRuntime({
            environmentInfo: options.reportedEnvironmentVars,
            writer: new FileSystemWriter({
                resultsDir: outputDir,
            }),
        })

        this._capabilities = {}
        this._options = options

        // TODO: this thing will process events from TestRuntime, how do we can inject the runtime?
        // this.registerListeners()

        const processObj: any = process

        if (options.addConsoleLogs) {
            processObj.stdout.write = (
                chunk: string,
                encoding: BufferEncoding,
                callback: (err?: Error) => void
            ) => {
                if (
                    typeof chunk === 'string' &&
                    !chunk.includes('mwebdriver')
                ) {
                    this._consoleOutput += chunk
                }

                return this._originalStdoutWrite(chunk, encoding, callback)
            }
        }

        // setGlobalTestRuntime(new WdioTestRuntime())
    }

    attachFile(
        name: string,
        content: string | Buffer,
        contentType: ContentType
    ) {
        const currentExecutableUuid = last(this._allureExecutablesStack)

        const attachmentStepUuid = this._allureRuntime.startStep(currentExecutableUuid, undefined, {
            name,
        })!

        this._allureRuntime.writeAttachment(attachmentStepUuid, undefined, name, content, {
            contentType,
        })
        this._allureRuntime.stopStep(attachmentStepUuid)
    }

    attachLogs() {
        const currentExecutableUuid = last(this._allureExecutablesStack)

        if (!this._consoleOutput || !currentExecutableUuid) {
            return
        }

        const logsContent = `.........Console Logs.........\n\n${this._consoleOutput}`

        this.attachFile('Console Logs', logsContent, ContentType.TEXT)
    }

    attachJSON(name: string, json: any) {
        const isStr = typeof json === 'string'
        const content = isStr ? json : JSON.stringify(json, null, 2)

        this.attachFile(
            name,
            String(content),
            isStr ? ContentType.JSON : ContentType.TEXT
        )
    }

    attachScreenshot(name: string, content: Buffer) {
        this.attachFile(name, content, ContentType.PNG)
    }

    _startSuite() {
        const scopeUuid = this._allureRuntime.startScope()

        this._allureScopesStack.push(scopeUuid)

        return scopeUuid
    }

    _endSuite() {
        const currentScopeUuid = this._allureScopesStack.pop()!

        this._allureRuntime.writeScope(currentScopeUuid)

        // if (!this._state.currentSuite) {
        //     throw new Error("There isn't any active suite!")
        // }
        //
        // while (this._state.currentAllureStepableEntity) {
        //     const currentElement = this._state.pop() as | AllureGroup | AllureStepableUnit
        //     if (!(currentElement instanceof AllureGroup)) {
        //         const isAnyStepFailed = currentElement.wrappedItem.steps.some((step) => step.status === AllureStatus.FAILED)
        //         const isAnyStepBroken = currentElement.wrappedItem.steps.some((step) => step.status === AllureStatus.BROKEN)
        //
        //         currentElement.stage = Stage.FINISHED
        //         currentElement.status = isAnyStepFailed
        //             ? AllureStatus.FAILED
        //             : isAnyStepBroken
        //                 ? AllureStatus.BROKEN
        //                 : AllureStatus.PASSED
        //     }
        //
        //     if (currentElement instanceof AllureTest) {
        //         setAllureIds(currentElement, this._state.currentSuite)
        //         currentElement.endTest()
        //     } else if (currentElement instanceof AllureStep) {
        //         currentElement.endStep()
        //     }
        // }
        //
        // const currentSuite = this._state.pop() as AllureGroup
        // // if a hook were execute without a test the report will need a test to display the hook
        // if (this._state.stats.hooks > 0 && this._state.stats.test === 0) {
        //     const test = currentSuite.startTest(currentSuite.name)
        //     test.status = Status.BROKEN
        //     test.endTest()
        // }
        // currentSuite.endGroup()
    }

    _startTest(payload: {
        title: string,
        fullTitle: string,
        cid?: string
    }) {
        // const testScopeUuid = this._allureRuntime.startScope()

        // don't forget to write the scope
        // this._allureScopesStack.push(testScopeUuid)

        const { title, fullTitle, cid } = payload
        const testPath = fullTitle.replace(title, '').split('.').filter(Boolean)
        const currentTestUuid = this._allureRuntime.startTest({
            name: title,
            fullName: `${this._currentFile!}#${testPath.join(' ')} ${title}`,
            labels: [
                {
                    name: LabelName.LANGUAGE,
                    value: 'javascript',
                },
                {
                    name: LabelName.FRAMEWORK,
                    value: 'wdio',
                },
                ...getSuiteLabels(testPath)
            ]
        }, this._allureScopesStack)

        // this._allureRuntime.updateTest(currentTestUuid, (r) => {
        //     if (cid) {
        //         r.labels.push({
        //             name: LabelName.THREAD,
        //             value: cid,
        //         })
        //     }
        //
        //     if (this._currentFile) {
        //         r.labels.push({
        //             name: LabelName.PACKAGE,
        //             value: this._currentFile.replace(sep, '.'),
        //         })
        //     }
        // })

        this._allureExecutablesStack.push(currentTestUuid)
        this._setTestParameters(currentTestUuid, cid)

        return currentTestUuid
    }

    _skipTest() {
        this._endTest(AllureStatus.SKIPPED, undefined, Stage.PENDING)
        // if (!this._state.currentAllureStepableEntity) {
        //     return
        // }
        //
        // const currentTest = this._state.pop() as AllureTest | AllureStep
        //
        // currentTest.stage = Stage.PENDING
        // currentTest.status = AllureStatus.SKIPPED
        //
        // if (currentTest instanceof AllureTest) {
        //     setAllureIds(currentTest, this._state.currentSuite)
        //     currentTest.endTest()
        // } else {
        //     currentTest.endStep()
        // }
    }

    _endTest(status: AllureStatus, error?: Error, stage?: Stage) {
        // TODO: test steps
        const currentTestUuid = this._allureExecutablesStack.pop()

        if (!currentTestUuid) {
            return
        }

        this._allureRuntime.updateTest(currentTestUuid, (r) => {
            r.stage = stage ?? Stage.FINISHED
            r.status = status

            if (!error) {
                return
            }

            r.statusDetails = {
                message: error.message,
                trace: error.stack,
            }
        })
        this._allureRuntime.stopTest(currentTestUuid)
        this._allureRuntime.writeTest(currentTestUuid)

        // if (currentSpec instanceof AllureTest) {
        //     setAllureIds(currentSpec, this._state.currentSuite)
        //     currentSpec.endTest()
        // } else if (currentSpec instanceof AllureStep) {
        //     currentSpec.endStep()
        // }
    }

    _startStep(testTitle: string) {
        const lastExecutableUuid = last(this._allureExecutablesStack)
        const newStepUuid = this._allureRuntime.startStep(lastExecutableUuid, undefined, {
            name: testTitle,
        })!

        this._allureExecutablesStack.push(newStepUuid)

        return newStepUuid
    }

    _setTestParameters(uuid: string, cid?: string) {
        // TODO:
        // if (!this._isMultiremote) {
        //     const caps = this._capabilities
        //     // @ts-expect-error outdated JSONWP capabilities
        //     const { browserName, desired, device } = caps
        //     // @ts-expect-error outdated JSONWP capabilities
        //     const deviceName = (desired || {}).deviceName || (desired || {})['appium:deviceName'] || caps.deviceName || caps['appium:deviceName']
        //     let targetName = device || browserName || deviceName || cid
        //     // custom mobile grids can have device information in a `desired` cap
        //     if (desired && deviceName && desired['appium:platformVersion']) {
        //         targetName = `${device || deviceName} ${desired['appium:platformVersion']}`
        //     }
        //     // @ts-expect-error outdated JSONWP capabilities
        //     const browserstackVersion = caps.os_version || caps.osVersion
        //     // @ts-expect-error outdated JSONWP capabilities
        //     const version = browserstackVersion || caps.browserVersion || caps.version || caps['appium:platformVersion'] || ''
        //     const paramName = (deviceName || device) ? 'device' : 'browser'
        //     const paramValue = version ? `${targetName}-${version}` : targetName
        //
        //     if (!paramValue) {
        //         return
        //     }
        //
        //     this._state.currentTest.addParameter(paramName, paramValue)
        // } else {
        //     this._state.currentTest.addParameter('isMultiremote', 'true')
        // }
        //
        // // Allure analytics labels. See https://github.com/allure-framework/allure2/blob/master/Analytics.md
        //
        // if (!this._state.currentSuite) {
        //     return
        // }
        //
        // // TODO: need to add ability to get labels from allure entitites
        // // @ts-ignore
        // const isFeaturePresent = this._state.currentTest.wrappedItem.labels.some((label: Label) => label.name === LabelName.FEATURE)
        //
        // if (isFeaturePresent) {
        //     return
        // }
        //
        // this._state.currentTest.addLabel(LabelName.FEATURE, this._state.currentSuite.name)
    }

    // TODO:
    // registerListeners() {
    //     process.on(ALLURE_RUNTIME_MESSAGE_EVENT, (runtimeMessage) => {
    //         console.log({ runtimeMessage })
    //     })
    //     // process.on(events.addLink, this.addLink.bind(this))
    //     // process.on(events.addLabel, this.addLabel.bind(this))
    //     // process.on(events.addAllureId, this.addAllureId.bind(this))
    //     // process.on(events.addFeature, this.addFeature.bind(this))
    //     // process.on(events.addStory, this.addStory.bind(this))
    //     // process.on(events.addSeverity, this.addSeverity.bind(this))
    //     // process.on(events.addSuite, this.addSuite.bind(this))
    //     // process.on(events.addSubSuite, this.addSubSuite.bind(this))
    //     // process.on(events.addOwner, this.addOwner.bind(this))
    //     // process.on(events.addTag, this.addTag.bind(this))
    //     // process.on(events.addParentSuite, this.addParentSuite.bind(this))
    //     // process.on(events.addEpic, this.addEpic.bind(this))
    //     // process.on(events.addIssue, this.addIssue.bind(this))
    //     // process.on(events.addTestId, this.addTestId.bind(this))
    //     // process.on(events.addAttachment, this.addAttachment.bind(this))
    //     // process.on(events.addDescription, this.addDescription.bind(this))
    //     // process.on(events.startStep, this.startStep.bind(this))
    //     // process.on(events.endStep, this.endStep.bind(this))
    //     // process.on(events.addStep, this.addStep.bind(this))
    //     // process.on(events.addArgument, this.addArgument.bind(this))
    //     // process.on(events.addAllureStep, this.addAllureStep.bind(this))
    // }

    onRunnerStart(runner: RunnerStats) {
        // start root scope
        this._startSuite()
        this._config = runner.config
        this._capabilities = runner.capabilities
        this._isMultiremote = runner.isMultiremote || false
    }

    onRunnerEnd() {
        // end root scope
        this._endSuite()
    }

    onSuiteStart(suite: SuiteStats) {
        const { useCucumberStepReporter } = this._options
        const isScenario = suite.type === 'scenario'
        const processAsSuite = !useCucumberStepReporter || !isScenario

        this._currentFile = suite.file
            .replace(this._config!.rootDir!, '')
            .replace(/^\//, '')

        if (processAsSuite) {
            this._startSuite()
            return
        }

        // handle a cucumber scenario as allure "case" instead of "suite"
        this._startTest(suite)

        // process cucumber tags as Allure Labels
        convertSuiteTagsToLabels(suite?.tags || []).forEach((label) => {
            switch (label.name) {
            case 'issue':
                this.addIssue({
                    issue: label.value,
                    linkName: label.value,
                })
                break
            case 'testId':
                this.addTestId({
                    testId: label.value,
                    linkName: label.value,
                })
                break
            default:
                this.addLabel(label)
            }
        })

        if (suite.description) {
            this.addDescription(suite)
        }
    }

    onSuiteEnd(suite: SuiteStats) {
        const { useCucumberStepReporter } = this._options
        const isScenario = suite.type === 'scenario'
        const processAsSuite = !useCucumberStepReporter || !isScenario

        if (processAsSuite) {
            this._endSuite()
            return
        }

        // TODO:
        // passing hooks are missing the 'state' property
        // suite.hooks = suite.hooks!.map((hook) => {
        //     hook.state = hook.state || AllureStatus.PASSED
        //
        //     return hook
        // })

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

        // const isPassed = suiteChildren.every(item => item.state === AllureStatus.PASSED)
        // A scenario is it passed if certain steps are passed and all other are skipped and every hooks are passed or skipped
        // const isPartiallySkipped = suiteChildren.every(item => [AllureStatus.PASSED, AllureStatus.SKIPPED].includes(item.state as AllureStatus))
        //
        // if (isPassed || isPartiallySkipped) {
        //     this._endTest(AllureStatus.PASSED)
        //     return
        // }

        // TODO: check, that we didn't break something
        this._endTest(AllureStatus.PASSED)

        // TODO:
        // Only close passing and skipped tests because failing tests are closed in onTestFailed event
        //
        // this._allureRuntime.stopTest()
        //
        // this._state.currentFile = undefined

        this._currentFile = undefined
    }

    onTestStart(test: TestStats | HookStats) {
        const { useCucumberStepReporter } = this._options

        this._consoleOutput = ''

        if (!useCucumberStepReporter) {
            this._startTest({
                title: test.title,
                // TODO: actually, the property exists, do we need to augment the related type?
                // @ts-ignore
                fullTitle: test.fullTitle,
                cid: test.cid,
            })
            return
        }

        const testObj = test as TestStats
        const argument = testObj?.argument as Argument
        const dataTable = argument?.rows?.map((a: { cells: string[] }) => a?.cells)

        this._startStep(test.title)

        if (dataTable) {
            this.attachFile('Data Table', stringify(dataTable), ContentType.CSV)
        }
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

        if (this._allureExecutablesStack.length === 0) {
            this.onTestStart(test)
        }

        // // TODO: do we need the logic?
        // // else  if (this._state.currentAllureStepableEntity instanceof AllureTest){
        // //     this._state.currentAllureStepableEntity.name = test.title
        // // }

        this.attachLogs()

        const status = getTestStatus(test, this._config)

        this._endTest(status, getErrorFromFailedTest(test))
    }

    onTestSkip(test: TestStats) {
        // TODO:
        // const { useCucumberStepReporter } = this._options
        //
        // this.attachLogs()

        // if (
        //     !this._state.currentAllureStepableEntity || this._state.currentAllureStepableEntity.wrappedItem.name !==
        //         test.title
        // ) {
        //     if (useCucumberStepReporter) {
        //         this.onTestStart(test)
        //     } else {
        //         this._startTest(test.title, test.cid)
        //     }
        // }
        //
        // this._skipTest()
    }

    onBeforeCommand(command: BeforeCommandArgs) {
        console.log('before command', command)
        // if (!this._state.currentAllureStepableEntity) {
        //     return
        // }
        //
        // const { disableWebdriverStepsReporting } = this._options
        //
        // if (disableWebdriverStepsReporting || this._isMultiremote) {
        //     return
        // }
        // const { method, endpoint } = command
        //
        // const stepName = command.command ? command.command : `${method} ${endpoint}`
        // const payload = command.body || command.params
        //
        // this._startStep(stepName as string)
        //
        // if (!isEmpty(payload)) {
        //     this.attachJSON('Request', payload)
        // }
    }

    onAfterCommand(command: AfterCommandArgs) {
        console.log('after command', command)
        // const { disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting } = this._options
        //
        // const { value: commandResult } = command?.result || {}
        // const isScreenshot = isScreenshotCommand(command)
        // if (!disableWebdriverScreenshotsReporting && isScreenshot && commandResult) {
        //     this.attachScreenshot('Screenshot', Buffer.from(commandResult, 'base64'))
        // }
        //
        // if (disableWebdriverStepsReporting || this._isMultiremote || !this._state.currentStep) {
        //     return
        // }
        //
        // this.attachJSON('Response', commandResult)
        // this.endStep(AllureStatus.PASSED)
    }

    onHookStart(hook: HookStats) {
        const { disableMochaHooks, useCucumberStepReporter } = this._options
        const currentScopeUuid = last(this._allureScopesStack)

        // ignore global hooks or hooks when option is set in false
        // any hook is skipped if there is not a suite created.
        if (!hook.parent || !currentScopeUuid || disableMochaHooks) {
            return
        }

        const hookType = /before/i.test(hook.title) ? 'before' : 'after'
        const isAllHook = isAllTypeHooks(hook.title) // if the hook is beforeAll or afterAll for mocha/jasmine
        const isEachHook = isEachTypeHooks(hook.title) // if the hook is beforeEach or afterEach for mocha/jasmine

        // if the hook is before/after from mocha/jasmine
        if (isAllHook || isEachHook) {
            const fixtureUuid = this._allureRuntime.startFixture(currentScopeUuid, hookType, {
                name: hook.title
            })!

            this._allureExecutablesStack.push(fixtureUuid)
            return
        }

        if (!(isAllHook || isEachHook) && !useCucumberStepReporter) {
            const fixtureUuid = this._allureRuntime.startFixture(currentScopeUuid, hookType, {
                name: `hook:${hook.title}`
            })!

            this._allureExecutablesStack.push(fixtureUuid)
            return
        }

        // hooks in cucumber mode will be treated as Test/Step
        if (useCucumberStepReporter) {
            this.onTestStart(hook)
        }
    }

    onHookEnd(hook: HookStats) {
        const currentScopeUuid = last(this._allureScopesStack)
        const { disableMochaHooks, useCucumberStepReporter } = this._options

        // ignore global hooks
        // any hook is skipped if there is not a suite created.
        if (!hook.parent || !currentScopeUuid || disableMochaHooks) {
            return
        }

        // const isAllHook = isAllTypeHooks(hook.title) // if the hook is beforeAll or afterAll for mocha/jasmine
        // const isEachHook = isEachTypeHooks(hook.title) // if the hook is beforeEach or afterEach for mocha/jasmine
        const status = hook.error ? AllureStatus.FAILED : AllureStatus.PASSED

        if (useCucumberStepReporter) {
            // closing the cucumber hook (in this case, it's reported as a step)
            status === AllureStatus.FAILED ? this.onTestFail(hook) : this.onTestPass()
            return
        }

        const fixtureUuid = this._allureExecutablesStack.pop()!

        this._allureRuntime.updateFixture(fixtureUuid, (r) => {
            r.status = status

            if (hook.error) {
                r.statusDetails = {
                    message: hook.error.message,
                    trace: hook.error.stack,
                }
            }
        })

        // /****
        //  * if the hook is before/after from mocha/jasmine and disableMochaHooks=false.
        //  */
        // // if the hook is before/after from mocha/jasmine and disableMochaHooks=false.
        // if ((isAllHook || isEachHook) && !disableMochaHooks) {
        //     // getting the hook root step, and the hook element from stack.
        //     const currentHookRootStep = this._state.pop()
        //     const currentHookRoot = this._state.pop()
        //     // check if the elements exist
        //     if (currentHookRootStep || currentHookRoot) {
        //         // check if the elements related to hook
        //         if (
        //             currentHookRootStep instanceof AllureStep &&
        //             currentHookRoot instanceof ExecutableItemWrapper
        //         ) {
        //             getHookStatus(hook, currentHookRoot, currentHookRootStep)
        //             currentHookRootStep.endStep()
        //
        //             if (isBeforeTypeHook(hook.title) && (hook.error || hook.errors?.length)) {
        //                 this._startTest(hook.currentTest || hook.title, hook.cid)
        //                 this._endTest(AllureStatus.BROKEN, getErrorFromFailedTest(hook))
        //             }
        //
        //             return
        //         }
        //         // put them back to the list
        //         if (currentHookRoot) {
        //             this._state.push(currentHookRoot)
        //         }
        //         if (currentHookRootStep) {
        //             this._state.push(currentHookRootStep)
        //         }
        //     }
        // }
        //
        // /****
        //  * if the hook is before/after from mocha/jasmine or cucumber by setting useCucumberStepReporter=true,
        //  * and disableMochaHooks=true with a failed hook.
        //  *
        //  * Only if the hook fails, it will be reported.
        //  */
        // if (disableMochaHooks && hook.error) {
        //     // hook is from cucumber
        //     if (useCucumberStepReporter){
        //         // report a new allure hook (step)
        //         this.onTestStart(hook)
        //         // set the hook as failed one
        //         this.onTestFail(hook)
        //
        //         // remove cucumber hook (reported as step) from suite if it has no steps or attachments.
        //         const currentItem = this._state.currentAllureStepableEntity?.wrappedItem
        //
        //         if (currentItem) {
        //             cleanCucumberHooks(currentItem)
        //         }
        //         return
        //     }
        //
        //     // hook is before/after from mocha/jasmine
        //     const hookExecutable = isBeforeTypeHook(hook.title)
        //         ? this._state.currentSuite.addBefore()
        //         : this._state.currentSuite.addAfter()
        //     const hookStep = hookExecutable.startStep(hook.title)
        //
        //     // register the hook
        //     this._state.stats.hooks++
        //
        //     // updating the hook information
        //     getHookStatus(hook, hookExecutable, hookStep)
        //     hookStep.endStep()
        //     return
        // }
        //
        // /****
        //  * if the hook is not before/after from mocha/jasmine (custom hook) and useCucumberStepReporter=false
        //  * Custom hooks are not affected by "disableMochaHooks" option
        //  */
        // if (!(isAllHook || isEachHook) && !useCucumberStepReporter) {
        //     // getting the latest element
        //     const lastElement = this._state.pop()
        //     if (lastElement) {
        //         const isCustomHook =
        //             lastElement instanceof AllureTest &&
        //             lastElement.wrappedItem.name?.startsWith('hook:')
        //         this._state.push(lastElement)
        //         if (isCustomHook) {
        //             // we end the test case (custom hook) that represents the custom hook call.
        //             this._endTest(getTestStatus(hook), hook.error)
        //         }
        //     }
        //     return
        // }
        //
        // /****
        //  * if the hook comes from Cucumber useCucumberStepReporter=true
        //  */
        // if (useCucumberStepReporter && !disableMochaHooks) {
        //     // closing the cucumber hook (in this case, it's reported as a step)
        //     hook.error ? this.onTestFail(hook) : this.onTestPass()
        //
        //     // remove cucumber hook (reported as a step) from a suite if it has no steps or attachments.
        //     const currentItem = this._state.currentAllureStepableEntity?.wrappedItem
        //
        //     if (currentItem) {
        //         cleanCucumberHooks(currentItem)
        //     }
        //     return
        // }
    }

    //#region Allure API methods
    addLabel({ name, value }: AddLabelEventArgs) {
        console.log('label', { name, value })
        // const currentExecutableUuid = last(this._allureExecutablesStack)
        //
        // this._allureRuntime.updateTest(currentExecutableUuid, (r) => {
        //     r.labels.push({ name, value })
        // })
    }

    addLink({ name, url, type }: AddLinkEventArgs) {
        console.log('link', { name, url, type })
        // const currentExecutableUuid = last(this._allureExecutablesStack)
        //
        // this._allureRuntime.updateTest(currentExecutableUuid, (r) => {
        //     r.links.push({ name, url, type })
        // })
    }

    addAllureId({ id }: AddAllureIdEventArgs) {
        console.log('allure id', { id })
        // this.addLabel({
        //     name: LabelName.ALLURE_ID,
        //     value: id,
        // })
    }

    addStory({ storyName }: AddStoryEventArgs) {
        this.addLabel({
            name: LabelName.STORY,
            value: storyName,
        })
    }

    addFeature({ featureName }: AddFeatureEventArgs) {
        this.addLabel({
            name: LabelName.FEATURE,
            value: featureName,
        })
    }

    addSeverity({ severity }: AddSeverityEventArgs) {
        this.addLabel({
            name: LabelName.SEVERITY,
            value: severity,
        })
    }

    addEpic({ epicName }: AddEpicEventArgs) {
        this.addLabel({
            name: LabelName.EPIC,
            value: epicName,
        })
    }

    addOwner({ owner }: AddOwnerEventArgs) {
        this.addLabel({
            name: LabelName.OWNER,
            value: owner,
        })
    }

    addSuite({ suiteName }: AddSuiteEventArgs) {
        this.addLabel({
            name: LabelName.SUITE,
            value: suiteName,
        })
    }

    addParentSuite({ suiteName }: AddParentSuiteEventArgs) {
        this.addLabel({
            name: LabelName.PARENT_SUITE,
            value: suiteName,
        })
    }

    addSubSuite({ suiteName }: AddSubSuiteEventArgs) {
        this.addLabel({
            name: LabelName.SUB_SUITE,
            value: suiteName,
        })
    }

    addTag({ tag }: AddTagEventArgs) {
        this.addLabel({
            name: LabelName.TAG,
            value: tag,
        })
    }

    addTestId({ testId, linkName }: AddTestIdEventArgs) {
        if (!this._options.tmsLinkTemplate) {
            this.addLabel({
                name: 'tms',
                value: testId,
            })
            return
        }

        const tmsLink = getLinkByTemplate(
            this._options.tmsLinkTemplate,
            testId
        )

        this.addLink({
            url: tmsLink,
            name: linkName || 'tms',
            type: LinkType.TMS,
        })
    }

    addIssue({ issue, linkName }: AddIssueEventArgs) {
        console.log({ issue, linkName })
        // if (!this._options.issueLinkTemplate) {
        //     this.addLabel({
        //         name: 'issue',
        //         value: issue,
        //     })
        //     return
        // }
        //
        // const issueLink = getLinkByTemplate(
        //     this._options.issueLinkTemplate,
        //     issue
        // )
        //
        // this.addLink({
        //     url: issueLink,
        //     name: linkName,
        //     type: LinkType.ISSUE,
        // })
    }

    addDescription(
        { description, descriptionType }: AddDescriptionEventArgs
    ) {
        console.log('description', { description, descriptionType })
        // const currentExecutableUuid = last(this._allureExecutablesStack)
        //
        // this._allureRuntime.updateTest(currentExecutableUuid, (r) => {
        //     if (descriptionType === DescriptionType.HTML) {
        //         r.descriptionHtml = description
        //         return
        //     }
        //
        //     r.description = description
        // })
    }

    addAttachment(
        { name, content, type = ContentType.TEXT }: AddAttachmentEventArgs
    ) {
        console.log('attachment', { name, content, type })
        // if (type === ContentType.JSON) {
        //     this.attachJSON(name, content)
        //     return
        // }
        //
        // this.attachFile(name, Buffer.from(content as string), type as ContentType)
    }

    addArgument({ name, value }: any) {
        console.log('parameter', { name, value })
        // const currentExecutableUuid = last(this._allureExecutablesStack)
        //
        // this._allureRuntime.updateTest(currentExecutableUuid, (r) => {
        //     r.parameters.push({ name, value })
        // })
    }

    addStep({ step }: any) {
        // if (!this._state.currentAllureStepableEntity) {
        //     return
        // }
        //
        // this._startStep(step.title)
        //
        // if (step.attachment) {
        //     this.attachFile(step.attachment.name, step.attachment.content, step.attachment.type || ContentType.TEXT)
        // }
        //
        // this._endTest(step.status)
    }

    startStep(title: string) {
        // if (!this._state.currentAllureStepableEntity) {
        //     return
        // }
        //
        // this._startStep(title)
    }

    endStep(status: AllureStatus) {
        // if (!this._state.currentAllureStepableEntity) {
        //     return
        // }
        //
        // this._endTest(status)
    }

    // TODO:
    // addAllureStep(metadata: MetadataMessage) {
    //     const { currentAllureStepableEntity: currentAllureSpec } = this._state
    //
    //     if (!currentAllureSpec) {
    //         throw new Error("Couldn't add step: no test case running!")
    //     }
    //
    //     const {
    //         attachments = [],
    //         labels = [],
    //         links = [],
    //         parameter = [],
    //         steps = [],
    //         description,
    //         descriptionHtml,
    //     } = metadata
    //
    //     if (description) {
    //         this.addDescription({
    //             description,
    //             descriptionType: DescriptionType.MARKDOWN
    //         })
    //     }
    //
    //     if (descriptionHtml) {
    //         this.addDescription({
    //             description: descriptionHtml,
    //             descriptionType: DescriptionType.HTML
    //         })
    //     }
    //
    //     labels.forEach((label) => {
    //         this.addLabel(label)
    //     })
    //     parameter.forEach((param) => {
    //         this.addArgument(param)
    //     })
    //     links.forEach((link) => {
    //         this.addLink(link)
    //     })
    //     attachments.forEach((attachment) => {
    //         this.addAttachment(attachment)
    //     })
    //     steps.forEach((step) => {
    //         currentAllureSpec.addStep(AllureCommandStepExecutable.toExecutableItem(this._allure, step))
    //     })
    // }

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
    //#endregion
}

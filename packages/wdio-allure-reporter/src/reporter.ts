import { sep } from 'node:path'
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
import { WdioTestRuntime } from './WdioTestRuntime.js'
import type { Capabilities, Options } from '@wdio/types'
import {
    ContentType,
    description,
    descriptionHtml,
    issue,
    label,
    LabelName,
    link,
    parameter,
    Stage,
    Status as AllureStatus,
    tms
} from 'allure-js-commons'
import { FileSystemWriter, getSuiteLabels, ReporterRuntime, } from 'allure-js-commons/sdk/reporter'
import { setGlobalTestRuntime } from 'allure-js-commons/sdk/runtime'
import {
    addAllureId,
    addArgument,
    addAttachment,
    addDescription,
    addEpic,
    addFeature,
    addHistoryId,
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
    addTestCaseId,
    addTestId,
    endStep,
    startStep,
    step,
} from './common/api.js'
import { AllureReportState } from './state.js'
import {
    convertSuiteTagsToLabels,
    findLast,
    getErrorFromFailedTest,
    getRunnablePath,
    getTestStatus,
    isAllTypeHooks,
    isEachTypeHooks,
    isEmpty,
    isScreenshotCommand,
} from './utils.js'
import type {
    AddAllureIdEventArgs,
    AddArgumentEventArgs,
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
    AddStepEventArgs,
    AddStoryEventArgs,
    AddSubSuiteEventArgs,
    AddSuiteEventArgs,
    AddTagEventArgs,
    AddTestIdEventArgs,
    AddTestInfoEventArgs,
    AllureReporterOptions,
    WDIORuntimeMessage
} from './types.js'
import { DescriptionType as DescriptionType, type WDIORunnable } from './types.js'
import { DEFAULT_CID, events } from './constants.js'
import type { RuntimeMessage } from 'allure-js-commons/sdk'
import process from 'node:process'
import { stringify } from 'csv-stringify/sync'

export default class AllureReporter extends WDIOReporter {
    private _allureRuntime: ReporterRuntime
    private _allureState: AllureReportState
    private _allureScopesStack: string[] = []
    private _allureExecutablesStack: string[] = []

    private _allureScopesStacksByCid: Map<string, string[]> = new Map()
    private _allureExecutablesStacksByCid: Map<string, string[]> = new Map()

    private _allureMessagesByCid: Map<string, WDIORuntimeMessage[]> = new Map()

    private _capabilities: Capabilities.ResolvedTestrunnerCapabilities
    private _isMultiremote?: boolean
    private _config?: Options.Testrunner
    private _options: AllureReporterOptions
    private _consoleOutput: string
    private _originalStdoutWrite: Function
    private _currentFile?: string

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
        this._allureState = new AllureReportState(this._allureRuntime)

        this._capabilities = {}
        this._options = options
        this._registerListeners()

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
    }

    _pushRuntimeMessage(cid: string, message: WDIORuntimeMessage) {
        if (!this._allureMessagesByCid.has(cid)) {
            this._allureMessagesByCid.set(cid, [])
        }

        this._allureMessagesByCid.get(cid)!.push(message)
    }

    _hasStartedSuite(cid: string) {
        const messages = this._allureMessagesByCid.get(cid) ?? []

        return findLast(messages, (message) => message.type === 'allure:suite:start')
    }

    _hasStartedExecutable(cid: string) {
        const messages = this._allureMessagesByCid.get(cid) ?? []

        return findLast(messages, (message) => message.type === 'allure:test:start' || message.type === 'allure:hook:start')
    }

    _attachFile(payload: {
        name: string;
        content: Buffer;
        contentType: ContentType;
        cid?: string;
    }) {
        const { cid = DEFAULT_CID, name, content, contentType } = payload

        this._pushRuntimeMessage(cid, {
            type: 'attachment_content',
            data: {
                name,
                content: Buffer.from(content).toString('base64'),
                contentType,
                encoding: 'base64'
            },
        })
    }

    _attachLogs(cid: string = DEFAULT_CID) {
        if (!this._consoleOutput) {
            return
        }

        const logsContent = `.........Console Logs.........\n\n${this._consoleOutput}`

        this._attachFile({
            name: 'Console Logs',
            content: Buffer.from(logsContent, 'utf8'),
            contentType: ContentType.TEXT,
            cid,
        })
    }

    _attachJSON(payload: { name: string; json: any; cid?: string }) {
        const { name, json, cid = DEFAULT_CID } = payload
        const isStr = typeof json === 'string'
        const content = isStr ? json : JSON.stringify(json, null, 2)

        this._attachFile({
            name,
            content: Buffer.from(String(content), 'utf8'),
            contentType: isStr ? ContentType.JSON : ContentType.TEXT,
            cid,
        })
    }

    _attachScreenshot(payload: {
        name: string;
        content: Buffer;
        cid?: string;
    }) {
        const { name, content, cid = DEFAULT_CID } = payload

        this._attachFile({
            name,
            content,
            cid,
            contentType: ContentType.PNG,
        })
    }

    _closeScope(cid: string = DEFAULT_CID) {
        // const currentScopeUuid = this._allureScopesStacksByCid.get(cid)?.pop()
        //
        // if (!currentScopeUuid) {
        //     console.warn('AllureReporter: no active scope to write!')
        //     return
        // }
        //
        // this._allureRuntime.writeScope(currentScopeUuid)
        //
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

    _startSuite(payload: { title: string, cid?: string }) {
        const { cid = DEFAULT_CID, ...data } = payload

        this._pushRuntimeMessage(cid, {
            type: 'allure:suite:start',
            data,
        })
    }

    _endSuite(payload: { cid?: string }) {
        const { cid = DEFAULT_CID, ...data } = payload

        this._pushRuntimeMessage(cid, {
            type: 'allure:suite:end',
            data,
        })
    }

    _startTest(payload: { title: string; fullTitle: string; start: number; cid?: string }) {
        const { cid = DEFAULT_CID, ...data } = payload

        this._pushRuntimeMessage(cid, {
            type: 'allure:test:start',
            data,
        })

        // this._allureExecutablesStacksByCid.get(cid)!.push(currentTestUuid)
        // this._setTestParameters(currentTestUuid, cid)
        //
        // return currentTestUuid
    }

    _endTest(payload: {
        status: AllureStatus;
        end: number;
        error?: Error;
        stage?: Stage;
        cid?: string;
    }) {
        const { cid = DEFAULT_CID, ...data } = payload

        this._pushRuntimeMessage(cid, {
            type: 'allure:test:end',
            data,
        })
    }

    _skipTest(cid: string = DEFAULT_CID) {

        // this._endTest({
        //     status: AllureStatus.SKIPPED,
        //     stage: Stage.PENDING,
        //     cid,
        // })
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

    _startStep(payload: { title: string; start: number; cid?: string }) {
        const { cid = DEFAULT_CID, title, start } = payload

        this._pushRuntimeMessage(cid, {
            type: 'step_start',
            data: {
                name: title,
                start,
            },
        })
    }

    _endStep(payload: {
        status: AllureStatus;
        stop: number;
        error?: Error;
        stage?: Stage;
        cid?: string;
    }) {
        const { status, stop, error, cid = DEFAULT_CID } = payload

        this._pushRuntimeMessage(cid, {
            type: 'step_stop',
            data: {
                stop,
                status,
                statusDetails: error && {
                    message: error.message,
                    trace: error.stack,
                },
            }
        })
    }

    _skipStep(cid: string = DEFAULT_CID) {
        // this._endStep({
        //     status: AllureStatus.SKIPPED,
        //     stage: Stage.PENDING,
        //     cid,
        // })
    }

    // TODO:
    _setTestParameters(uuid: string, cid?: string) {
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

    _registerListeners() {
        setGlobalTestRuntime(new WdioTestRuntime())

        process.on(events.addTestInfo, (payload: AddTestInfoEventArgs) => {
            const { file, testPath, cid = DEFAULT_CID } = payload

            this._pushRuntimeMessage(cid, {
                type: 'allure:test:info',
                data: {
                    fullName: `${file}#${testPath.join(' ')}`
                }
            })

            if (testPath.length === 1) {return}

            this._pushRuntimeMessage(cid, {
                type: 'metadata',
                data: {
                    labels: [
                        {
                            name: LabelName.LANGUAGE,
                            value: 'javascript'
                        },
                        {
                            name: LabelName.FRAMEWORK,
                            value: 'wdio'
                        },
                        {
                            name: LabelName.PACKAGE,
                            value: file.replace(sep, '.'),
                        },
                        ...getSuiteLabels(testPath.slice(0, -1))
                    ]
                }
            })

            if (cid !== DEFAULT_CID) {
                this._pushRuntimeMessage(cid, {
                    type: 'metadata',
                    data: {
                        labels: [
                            {
                                name: LabelName.THREAD,
                                value: cid,
                            },
                        ]
                    }
                })
            }
        })
        process.on(
            events.runtimeMessage,
            (payload: { cid?: string; message: RuntimeMessage }) => {
                const { cid = DEFAULT_CID, message } = payload

                this._pushRuntimeMessage(cid, message)
            }
        )
    }

    onRunnerStart(runner: RunnerStats) {
        // @ts-ignore
        runner.config.beforeTest.push((test: WDIORunnable, ctx: any) => {
            const testFile = test.file.replace(this._config!.rootDir!, '').replace(/^\//, '')
            // @ts-ignore
            const testPath = getRunnablePath(ctx.test).filter(Boolean)
            const message: AddTestInfoEventArgs = {
                file: testFile,
                testPath,
                cid: process.env.WDIO_WORKER_ID || DEFAULT_CID
            }

            // @ts-ignore
            process.emit(events.addTestInfo, message)
        })
        this._config = runner.config
        this._capabilities = runner.capabilities
        this._isMultiremote = runner.isMultiremote || false
    }

    onRunnerEnd(runner: RunnerStats) {
        const messages = this._allureMessagesByCid.get(runner.cid) ?? []

        this._allureState.processRuntimeMessage(messages)
    }

    onSuiteStart(suite: SuiteStats & { start: Date }) {
        const { useCucumberStepReporter } = this._options
        const isScenario = suite.type === 'scenario'
        const processAsSuite = !useCucumberStepReporter || !isScenario

        if (processAsSuite) {
            this._startSuite({ cid: suite.cid, title: suite.title })
            return
        }

        // handle a cucumber scenario as allure "case" instead of "suite"
        this._startTest({
            cid: suite.cid,
            title: suite.title,
            fullTitle: suite.fullTitle,
            start: suite.start.getTime(),
        })

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

    onSuiteEnd(suite: SuiteStats & { end: Date }) {
        const { useCucumberStepReporter } = this._options
        const isScenario = suite.type === 'scenario'
        const processAsSuite = !useCucumberStepReporter || !isScenario

        if (processAsSuite) {
            this._endSuite({ cid: suite.cid })
            return
        }

        // passing hooks are missing the 'state' property
        suite.hooks = suite.hooks!.map((hook) => {
            hook.state = hook.state || AllureStatus.PASSED

            return hook
        })

        const suiteChildren = [...suite.tests!, ...suite.hooks]
        // A scenario is it skipped if every steps are skipped and hooks are passed or skipped
        const isSkipped =
            suite.tests.every((item) =>
                [AllureStatus.SKIPPED].includes(item.state as AllureStatus)
            ) &&
            suite.hooks.every((item) =>
                [AllureStatus.PASSED, AllureStatus.SKIPPED].includes(
                    item.state as AllureStatus
                )
            )

        if (isSkipped) {
            this._endTest({
                status: AllureStatus.SKIPPED,
                stage: Stage.PENDING,
                cid: suite.cid,
                end: suite.end.getTime(),
            })
            return
        }

        const isFailed = suiteChildren.find(
            (item) => item.state === AllureStatus.FAILED
        )

        if (isFailed) {
            const testStatus = getTestStatus(isFailed)
            const error = getErrorFromFailedTest(isFailed)

            this._endTest({
                status: testStatus,
                error,
                cid: suite.cid,
                end: suite.end.getTime(),
            })
            return
        }

        // TODO:
        // const isPassed = suiteChildren.every(item => item.state === AllureStatus.PASSED)
        // A scenario is it passed if certain steps are passed and all other are skipped and every hooks are passed or skipped
        // const isPartiallySkipped = suiteChildren.every(item => [AllureStatus.PASSED, AllureStatus.SKIPPED].includes(item.state as AllureStatus))
        //
        // if (isPassed || isPartiallySkipped) {
        //     this._endTest(AllureStatus.PASSED)
        //     return
        // }

        // TODO: check, that we didn't break something
        this._endTest({
            status: AllureStatus.PASSED,
            cid: suite.cid,
            end: suite.end.getTime(),
        })

        // TODO:
        // Only close passing and skipped tests because failing tests are closed in onTestFailed event
        //
        // this._allureRuntime.stopTest()
        //
        // this._state.currentFile = undefined

        // this._currentFile = undefined
    }

    onTestStart(test: TestStats | HookStats) {
        const { useCucumberStepReporter } = this._options

        this._consoleOutput = ''

        if (!useCucumberStepReporter) {
            this._startTest({
                title: test.title,
                // actually, the property exists everywhere
                // @ts-ignore
                fullTitle: test.fullTitle,
                start: test.start.getTime(),
                cid: test.cid,
            })
            return
        }

        const testObj = test as TestStats
        const argument = testObj?.argument as Argument
        const dataTable = argument?.rows?.map(
            (a: { cells: string[] }) => a?.cells
        )

        this._startStep({
            title: test.title,
            start: test.start.getTime(),
            cid: test.cid,
        })

        if (dataTable) {
            this._attachFile({
                name: 'Data Table',
                content: Buffer.from(stringify(dataTable), 'utf8'),
                contentType: ContentType.CSV,
                cid: test.cid,
            })
        }
    }

    onTestPass(test: TestStats | HookStats) {
        this._attachLogs(test.cid)
        this._endTest({
            status: AllureStatus.PASSED,
            cid: test.cid,
            end: test.end!.getTime(),
        })
    }

    onTestRetry(test: TestStats) {
        this._attachLogs(test.cid)

        const status = getTestStatus(test, this._config)

        this._endTest({
            status,
            error: getErrorFromFailedTest(test),
            end: test.end!.getTime(),
            cid: test.cid,
        })
    }

    onTestFail(test: TestStats | HookStats) {
        const { useCucumberStepReporter } = this._options

        if (useCucumberStepReporter) {
            this._attachLogs(test.cid)

            const testStatus = getTestStatus(test, this._config)

            this._endTest({
                status: testStatus,
                error: getErrorFromFailedTest(test),
                cid: test.cid,
                end: test.end!.getTime(),
            })
            return
        }

        if (!this._hasStartedExecutable(test.cid)) {
            this.onTestStart(test)
        }

        // TODO: do we need the logic?
        // else  if (this._state.currentAllureStepableEntity instanceof AllureTest){
        //     this._state.currentAllureStepableEntity.name = test.title
        // }

        this._attachLogs(test.cid)

        const status = getTestStatus(test, this._config)

        this._endTest({
            status,
            error: getErrorFromFailedTest(test),
            cid: test.cid,
            end: test.end!.getTime(),
        })
    }

    onTestSkip(test: TestStats) {
        // // TODO:
        // const { useCucumberStepReporter } = this._options
        // const currentExecutablesStack =
        //     this._allureExecutablesStacksByCid.get(test.cid) ?? []
        // const currentExecutableUuid = last(currentExecutablesStack)
        //
        // if (!currentExecutableUuid) {
        //     return
        // }
        //
        // this._attachLogs({ cid: test.cid })
        // this._skipTest(test.cid)
        //
        // if (!currentExecutableUuid) {
        //
        // }

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

    onBeforeCommand(command: BeforeCommandArgs & { cid?: string }) {
        const { disableWebdriverStepsReporting } = this._options

        if (disableWebdriverStepsReporting || this._isMultiremote) {
            return
        }

        const { method, endpoint } = command
        const stepName = command.command
            ? command.command
            : `${method} ${endpoint}`
        const payload = command.body || command.params

        this._startStep({
            title: stepName as string,
            start: Date.now(),
            cid: command.cid,
        })

        if (!isEmpty(payload)) {
            this._attachJSON({
                name: 'Request',
                json: payload,
                cid: command.cid,
            })
        }
    }

    onAfterCommand(command: AfterCommandArgs & { cid?: string }) {
        const {
            disableWebdriverStepsReporting,
            disableWebdriverScreenshotsReporting,
        } = this._options
        const { value: commandResult } = command?.result || {}
        const isScreenshot = isScreenshotCommand(command)

        if (
            !disableWebdriverScreenshotsReporting &&
            isScreenshot &&
            commandResult
        ) {
            this._attachScreenshot({
                name: 'Screenshot',
                content: Buffer.from(commandResult, 'base64'),
                cid: command.cid,
            })
        }

        if (disableWebdriverStepsReporting || this._isMultiremote) {
            return
        }

        this._attachJSON({
            name: 'Response',
            json: commandResult,
            cid: command.cid,
        })
        this._endStep({
            status: AllureStatus.PASSED,
            stop: Date.now(),
            cid: command.cid,
        })
    }

    onHookStart(hook: HookStats) {
        const { disableMochaHooks, useCucumberStepReporter } = this._options

        if (!this._hasStartedSuite(hook.cid)) {
            return
        }

        if (disableMochaHooks || !hook.parent) {
            return
        }

        const hookType = /before/i.test(hook.title) ? 'before' : 'after'
        const isAllHook = isAllTypeHooks(hook.title) // if the hook is beforeAll or afterAll for mocha/jasmine
        const isEachHook = isEachTypeHooks(hook.title) // if the hook is beforeEach or afterEach for mocha/jasmine

        // if the hook is before/after from mocha/jasmine
        if (isAllHook || isEachHook) {
            this._pushRuntimeMessage(hook.cid, {
                type: 'allure:hook:start',
                data: {
                    title: hook.title,
                    type: hookType,
                    start: hook.start.getTime(),
                }
            })
            return
        }

        if (!(isAllHook || isEachHook) && !useCucumberStepReporter) {
            this._pushRuntimeMessage(hook.cid, {
                type: 'allure:hook:start',
                data: {
                    title: `hook:${hook.title}`,
                    type: hookType,
                    start: hook.start.getTime(),
                }
            })
            return
        }

        // hooks in cucumber mode will be treated as Test/Step
        if (useCucumberStepReporter) {
            this.onTestStart(hook)
        }
    }

    onHookEnd(hook: HookStats) {
        const { disableMochaHooks, useCucumberStepReporter } = this._options

        // const isAllHook = isAllTypeHooks(hook.title) // if the hook is beforeAll or afterAll for mocha/jasmine
        // const isEachHook = isEachTypeHooks(hook.title) // if the hook is beforeEach or afterEach for mocha/jasmine
        const status = hook.error ? AllureStatus.FAILED : AllureStatus.PASSED

        if (disableMochaHooks || !hook.parent) {
            return
        }

        if (useCucumberStepReporter) {
            // closing the cucumber hook (in this case, it's reported as a step)
            status === AllureStatus.FAILED
                ? this.onTestFail(hook)
                : this.onTestPass(hook)
            return
        }

        this._pushRuntimeMessage(hook.cid, {
            type: 'allure:hook:end',
            data: {
                status,
                statusDetails: hook.error && {
                    message: hook.error.message,
                    trace: hook.error.stack,
                },
                stop: hook.end!.getTime(),
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

    async addLabel({ name, value }: AddLabelEventArgs) {
        await label(name, value)
    }

    async addLink({ name, url, type }: AddLinkEventArgs) {
        await link(url, name, type)
    }

    async addAllureId({ id }: AddAllureIdEventArgs) {
        await this.addLabel({
            name: LabelName.ALLURE_ID,
            value: id,
        })
    }

    async addStory({ storyName }: AddStoryEventArgs) {
        await this.addLabel({
            name: LabelName.STORY,
            value: storyName,
        })
    }

    async addFeature({ featureName }: AddFeatureEventArgs) {
        await this.addLabel({
            name: LabelName.FEATURE,
            value: featureName,
        })
    }

    async addSeverity({ severity }: AddSeverityEventArgs) {
        await this.addLabel({
            name: LabelName.SEVERITY,
            value: severity,
        })
    }

    async addEpic({ epicName }: AddEpicEventArgs) {
        await this.addLabel({
            name: LabelName.EPIC,
            value: epicName,
        })
    }

    async addOwner({ owner }: AddOwnerEventArgs) {
        await this.addLabel({
            name: LabelName.OWNER,
            value: owner,
        })
    }

    async addSuite({ suiteName }: AddSuiteEventArgs) {
        await this.addLabel({
            name: LabelName.SUITE,
            value: suiteName,
        })
    }

    async addParentSuite({ suiteName }: AddParentSuiteEventArgs) {
        await this.addLabel({
            name: LabelName.PARENT_SUITE,
            value: suiteName,
        })
    }

    async addSubSuite({ suiteName }: AddSubSuiteEventArgs) {
        await this.addLabel({
            name: LabelName.SUB_SUITE,
            value: suiteName,
        })
    }

    async addTag({ tag }: AddTagEventArgs) {
        await this.addLabel({
            name: LabelName.TAG,
            value: tag,
        })
    }

    async addTestId({ testId, linkName }: AddTestIdEventArgs) {
        await tms(testId, linkName)
    }

    async addIssue({ issue: issueUrl, linkName }: AddIssueEventArgs) {
        await issue(issueUrl, linkName)
    }

    async addDescription({
        description: descriptionText,
        descriptionType,
    }: AddDescriptionEventArgs) {
        if (!descriptionText) {
            return
        }

        if (descriptionType === DescriptionType.HTML) {
            await descriptionHtml(descriptionText)
            return
        }

        await description(descriptionText)
    }

    async addAttachment({
        name,
        content,
        type = ContentType.TEXT,
    }: AddAttachmentEventArgs) {
        const { WDIO_WORKER_ID } = process.env

        if (type === ContentType.JSON) {
            this._attachJSON({
                name,
                json: content,
                cid: WDIO_WORKER_ID,
            })
            return
        }

        this._attachFile({
            name,
            content: Buffer.from(content as string),
            contentType: type as ContentType,
            cid: WDIO_WORKER_ID
        })
    }

    async addArgument({ name, value }: AddArgumentEventArgs) {
        await parameter(name, value)
    }

    async addStep({ step }: AddStepEventArgs) {
        const { WDIO_WORKER_ID } = process.env

        this._startStep({
            title: step.title,
            start: Date.now(),
            cid: WDIO_WORKER_ID,
        })

        if (step.attachment) {
            const { name, content, type = ContentType.TEXT } = step.attachment
            const attachmentContent = content instanceof Buffer ? content : Buffer.from(content, 'utf8')

            this._attachFile({
                name,
                content: attachmentContent,
                contentType: type,
                cid: WDIO_WORKER_ID,
            })
        }

        this._endStep({
            status: step.status,
            stop: Date.now(),
            cid: WDIO_WORKER_ID,
        })
    }

    async startStep(title: string) {
        const { WDIO_WORKER_ID } = process.env

        this._startStep({
            title,
            start: Date.now(),
            cid: WDIO_WORKER_ID
        })
    }

    async endStep(status: AllureStatus) {
        const { WDIO_WORKER_ID } = process.env

        this._endStep({
            status,
            stop: Date.now(),
            cid: WDIO_WORKER_ID
        })
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
    static addHistoryId = addHistoryId
    static addTestCaseId = addTestCaseId
    static step = step
}

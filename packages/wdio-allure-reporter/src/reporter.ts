import { sep } from 'node:path'
import type {
    AfterCommandArgs, Argument,
    BeforeCommandArgs,
    HookStats,
    RunnerStats,
    SuiteStats,
    TestStats,
} from '@wdio/reporter'
import WDIOReporter from '@wdio/reporter'
import { WdioTestRuntime } from './WdioTestRuntime.js'
import type { Capabilities, Options } from '@wdio/types'
import type { StatusDetails } from 'allure-js-commons'
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
    getCid,
    getErrorFromFailedTest,
    getRunnablePath,
    getStatusDetailsFromFailedTest,
    getTestStatus, isEmpty, isScreenshotCommand,
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
import { DescriptionType as DescriptionType } from './types.js'
import { DEFAULT_CID, events } from './constants.js'
import type { RuntimeMessage } from 'allure-js-commons/sdk'
import process from 'node:process'
import { stringify } from 'csv-stringify/sync'

export default class AllureReporter extends WDIOReporter {
    private _allureRuntime: ReporterRuntime
    private _allureState: AllureReportState
    private _allureStatesByCid: Map<string, AllureReportState> = new Map()
    private _capabilities: Capabilities.ResolvedTestrunnerCapabilities
    private _isMultiremote?: boolean
    private _config?: Options.Testrunner
    private _options: AllureReporterOptions
    private _consoleOutput: string
    private _originalStdoutWrite: Function

    constructor(options: AllureReporterOptions) {
        const { outputDir, resultsDir, ...rest } = options

        super({
            ...rest,
            outputDir,
        })
        this._consoleOutput = ''
        this._originalStdoutWrite = process.stdout.write.bind(process.stdout)

        this._allureRuntime = new ReporterRuntime({
            ...rest,
            environmentInfo: options.reportedEnvironmentVars,
            writer: new FileSystemWriter({
                resultsDir: outputDir || resultsDir || 'allure-results',
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

    get _hasPendingSuite() {
        const cid = getCid()
        const currentState = this._allureStatesByCid.get(cid)

        return currentState?.hasPendingSuite
    }

    get _hasPendingTest() {
        const cid = getCid()
        const currentState = this._allureStatesByCid.get(cid)

        return currentState?.hasPendingTest
    }

    get _hasPendingStep() {
        const cid = getCid()
        const currentState = this._allureStatesByCid.get(cid)

        return currentState?.hasPendingStep
    }

    get _hasPendingHook() {
        const cid = getCid()
        const currentState = this._allureStatesByCid.get(cid)

        return currentState?.hasPendingHook
    }

    _isCucumberExecutable(executable: TestStats | HookStats | SuiteStats) {
        // cucumber uid has uuid format, rest uid doesn't
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

        return uuidRe.test(executable.uid)
    }

    _pushRuntimeMessage(message: WDIORuntimeMessage) {
        const cid = getCid()

        if (!this._allureStatesByCid.has(cid)) {
            this._allureStatesByCid.set(cid, new AllureReportState(this._allureRuntime))
        }

        this._allureStatesByCid.get(cid)!.pushRuntimeMessage(message)
    }

    _attachFile(payload: {
        name: string;
        content: Buffer;
        contentType: ContentType;
        cid?: string;
    }) {
        const { name, content, contentType } = payload

        this._pushRuntimeMessage({
            type: 'attachment_content',
            data: {
                name,
                content: Buffer.from(content).toString('base64'),
                contentType,
                encoding: 'base64'
            },
        })
    }

    _attachLogs() {
        if (!this._consoleOutput) {
            return
        }

        const logsContent = `.........Console Logs.........\n\n${this._consoleOutput}`

        this._attachFile({
            name: 'Console Logs',
            content: Buffer.from(logsContent, 'utf8'),
            contentType: ContentType.TEXT,
        })
    }

    _attachJSON(payload: { name: string; json: any }) {
        const { name, json } = payload
        const isStr = typeof json === 'string'
        const content = isStr ? json : JSON.stringify(json, null, 2)

        this._attachFile({
            name,
            content: Buffer.from(String(content), 'utf8'),
            contentType: isStr ? ContentType.JSON : ContentType.TEXT,
        })
    }

    _attachScreenshot(payload: { name: string; content: Buffer }) {
        const { name, content } = payload

        this._attachFile({
            name,
            content,
            contentType: ContentType.PNG,
        })
    }

    _startSuite(payload: { name: string; feature?: boolean }) {
        this._pushRuntimeMessage({
            type: 'allure:suite:start',
            data: payload,
        })
    }

    _endSuite() {
        this._pushRuntimeMessage({
            type: 'allure:suite:end',
            data: {},
        })
    }

    _startTest(payload: { name: string; start: number }) {
        this._pushRuntimeMessage({
            type: 'allure:test:start',
            data: payload,
        })
        this._setTestParameters()
    }

    _endTest(payload: {
        status: AllureStatus;
        stop?: number;
        duration?: number;
        statusDetails?: StatusDetails;
        stage?: Stage;
    }) {
        this._pushRuntimeMessage({
            type: 'allure:test:end',
            data: payload,
        })
    }

    _skipTest() {
        this._endTest({
            status: AllureStatus.SKIPPED,
            stage: Stage.PENDING,
            stop: Date.now(),
        })
    }

    _startStep(payload: { name: string; start: number }) {
        this._pushRuntimeMessage({
            type: 'step_start',
            data: payload,
        })
    }

    _endStep(payload: {
        status: AllureStatus;
        stop: number;
        statusDetails?: StatusDetails;
        stage?: Stage;
    }) {
        this._pushRuntimeMessage({
            type: 'step_stop',
            data: payload
        })
    }

    _skipStep() {
        this._endStep({
            status: AllureStatus.SKIPPED,
            stage: Stage.PENDING,
            stop: Date.now(),
        })
    }

    _startHook(payload: { name: string, type: 'before' | 'after', start?: number }) {
        const { start = Date.now(), ...data } = payload

        this._pushRuntimeMessage({
            type: 'allure:hook:start',
            data: {
                ...data,
                start
            }
        })
    }

    _endHook(payload: { status: AllureStatus, statusDetails?: StatusDetails, stop?: number, duration?: number }) {
        const { status, statusDetails, stop = Date.now(), duration } = payload

        this._pushRuntimeMessage({
            type: 'allure:hook:end',
            data: {
                status,
                statusDetails,
                stop,
                duration,
            }
        })
    }

    _setTestParameters() {
        const cid = getCid()

        if (!this._isMultiremote) {
            const caps = this._capabilities
            // @ts-expect-error outdated JSONWP capabilities
            const { browserName, desired, device } = caps
            // @ts-expect-error outdated JSONWP capabilities
            const deviceName = (desired || {}).deviceName || (desired || {})['appium:deviceName'] || caps.deviceName || caps['appium:deviceName']
            let targetName = device || browserName || deviceName || cid
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

            this._pushRuntimeMessage({
                type: 'metadata',
                data: {
                    parameters: [
                        {
                            name: paramName,
                            value: paramValue,
                        }
                    ]
                }
            })
        } else {
            this._pushRuntimeMessage({
                type: 'metadata',
                data: {
                    parameters: [
                        {
                            name: 'isMultiremote',
                            value: 'true',
                        }
                    ]
                }
            })
        }

        if (!this._allureState.currentFeature) {
            return
        }

        this._pushRuntimeMessage({
            type: 'metadata',
            data: {
                labels: [
                    {
                        name: LabelName.FEATURE,
                        value: this._allureState.currentFeature,
                    }
                ]
            }
        })
    }

    _registerListeners() {
        setGlobalTestRuntime(new WdioTestRuntime())

        process.on(events.addTestInfo, (payload: AddTestInfoEventArgs) => {
            const { file, testPath, cid = DEFAULT_CID } = payload

            this._pushRuntimeMessage({
                type: 'allure:test:info',
                data: {
                    fullName: `${file}#${testPath.join(' ')}`
                }
            })

            if (testPath.length === 1) {
                return
            }

            this._pushRuntimeMessage({
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
                this._pushRuntimeMessage({
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
                const { message } = payload

                this._pushRuntimeMessage(message)
            }
        )
    }

    onRunnerStart(runner: RunnerStats) {
        // initialize config fields to prevent possible errors when fields don't exist
        if (!runner.config?.beforeHook) {
            runner.config.beforeHook = []
        }

        if (!runner.config?.beforeTest) {
            runner.config.beforeTest = []
        }

        // @ts-ignore
        if (!runner.config?.beforeStep) {
            // @ts-ignore
            runner.config.beforeStep = []
        }

        // @ts-ignore
        runner.config.beforeTest.push((test: any, ctx: any) => {
            const testFile = test.file.replace(this._config!.rootDir!, '').replace(/^\//, '')
            const testPath = getRunnablePath(ctx.test).filter(Boolean)
            const message: AddTestInfoEventArgs = {
                file: testFile,
                testPath,
                cid: process.env.WDIO_WORKER_ID || DEFAULT_CID
            }

            // @ts-ignore
            process.emit(events.addTestInfo, message)
        })
        // @ts-ignore
        // runner.config.beforeStep.push((step: any, ctx: any) => {
        //     const message: AddTestInfoEventArgs = {
        //         file: ctx.uri as string,
        //         testPath: [ctx.name, step.text],
        //         cid: process.env.WDIO_WORKER_ID || DEFAULT_CID
        //     }
        //
        //     // @ts-ignore
        //     process.emit(events.addTestInfo, message)
        // })
        this._config = runner.config
        this._capabilities = runner.capabilities
        this._isMultiremote = runner.isMultiremote || false
    }

    onRunnerEnd() {
        const cid = getCid()

        this._allureStatesByCid.get(cid)?.processRuntimeMessage?.()
        this._allureStatesByCid.delete(cid)
    }

    onSuiteStart(suite: SuiteStats & { start: Date }) {
        const isScenario = suite.type === 'scenario'
        const isFeature = suite.type === 'feature'
        const processAsSuite = !isScenario

        if (processAsSuite) {
            this._startSuite({ name: suite.title, feature: isFeature })
            return
        }

        // handle a cucumber scenario as a test case
        this._startTest({
            name: suite.title,
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
        const isScenario = suite.type === 'scenario'
        const processAsSuite = !isScenario

        if (processAsSuite) {
            this._endSuite()
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
                stop: suite.end.getTime(),
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
                stage: Stage.FINISHED,
                status: testStatus,
                statusDetails: error ? {
                    message: error.message,
                    trace: error.stack
                } : undefined,
                stop: suite.end.getTime(),
            })
            return
        }

        this._endTest({
            stage: Stage.FINISHED,
            status: AllureStatus.PASSED,
            stop: suite.end.getTime(),
        })

        // TODO: vvvvvv
        // Only close passing and skipped tests because failing tests are closed in onTestFailed event
        //
        // this._allureRuntime.stopTest()
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

    onTestStart(test: TestStats | HookStats) {
        this._consoleOutput = ''

        // cucumber steps shouldn't be reported at all
        if (!this._isCucumberExecutable(test)) {
            this._startTest({
                name: test.title,
                start: test.start?.getTime?.(),
            })
            return
        }

        // we can't process data table when there is no pending test
        if (!this._hasPendingTest) {
            return
        }

        // cucumber steps shouldn't be reported as steps, so we need to process data table only
        const testObj = test as TestStats
        const argument = testObj?.argument as Argument
        const dataTable = argument?.rows?.map(
            (a: { cells: string[] }) => a?.cells
        )

        if (!dataTable) {
            return
        }

        this._attachFile({
            name: 'Data Table',
            content: Buffer.from(stringify(dataTable), 'utf8'),
            contentType: ContentType.CSV,
        })
    }

    onTestPass(test: TestStats | HookStats) {
        if (this._isCucumberExecutable(test)) {
            return
        }

        this._attachLogs()
        this._endTest({
            status: AllureStatus.PASSED,
            stage: Stage.FINISHED,
            stop: test?.end?.getTime?.() ?? Date.now(),
            duration: test.duration,
        })
    }

    onTestRetry(test: TestStats) {
        if (this._isCucumberExecutable(test)) {
            return
        }

        this._attachLogs()

        const status = getTestStatus(test, this._config)

        this._endTest({
            status,
            statusDetails: getStatusDetailsFromFailedTest(test),
            stop: test.end!.getTime(),
            duration: test.duration,
        })
    }

    onTestFail(test: TestStats | HookStats) {
        if (this._isCucumberExecutable(test)) {
            return
        }

        if (!this._hasPendingTest) {
            this.onTestStart(test)
        }

        this._attachLogs()

        const status = getTestStatus(test, this._config)

        this._endTest({
            status,
            stage: Stage.FINISHED,
            statusDetails: getStatusDetailsFromFailedTest(test),
            stop: test.end!.getTime(),
            duration: test.duration,
        })
    }

    onTestSkip(test: TestStats) {
        if (this._isCucumberExecutable(test)) {
            return
        }

        if (this._hasPendingTest) {
            this._attachLogs()
            this._skipTest()
            return
        }

        this._startTest({
            name: test.title,
            start: test.start?.getTime?.(),
        })
        this._attachLogs()
        this._skipTest()
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
            name: stepName as string,
            start: Date.now(),
        })

        if (!isEmpty(payload)) {
            this._attachJSON({
                name: 'Request',
                json: payload,
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
            })
        }

        if (disableWebdriverStepsReporting || this._isMultiremote) {
            return
        }

        this._attachJSON({
            name: 'Response',
            json: commandResult,
        })
        this._endStep({
            status: AllureStatus.PASSED,
            stop: Date.now(),
        })
    }

    onHookStart(hook: HookStats) {
        // TODO: rename `disableMochaHooks` to just `disableHooks`
        const { disableMochaHooks } = this._options

        // don't report global hooks
        if (disableMochaHooks || !hook.parent || !this._hasPendingSuite) {
            return
        }

        const hookTypeFromName = hook.title && /before/i.test(hook.title) ? 'before' : 'after'
        const hookType: 'before' | 'after' = hookTypeFromName ?? this._hasPendingHook ? 'before' : 'after'

        this._startHook({
            name: hook.title ?? 'Unnamed hook',
            type: hookType,
            start: hook?.start?.getTime?.(),
        })
    }

    onHookEnd(hook: HookStats) {
        const { disableMochaHooks } = this._options

        // don't report global hooks
        if (!this._hasPendingSuite || !hook.parent) {
            return
        }

        // report only failed hooks when disableMochaHooks=true
        if (disableMochaHooks && !hook.error) {
            return
        }

        // TODO: move to method
        const hookTypeFromName = hook.title && /before/i.test(hook.title) ? 'before' : 'after'
        const hookType: 'before' | 'after' = hookTypeFromName ?? (this._hasPendingHook ? 'before' : 'after')

        // create a test wrapper for a failed hook, when there is no pending test
        if (hook.error && !this._hasPendingTest && !this._hasPendingHook) {
            this._startTest({
                name: hook.title,
                start: hook.start?.getTime?.(),
            })
            this._startHook({
                name: hook.title ?? 'Unnamed hook',
                type: hookType,
                start: hook.start?.getTime?.(),
            })
            this._endHook({
                status: AllureStatus.BROKEN,
                statusDetails: {
                    message: hook.error.message,
                    trace: hook.error.stack,
                },
                duration: hook.duration,
            })
            this._endTest({
                status: AllureStatus.BROKEN,
                stage: Stage.FINISHED,
                duration: hook.duration,
                stop: hook.end?.getTime?.(),
            })
            return
        }

        // start a failed hook to close it later
        if (hook.error && this._hasPendingTest && !this._hasPendingHook) {
            this._startHook({
                name: hook.title ?? 'Unnamed hook',
                type: hookType,
                start: hook.start?.getTime?.(),
            })
        }

        this._endHook({
            status: hook.error ? AllureStatus.BROKEN: AllureStatus.PASSED,
            statusDetails: hook.error && {
                message: hook.error.message,
                trace: hook.error.stack,
            },
            stop: hook.end?.getTime?.(),
            duration: hook.duration,
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
    }

    //#region Runtime API
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
        if (type === ContentType.JSON) {
            this._attachJSON({
                name,
                json: content,
            })
            return
        }

        this._attachFile({
            name,
            content: Buffer.from(content as string),
            contentType: type as ContentType,
        })
    }

    async addArgument({ name, value }: AddArgumentEventArgs) {
        await parameter(name, value)
    }

    async addStep({ step }: AddStepEventArgs) {
        this._startStep({
            name: step.title,
            start: Date.now(),
        })

        if (step.attachment) {
            const { name, content, type = ContentType.TEXT } = step.attachment
            const attachmentContent = content instanceof Buffer ? content : Buffer.from(content, 'utf8')

            this._attachFile({
                name,
                content: attachmentContent,
                contentType: type,
            })
        }

        this._endStep({
            status: step.status,
            stop: Date.now(),
        })
    }

    async startStep(name: string) {
        this._startStep({
            name,
            start: Date.now(),
        })
    }

    async endStep(status: AllureStatus) {
        this._endStep({
            status,
            stop: Date.now(),
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
    static addHistoryId = addHistoryId
    static addTestCaseId = addTestCaseId
    static step = step
    //#endregion
}

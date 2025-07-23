import { sep } from 'node:path'
import process from 'node:process'
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
import type { Capabilities, Options } from '@wdio/types'

import type { ContentType, Stage, Status as AllureStatus, StatusDetails } from 'allure-js-commons'
import {
    ContentType as AllureContentType,
    description,
    label,
    LabelName,
    Stage as AllureStage,
    Status as AllureStatusEnum,
} from 'allure-js-commons'
import type { RuntimeMessage } from 'allure-js-commons/sdk'
import { FileSystemWriter, getEnvironmentLabels, getSuiteLabels, ReporterRuntime, } from 'allure-js-commons/sdk/reporter'
import { setGlobalTestRuntime } from 'allure-js-commons/sdk/runtime'

import { WdioTestRuntime } from './WdioTestRuntime.js'
import { AllureReportState } from './state.js'
import {
    convertSuiteTagsToLabels,
    getCid,
    getErrorFromFailedTest,
    getStatusDetailsFromFailedTest,
    getTestStatus,
    isEmpty,
    isScreenshotCommand,
} from './utils.js'
import type { AddTestInfoEventArgs, AllureReporterOptions, WDIORuntimeMessage, } from './types.js'
import { DEFAULT_CID, events } from './constants.js'

export default class AllureReporter extends WDIOReporter {
    private _allureRuntime: ReporterRuntime
    private _allureState: AllureReportState
    private _capabilities: Capabilities.ResolvedTestrunnerCapabilities
    private _isMultiremote?: boolean
    private _config?: Options.Testrunner
    private _options: AllureReporterOptions
    private _consoleOutput = ''
    private _originalStdoutWrite: typeof process.stdout.write
    private _isFlushing = false
    private _cid?: string

    private _currentCid(): string {
        return this._cid || DEFAULT_CID
    }

    allureStatesByCid: Map<string, AllureReportState> = new Map()

    private static getTimeOrNow(d: unknown): number {
        return typeof d === 'object' && d !== null && 'getTime' in (d as object) &&
        typeof (d as Date).getTime === 'function'
            ? (d as Date).getTime()
            : Date.now()
    }

    get isSynchronised() {
        return !this._isFlushing
    }

    constructor(options: AllureReporterOptions) {
        const { outputDir, resultsDir, ...rest } = options
        super({ ...rest, outputDir })

        this._originalStdoutWrite = process.stdout.write.bind(process.stdout) as typeof process.stdout.write

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

        if (options.addConsoleLogs) {
            const self = this
            process.stdout.write = function (
                chunk: string | Uint8Array,
                encoding?: BufferEncoding | ((err?: Error) => void),
                cb?: (err?: Error) => void
            ): boolean {
                const str = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8')
                if (!str.includes('mwebdriver')) {
                    self._consoleOutput += str
                }
                if (typeof encoding === 'function') {
                    return self._originalStdoutWrite(chunk, undefined as unknown as BufferEncoding, encoding)
                }
                return self._originalStdoutWrite(chunk, encoding, cb)
            }
        }
    }

    private _suiteStackByCid = new Map<string, string[]>()
    private _suiteStack = (cid: string) => this._suiteStackByCid.get(cid) ?? (this._suiteStackByCid.set(cid, []).get(cid)!)
    private _pkgByCid: Map<string, string> = new Map()

    private _ensureState(cid: string): AllureReportState {
        if (!this.allureStatesByCid.has(cid)) {
            this.allureStatesByCid.set(cid, new AllureReportState(this._allureRuntime))
        }
        return this.allureStatesByCid.get(cid)!
    }

    private _pushRuntimeMessage(message: WDIORuntimeMessage): void {
        const cid = this._currentCid()
        const state = this._ensureState(cid)
        state.pushRuntimeMessage(message)
    }

    private _attachFile(payload: { name: string; content: Buffer; contentType: ContentType }): void {
        const { name, content, contentType } = payload
        this._pushRuntimeMessage({
            type: 'attachment_content',
            data: {
                name,
                content: Buffer.from(content).toString('base64'),
                contentType,
                encoding: 'base64',
            },
        })
    }

    _attachLogs(): void {
        if (!this._consoleOutput) {
            return
        }
        this._attachFile({
            name: 'Console Logs',
            content: Buffer.from(`.........Console Logs.........\n\n${this._consoleOutput}`, 'utf8'),
            contentType: AllureContentType.TEXT,
        })
        this._consoleOutput = ''
    }

    _attachJSON(payload: { name: string; json: unknown }): void {
        const { name, json } = payload
        const content = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
        this._attachFile({
            name,
            content: Buffer.from(String(content), 'utf8'),
            contentType: AllureContentType.JSON,
        })
    }

    _attachScreenshot(payload: { name: string; content: Buffer }): void {
        const { name, content } = payload
        this._attachFile({ name, content, contentType: AllureContentType.PNG })
    }

    private _startSuite(payload: { name: string; feature?: boolean }): void {
        this._pushRuntimeMessage({ type: 'allure:suite:start', data: payload })
    }

    private _endSuite(): void {
        this._pushRuntimeMessage({ type: 'allure:suite:end', data: {} })
    }

    private _startTest(payload: { name: string; start: number }): void {
        this._pushRuntimeMessage({ type: 'allure:test:start', data: payload })
        this._setTestParameters()
    }

    private _endTest(payload: {
        status: AllureStatus
        stop?: number
        duration?: number
        statusDetails?: StatusDetails
        stage?: Stage
    }): void {
        this._pushRuntimeMessage({ type: 'allure:test:end', data: payload })
    }

    private _skipTest(): void {
        this._endTest({ status: AllureStatusEnum.SKIPPED, stage: AllureStage.PENDING, stop: Date.now() })
    }

    private _startStep(payload: { name: string; start: number }): void {
        this._pushRuntimeMessage({ type: 'step_start', data: payload })
    }

    private _endStep(payload: { status: AllureStatus; stop: number; statusDetails?: StatusDetails }): void {
        this._pushRuntimeMessage({ type: 'step_stop', data: payload })
    }

    private _startHook(payload: { name: string; type: 'before' | 'after'; start: number }): void {
        this._pushRuntimeMessage({ type: 'allure:hook:start', data: payload })
    }

    private _endHook(payload: {
        status: AllureStatus
        statusDetails?: StatusDetails
        stop?: number
        duration?: number
    }): void {
        const { status, statusDetails, stop = Date.now(), duration } = payload
        this._pushRuntimeMessage({
            type: 'allure:hook:end',
            data: { status, statusDetails, stop, duration },
        })
    }

    private _setTestParameters(): void {
        const cid = getCid()

        if (!this._isMultiremote) {
            const caps = this._capabilities
            // @ts-expect-error legacy
            const { browserName, desired, device } = caps
            const deviceName =
                (desired || {}).deviceName ||
                (desired || {})['appium:deviceName'] ||
                // @ts-expect-error legacy
                caps.deviceName ||
                caps['appium:deviceName']

            let targetName = device || browserName || deviceName || cid
            if (desired && deviceName && desired['appium:platformVersion']) {
                targetName = `${device || deviceName} ${desired['appium:platformVersion']}`
            }
            // @ts-expect-error legacy
            const browserstackVersion = caps.os_version || caps.osVersion
            const version =
                browserstackVersion ||
                caps.browserVersion ||
                // @ts-expect-error legacy
                caps.version ||
                caps['appium:platformVersion'] ||
                ''

            const paramName = deviceName || device ? 'device' : 'browser'
            const paramValue = version ? `${targetName}-${version}` : targetName

            if (paramValue) {
                this._pushRuntimeMessage({
                    type: 'metadata',
                    data: { parameters: [{ name: paramName, value: paramValue }] },
                })
            }
        } else {
            this._pushRuntimeMessage({
                type: 'metadata',
                data: { parameters: [{ name: 'isMultiremote', value: 'true' }] },
            })
        }

        if (this._allureState.currentFeature) {
            this._pushRuntimeMessage({
                type: 'metadata',
                data: { labels: [{ name: LabelName.FEATURE, value: this._allureState.currentFeature }] },
            })
        }
    }

    private _registerListeners(): void {
        setGlobalTestRuntime(new WdioTestRuntime())

        process.on(events.addTestInfo, (payload: AddTestInfoEventArgs) => {
            const { file, testPath, cid = DEFAULT_CID } = payload

            this._pushRuntimeMessage({
                type: 'allure:test:info',
                data: { fullName: `${file}#${testPath.join(' ')}` },
            })

            if (file) {
                this._pkgByCid.set(cid, file.replace(sep, '.'))
            }

            const suitePath = [...this._suiteStack(cid)]
            const pkg = this._pkgByCid.get(cid)
            const labels = [
                ...getSuiteLabels(suitePath),
                ...(pkg ? [{ name: LabelName.PACKAGE, value: pkg }] : []),
                { name: LabelName.LANGUAGE, value: 'javascript' },
                { name: LabelName.FRAMEWORK, value: 'wdio' },
                { name: LabelName.THREAD, value: cid },
                ...getEnvironmentLabels(),
            ]
            if (testPath.length > 1) {
                this._pushRuntimeMessage({ type: 'metadata', data: { labels } })
            }

            if (cid !== DEFAULT_CID) {
                this._pushRuntimeMessage({
                    type: 'metadata',
                    data: { labels: [{ name: LabelName.THREAD, value: cid }] },
                })
            }
        })

        process.on(events.startStep, (name: string) => {
            this._pushRuntimeMessage({ type: 'step_start', data: { name, start: Date.now() } })
        })
        process.on(events.endStep, (status: AllureStatus) => {
            this._pushRuntimeMessage({ type: 'step_stop', data: { status, stop: Date.now() } })
        })
        process.on(events.runtimeMessage, (payload: RuntimeMessage) => {
            this._pushRuntimeMessage(payload as WDIORuntimeMessage)
        })
    }

    onRunnerStart(runner: RunnerStats): void {
        this._cid = runner.cid
        this._ensureState(runner.cid)
        this._config = runner.config
        this._capabilities = runner.capabilities
        this._isMultiremote = runner.isMultiremote || false
    }

    async onRunnerEnd(_runner: RunnerStats): Promise<void> {
        this._isFlushing = true
        try {
            for (const [cid, state] of this.allureStatesByCid) {
                await state.processRuntimeMessage()
                this.allureStatesByCid.delete(cid)
            }
        } finally {
            if (this._options.addConsoleLogs) {
                process.stdout.write = this._originalStdoutWrite
            }
            this._isFlushing = false
        }
        this._allureRuntime.writeEnvironmentInfo()
    }

    onSuiteStart(suite: SuiteStats & { start: Date }): void {
        const isScenario = suite.type === 'scenario'
        const isFeature = suite.type === 'feature'
        if (!isScenario) {
            this._suiteStack(this._currentCid()).push(suite.title)
            this._startSuite({ name: suite.title, feature: isFeature })
            return
        }

        const start = AllureReporter.getTimeOrNow(suite.start)
        this._startTest({ name: suite.title, start })
        convertSuiteTagsToLabels(suite?.tags || []).forEach((lbl) => {
            switch (lbl.name) {
            case 'issue':
                label('issue', lbl.value)
                break
            case 'testId':
                label('testId', lbl.value)
                break
            default:
                label(lbl.name, lbl.value)
            }
        })

        if (suite.description) {
            description(suite.description)
        }
    }

    onSuiteEnd(suite: SuiteStats & { end: Date }): void {
        const isScenario = suite.type === 'scenario'
        if (!isScenario) {
            this._endSuite()
            const stack = this._suiteStack(this._currentCid())
            if (stack.length) {
                stack.pop()
            }
            return
        }

        suite.hooks = suite.hooks!.map((h) => {
            h.state = h.state || AllureStatusEnum.PASSED
            return h
        })

        const suiteChildren = [...suite.tests!, ...suite.hooks]
        const isSkipped =
            suite.tests.every((t) => [AllureStatusEnum.SKIPPED].includes(t.state as AllureStatus)) &&
            suite.hooks.every((h) =>
                [AllureStatusEnum.PASSED, AllureStatusEnum.SKIPPED].includes(h.state as AllureStatus),
            )

        if (isSkipped) {
            this._endTest({
                status: AllureStatusEnum.SKIPPED,
                stage: AllureStage.PENDING,
                stop: AllureReporter.getTimeOrNow(suite.end),
            })
            return
        }

        const failed = suiteChildren.find((i) => i.state === AllureStatusEnum.FAILED)
        if (failed) {
            const status = getTestStatus(failed)
            const error = getErrorFromFailedTest(failed)
            this._endTest({
                stage: AllureStage.FINISHED,
                status,
                statusDetails: error ? { message: error.message, trace: error.stack } : undefined,
                stop: AllureReporter.getTimeOrNow(suite.end),
            })
            return
        }

        this._endTest({
            stage: AllureStage.FINISHED,
            status: AllureStatusEnum.PASSED,
            stop: AllureReporter.getTimeOrNow(suite.end),
        })
    }

    onSuiteRetry(_suite: SuiteStats): void {
        this._pushRuntimeMessage({
            type: 'metadata',
            data: { labels: [{ name: LabelName.TAG, value: 'retried' }] },
        })
    }

    onTestStart(test: TestStats | HookStats): void {
        this._consoleOutput = ''

        if (!this._isCucumberExecutable(test)) {
            const start = AllureReporter.getTimeOrNow((test as TestStats).start)
            this._startTest({ name: test.title, start })
            const cid = this._currentCid()
            this._pushRuntimeMessage({ type: 'allure:test:info', data: { fullName: (test as TestStats)?.fullTitle } })
            const suitePath = [...this._suiteStack(cid)]
            const pkg = this._pkgByCid.get(cid)

            const labels = [
                ...getSuiteLabels(suitePath),
                ...(pkg ? [{ name: LabelName.PACKAGE, value: pkg }] : []),
                { name: LabelName.LANGUAGE, value: 'javascript' },
                { name: LabelName.FRAMEWORK, value: 'wdio' },
                { name: LabelName.THREAD, value: cid },
                ...getEnvironmentLabels(),
            ]

            this._pushRuntimeMessage({ type: 'metadata', data: { labels } })
            return
        }

        if (!this._hasPendingTest) {
            return
        }
        const t = test as TestStats
        const argument = t?.argument as Argument
        const dataTable = argument?.rows?.map((a: { cells: string[] }) => a?.cells)
        if (!dataTable) {
            return
        }

        this._attachFile({
            name: 'Data Table',
            content: Buffer.from(stringify(dataTable), 'utf8'),
            contentType: AllureContentType.CSV,
        })
    }

    onTestPass(test: TestStats | HookStats): void {
        if (this._isCucumberExecutable(test)) {
            return
        }
        this._attachLogs()
        const end = AllureReporter.getTimeOrNow((test as TestStats).end)
        this._endTest({
            status: AllureStatusEnum.PASSED,
            stage: AllureStage.FINISHED,
            stop: end,
            duration: (test as TestStats).duration,
        })
    }

    onTestRetry(test: TestStats): void {
        if (this._isCucumberExecutable(test)) {
            return
        }
        this._attachLogs()
        const status = getTestStatus(test, this._config)
        this._endTest({
            status,
            statusDetails: getStatusDetailsFromFailedTest(test),
            stop: AllureReporter.getTimeOrNow(test.end),
            duration: test.duration,
        })
    }

    onTestFail(test: TestStats | HookStats): void {
        if (this._isCucumberExecutable(test)) {
            return
        }
        if (!this._hasPendingTest) {
            this.onTestStart(test)
        }
        this._attachLogs()
        const status = getTestStatus(test as TestStats, this._config)
        this._endTest({
            status,
            stage: AllureStage.FINISHED,
            statusDetails: getStatusDetailsFromFailedTest(test as TestStats),
            stop: AllureReporter.getTimeOrNow((test as TestStats).end),
            duration: (test as TestStats).duration,
        })
    }

    onTestSkip(test: TestStats): void {
        if (this._isCucumberExecutable(test)) {
            return
        }
        if (this._hasPendingTest) {
            this._attachLogs()
            this._skipTest()
            return
        }
        const start = AllureReporter.getTimeOrNow(test.start)
        this._startTest({ name: test.title, start })
        this._attachLogs()
        this._skipTest()
    }

    onBeforeCommand(command: BeforeCommandArgs): void {
        const { disableWebdriverStepsReporting } = this._options
        if (disableWebdriverStepsReporting || this._isMultiremote) {
            return
        }

        const { method, endpoint } = command
        const stepName = command.command ? (command.command as string) : `${method} ${endpoint}`
        const payload = (command as unknown as { body?: unknown; params?: unknown }).body ?? command.params

        this._startStep({ name: stepName, start: Date.now() })
        // @ts-expect-error
        if (payload && !(typeof payload === 'object' && isEmpty(payload))) {
            this._attachJSON({ name: 'Request', json: payload })
        }
    }

    onAfterCommand(command: AfterCommandArgs): void {
        const { disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting } = this._options

        const isShot = isScreenshotCommand(command)
        const res = (command as unknown as { result?: unknown }).result
        const commandResult =
            res && typeof res === 'object' && res !== null && 'value' in (res as Record<string, unknown>)
                ? (res as Record<string, unknown>)['value']
                : res

        if (!disableWebdriverScreenshotsReporting && isShot && commandResult) {
            const base64 = typeof commandResult === 'string' ? commandResult : undefined
            if (base64) {
                this._attachScreenshot({ name: 'Screenshot', content: Buffer.from(base64, 'base64') })
            }
        }

        if (disableWebdriverStepsReporting || this._isMultiremote) {
            return
        }

        const hasData =
            commandResult !== undefined &&
            commandResult !== null &&
            !(typeof commandResult === 'object' && isEmpty(commandResult as never))

        if (!isShot && hasData) {
            this._attachJSON({ name: 'Response', json: commandResult })
        }

        this._endStep({ status: AllureStatusEnum.PASSED, stop: Date.now() })
    }

    onHookStart(hook: HookStats): void {
        const { disableMochaHooks } = this._options
        if (disableMochaHooks || !hook.parent || !this._hasPendingSuite) {
            return
        }

        const hookTypeFromName = hook.title && /before/i.test(hook.title) ? 'before' : 'after'
        const hookType: 'before' | 'after' =
            (hookTypeFromName as 'before' | 'after') ?? (this._hasPendingHook ? 'before' : 'after')

        const start = AllureReporter.getTimeOrNow(hook.start)
        this._startHook({
            name: hook.title ?? 'Unnamed hook',
            type: hookType,
            start,
        })
    }

    onHookEnd(hook: HookStats): void {
        const { disableMochaHooks } = this._options
        if (!this._hasPendingSuite || !hook.parent) {
            return
        }
        if (disableMochaHooks && !hook.error) {
            return
        }

        const hookTypeFromName = hook.title && /before/i.test(hook.title) ? 'before' : 'after'
        const hookType: 'before' | 'after' =
            (hookTypeFromName as 'before' | 'after') ?? (this._hasPendingHook ? 'before' : 'after')

        if (hook.error && !this._hasPendingTest && !this._hasPendingHook) {
            const start = AllureReporter.getTimeOrNow(hook.start)
            this._startTest({ name: hook.title, start })
            this._startHook({ name: hook.title ?? 'Unnamed hook', type: hookType, start })
            this._endHook({
                status: AllureStatusEnum.BROKEN,
                statusDetails: { message: hook.error.message, trace: hook.error.stack },
                duration: hook.duration,
            })
            this._endTest({
                status: AllureStatusEnum.BROKEN,
                stage: AllureStage.FINISHED,
                duration: hook.duration,
                stop: AllureReporter.getTimeOrNow(hook.end),
            })
            return
        }

        if (hook.error && this._hasPendingTest && !this._hasPendingHook) {
            const start = AllureReporter.getTimeOrNow(hook.start)
            this._startHook({ name: hook.title ?? 'Unnamed hook', type: hookType, start })
        }

        this._endHook({
            status: hook.error ? AllureStatusEnum.BROKEN : AllureStatusEnum.PASSED,
            statusDetails: hook.error && { message: hook.error.message, trace: hook.error.stack },
            stop: AllureReporter.getTimeOrNow(hook.end),
            duration: hook.duration,
        })
    }

    private get _hasPendingSuite() {
        const current = this.allureStatesByCid.get(this._currentCid())
        return current?.hasPendingSuite
    }

    private get _hasPendingTest() {
        const current = this.allureStatesByCid.get(this._currentCid())
        return current?.hasPendingTest
    }

    private get _hasPendingHook() {
        const current = this.allureStatesByCid.get(this._currentCid())
        return current?.hasPendingHook
    }

    private _isCucumberExecutable(executable: TestStats | HookStats | SuiteStats): boolean {
        const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        return uuidRe.test(executable.uid)
    }
}

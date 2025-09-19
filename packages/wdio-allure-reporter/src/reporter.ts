import process from 'node:process'
import { createHash } from 'node:crypto'
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
    descriptionHtml,
    label,
    LabelName,
    Stage as AllureStage,
    Status as AllureStatusEnum,
} from 'allure-js-commons'
import type { RuntimeMessage } from 'allure-js-commons/sdk'
import { getMessageAndTraceFromError } from 'allure-js-commons/sdk'
import { FileSystemWriter, getEnvironmentLabels, getSuiteLabels, ReporterRuntime } from 'allure-js-commons/sdk/reporter'
import { setGlobalTestRuntime } from 'allure-js-commons/sdk/runtime'
import { includedInTestPlan as includedInTestPlanCommons } from 'allure-js-commons/sdk/reporter'

import { WdioTestRuntime } from './WdioTestRuntime.js'
import { AllureReportState } from './state.js'
import {
    absPosix,
    convertSuiteTagsToLabels,
    getCid,
    getErrorFromFailedTest,
    getStatusDetailsFromFailedTest,
    getTestStatus,
    isEmptyObject,
    isObject,
    isScreenshotCommand,
    relNoSlash,
    toFullName,
    toPackageLabel,
    toPackageLabelCucumber,
} from './utils.js'
import type { AddTestInfoEventArgs, AllureReporterOptions, WDIORuntimeMessage } from './types.js'
import { DEFAULT_CID, events } from './constants.js'

import {
    applyTestPlanLabel,
    installBddTestPlanFilter,
    type LoadedTestPlan,
    loadTestPlan,
} from './testplan.js'

import * as AllureApi from './common/api.js'

type LinkTemplates = { issue?: { urlTemplate: string }; tms?: { urlTemplate: string } }

type StepAttachment = { content: string | Buffer; name?: string; type?: string }
type StepPayload = { title?: string; attachment?: StepAttachment; status?: AllureStatus }
type StepWrapper = { step: StepPayload }

type MaybeUid = { uid?: string }
type MaybeFile = { file?: string }
type MaybeResult = { result?: unknown }
type MaybeBody = { body?: unknown; params?: unknown }

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null
}

/**
 * Safely read a string field from an unknown object.
 * Returns the field value if it exists and is a string; otherwise returns undefined.
 */
function getStringField(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) {return undefined}
    const v = obj[key]
    return typeof v === 'string' ? v : undefined
}

function getType(obj: unknown): string | undefined {
    return getStringField(obj, 'type')
}

function getKeyword(obj: unknown): string | undefined {
    return getStringField(obj, 'keyword')
}

function getParentType(obj: unknown): string | undefined {
    return getStringField(obj, 'parent') ?? getStringField(obj, 'type')
}

function getTitle(obj: unknown): string | undefined {
    return getStringField(obj, 'title')
}

function isFeatureFilePath(file?: string): boolean {
    return typeof file === 'string' && /\.feature$/i.test(file.replace(/\\/g, '/'))
}

function hasCucumberKeywordInTitle(title?: string): boolean {
    if (!title) {return false}
    return /^(Given|When|Then|And|But)\b/.test(title)
}

export default class AllureReporter extends WDIOReporter {
    private _allureRuntime: ReporterRuntime
    private _capabilities: Capabilities.ResolvedTestrunnerCapabilities
    private _isMultiremote?: boolean
    private _config?: Options.Testrunner
    private _options: AllureReporterOptions
    private _consoleOutput = ''
    private _originalStdoutWrite: typeof process.stdout.write
    private _isFlushing = false
    private _cid?: string

    private _testPlan: LoadedTestPlan | null
    private _suiteStartedDepthByCid = new Map<string, number>()
    private _currentLeafTitleByCid = new Map<string, string>()
    private _tpSkipByCid = new Map<string, boolean>()
    private _linkTemplates?: LinkTemplates

    private _suiteStackByCid = new Map<string, string[]>()
    private _suiteStack = (cid: string) =>
        this._suiteStackByCid.get(cid) ?? this._suiteStackByCid.set(cid, []).get(cid)!
    private _pkgByCid: Map<string, string> = new Map()

    private _cukeScenarioActiveByCid = new Map<string, boolean>()

    allureStatesByCid: Map<string, AllureReportState> = new Map()

    private static getTimeOrNow(d: unknown): number {
        return d instanceof Date ? d.getTime() : Date.now()
    }

    get isSynchronised(): boolean {
        return !this._isFlushing
    }

    constructor(options: AllureReporterOptions) {
        const { outputDir, resultsDir, ...rest } = options

        const normalizeTpl = (tpl?: string) => (tpl ? tpl.replace(/\{\}/g, '%s') : tpl)

        // @ts-ignore
        const links: LinkTemplates = {
            ...rest.links,
            ...(options.issueLinkTemplate ? { issue: { urlTemplate: normalizeTpl(options.issueLinkTemplate)! } } : {}),
            ...(options.tmsLinkTemplate ? { tms: { urlTemplate: normalizeTpl(options.tmsLinkTemplate)! } } : {}),
        }

        super({ ...rest, outputDir })
        this._linkTemplates = links

        this._originalStdoutWrite = process.stdout.write.bind(process.stdout) as typeof process.stdout.write

        this._allureRuntime = new ReporterRuntime({
            ...rest,
            links,
            environmentInfo: options.reportedEnvironmentVars,
            writer: new FileSystemWriter({
                resultsDir: outputDir || resultsDir || 'allure-results',
            }),
        })

        this._capabilities = {}
        this._options = options

        this._testPlan = loadTestPlan()
        if (this._testPlan) { installBddTestPlanFilter(this._testPlan) }

        this._registerListeners()

        if (options.addConsoleLogs) {
            const self = this
            process.stdout.write = function (
                chunk: string | Uint8Array,
                encoding?: BufferEncoding | ((err?: Error) => void),
                cb?: (err?: Error) => void,
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

    private _currentCid(): string {
        return this._cid || DEFAULT_CID
    }

    private _attachLogs(): void {
        if (!this._consoleOutput) {return}
        this._attachFile({
            name: 'Console Logs',
            content: Buffer.from(`.........Console Logs.........\n\n${this._consoleOutput}`, 'utf8'),
            contentType: AllureContentType.TEXT,
        })
        this._consoleOutput = ''
    }

    private _attachJSON(payload: { name: string; json: unknown }): void {
        const { name, json } = payload
        const content = typeof json === 'string' ? json : JSON.stringify(json, null, 2)
        this._attachFile({
            name,
            content: Buffer.from(String(content), 'utf8'),
            contentType: AllureContentType.JSON,
        })
    }

    private _attachScreenshot(payload: { name: string; content: Buffer }): void {
        const { name, content } = payload
        this._attachFile({ name, content, contentType: AllureContentType.PNG })
    }

    private _handleCucumberStepStart(t: TestStats): void {
        if (!this._hasPendingTest) {return}

        const arg = t.argument as Argument | undefined
        const dataTable = Array.isArray(arg?.rows)
            ? arg!.rows.map((row: { cells: string[] }) => row.cells)
            : undefined
        if (dataTable?.length) {
            this._attachFile({
                name: 'Data Table',
                content: Buffer.from(stringify(dataTable), 'utf8'),
                contentType: AllureContentType.CSV,
            })
        }

        const start = AllureReporter.getTimeOrNow(t.start)
        this._startStep({ name: t.title, start })
    }

    private _handleCucumberStepEnd(
        t: TestStats | HookStats,
        status: AllureStatus,
        details?: StatusDetails
    ): void {
        this._attachLogs()
        const stop = AllureReporter.getTimeOrNow((t as TestStats).end)
        this._endStep({ status, stop, statusDetails: details })
    }

    private _startSuite(payload: { name: string; feature?: boolean }): void {
        this._pushRuntimeMessage({ type: 'allure:suite:start', data: payload })
    }
    private _endSuite(): void {
        this._pushRuntimeMessage({ type: 'allure:suite:end', data: {} })
    }

    private _startTest(payload: { name: string; start: number; uuid?: string }): void {
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
    private _endHook(payload: { status: AllureStatus; statusDetails?: StatusDetails; stop?: number; duration?: number }): void {
        const { status, statusDetails, stop = Date.now(), duration } = payload
        this._pushRuntimeMessage({ type: 'allure:hook:end', data: { status, statusDetails, stop, duration } })
    }

    private _emitHistoryIdsFrom(fullTitleForHash: string): void {
        const legacy = this._md5(fullTitleForHash)
        this._pushRuntimeMessage({ type: 'metadata', data: { historyId: legacy, testCaseId: legacy } })
    }

    private _setTestParameters(): void {
        const cid = getCid()

        if (!this._isMultiremote) {
            const capsUnknown: unknown = this._capabilities

            const browserName = getStringField(capsUnknown, 'browserName')
            const device = getStringField(capsUnknown, 'device')

            const desired: Record<string, unknown> | undefined = ((): Record<string, unknown> | undefined => {
                const maybe = (capsUnknown as Record<string, unknown>)?.['desired']
                return isRecord(maybe) ? maybe : undefined
            })()

            const deviceName =
                getStringField(desired, 'deviceName') ||
                getStringField(desired, 'appium:deviceName') ||
                getStringField(capsUnknown, 'deviceName') ||
                getStringField(capsUnknown, 'appium:deviceName')

            let targetName = device || browserName || deviceName || cid
            const desiredPlatformVersion = getStringField(desired, 'appium:platformVersion')
            if (desired && deviceName && desiredPlatformVersion) {
                targetName = `${device || deviceName} ${desiredPlatformVersion}`
            }

            const browserstackVersion =
                getStringField(capsUnknown, 'os_version') ||
                getStringField(capsUnknown, 'osVersion')

            const version =
                browserstackVersion ||
                getStringField(capsUnknown, 'browserVersion') ||
                getStringField(capsUnknown, 'version') ||
                getStringField(capsUnknown, 'appium:platformVersion') ||
                ''

            const paramName = (deviceName || device) ? 'device' : 'browser'
            const paramValue = version ? `${targetName}-${version}` : (targetName || '')

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

        const st = this._ensureState(this._currentCid())
        const feat = st.currentFeature
        if (feat) {
            this._pushRuntimeMessage({
                type: 'metadata',
                data: { labels: [{ name: LabelName.FEATURE, value: feat }] },
            })
        }
    }

    private _registerListeners(): void {
        setGlobalTestRuntime(new WdioTestRuntime())

        process.on(events.addTestInfo, (payload: AddTestInfoEventArgs) => {
            const { file, testPath, cid = DEFAULT_CID } = payload

            if (file) {
                this._pkgByCid.set(cid, absPosix(file))
            }

            const fileStr = (file || '').replace(/\\/g, '/')
            if (/\.feature$/i.test(fileStr)) {
                const ft = Array.isArray(testPath) ? testPath.map(String).join(' ') : ''
                const fullName = `${relNoSlash(file)}#${ft}`

                this._pushRuntimeMessage({ type: 'allure:test:info', data: { fullName, fullTitle: ft } })
                applyTestPlanLabel(this._testPlan, (m) => this._pushRuntimeMessage(m), {
                    file,
                    testPath,
                })

                const suitePath = [...this._suiteStack(cid)]
                const pkg = toPackageLabelCucumber(file || this._pkgByCid.get(cid) || '')
                const labels = [
                    ...getSuiteLabels(suitePath),
                    ...(pkg ? [{ name: LabelName.PACKAGE, value: pkg }] : []),
                    { name: LabelName.LANGUAGE, value: 'javascript' },
                    { name: LabelName.FRAMEWORK, value: 'wdio' },
                    { name: LabelName.THREAD, value: cid },
                    ...getEnvironmentLabels(),
                ]
                this._pushRuntimeMessage({ type: 'metadata', data: { labels } })

                if (cid !== DEFAULT_CID) {
                    this._pushRuntimeMessage({
                        type: 'metadata',
                        data: { labels: [{ name: LabelName.THREAD, value: cid }] },
                    })
                }
            }
        })

        process.on(events.startStep, (name: string) => {
            if (this._tpSkipActive(this._currentCid())) {return}
            this._pushRuntimeMessage({ type: 'step_start', data: { name, start: Date.now() } })
        })
        process.on(
            events.endStep,
            (arg: AllureStatus | { status: AllureStatus; statusDetails?: StatusDetails }) => {
                if (this._tpSkipActive(this._currentCid())) {return}
                const payload = typeof arg === 'string' ? { status: arg } : arg
                this._pushRuntimeMessage({ type: 'step_stop', data: { ...payload, stop: Date.now() } })
            },
        )
        process.on(events.runtimeMessage, (payload: RuntimeMessage) => {
            if (this._tpSkipActive(this._currentCid())) {return}
            this._pushRuntimeMessage(payload as WDIORuntimeMessage)
        })
    }

    onRunnerStart(runner: RunnerStats): void {
        this._cid = runner.cid
        this._ensureState(runner.cid)
        this._config = runner.config
        this._capabilities = runner.capabilities
        this._isMultiremote = runner.isMultiremote || false

        const specs = (runner as unknown as { specs?: string[] }).specs || []
        if (specs.length) {
            this._pkgByCid.set(runner.cid, absPosix(specs[0]))
        }
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
        const cid = this._currentCid()

        switch (suite.type) {
        case 'feature': {
            this._cukeScenarioActiveByCid.delete(cid)
            this._suiteStack(cid).push(suite.title)
            this._startSuite({ name: suite.title, feature: true })
            break
        }
        case 'scenario': {
            this._cukeScenarioActiveByCid.set(cid, true)

            this._ensureSuitesStarted(cid)

            const mustSkip = this._decideCucumberSkip(cid, suite.title)
            const start = AllureReporter.getTimeOrNow(suite.start)
            const uuid = (suite as MaybeUid).uid

            this._consoleOutput = ''
            this._startTest({ name: suite.title, start, uuid })

            this._currentLeafTitleByCid.set(cid, suite.title)
            const fullTitleForHash = this._mochaFullTitle(cid, suite.title)
            this._emitHistoryIdsFrom(fullTitleForHash)

            const fullName = toFullName(this._pkgByCid.get(cid)!, fullTitleForHash)
            this._pushRuntimeMessage({ type: 'allure:test:info', data: { fullName, fullTitle: fullTitleForHash } })

            applyTestPlanLabel(this._testPlan, (m) => this._pushRuntimeMessage(m), {
                fullTitle: fullTitleForHash,
                file: this._pkgByCid.get(cid),
            })

            this._emitBaseLabels(cid)

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

            if (mustSkip) {
                this._tpSkipByCid.set(cid, true)
                this._attachLogs()
                this._endTest({ status: AllureStatusEnum.SKIPPED, stage: AllureStage.PENDING, stop: Date.now() })
                return
            }
            break
        }
        default: {
            this._suiteStack(cid).push(suite.title)
            this._startSuite({ name: suite.title })
        }
        }
    }

    onSuiteEnd(suite: SuiteStats & { end: Date }): void {
        const isScenario = suite.type === 'scenario'
        const cid = this._currentCid()

        if (isScenario && this._tpSkipActive(cid)) {
            this._tpSkipByCid.delete(cid)
            this._cukeScenarioActiveByCid.delete(cid)
            return
        }

        if (!isScenario) {
            const stack = this._suiteStack(cid)
            const depthBeforePop = stack.length
            const startedDepth = this._suiteStartedDepthByCid.get(cid) ?? 0

            if (!this._tpActive()) {
                this._endSuite()
                stack.pop()
                return
            }

            if (startedDepth >= depthBeforePop) {
                this._endSuite()
                this._suiteStartedDepthByCid.set(cid, startedDepth - 1)
            }
            if (stack.length) {
                this._endSuite()
                stack.pop()
            }
            return
        }

        this._cukeScenarioActiveByCid.delete(cid)

        suite.hooks = suite.hooks!.map((h) => {
            h.state = h.state || AllureStatusEnum.PASSED
            return h
        })

        const suiteChildren = [...suite.tests!, ...suite.hooks]
        const isSkipped =
            suite.tests.every((t) => [AllureStatusEnum.SKIPPED].includes(t.state as AllureStatus)) &&
            suite.hooks.every((h) => [AllureStatusEnum.PASSED, AllureStatusEnum.SKIPPED].includes(h.state as AllureStatus))

        if (isSkipped) {
            this._attachLogs()
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
            this._attachLogs()
            this._endTest({
                stage: AllureStage.FINISHED,
                status,
                statusDetails: error ? { message: error.message, trace: error.stack } : undefined,
                stop: AllureReporter.getTimeOrNow(suite.end),
            })
            return
        }

        this._attachLogs()
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

    private _inCucumberStepMode(exec: TestStats | HookStats | SuiteStats): boolean {
        const kind = getType(exec)
        const keyword = getKeyword(exec)
        const parentType = getParentType(exec)
        const file = (exec as unknown as MaybeFile).file
        const title = getTitle(exec)
        const hasCucumberKeyword = hasCucumberKeywordInTitle(title)
        const isFeatureFile = isFeatureFilePath(file)

        if (kind === 'hook' || kind === 'feature' || kind === 'scenario') { return false }
        if (kind === 'step') { return true }
        if (keyword) { return true }
        if (parentType === 'scenario') { return true }
        if (isFeatureFile) { return true }
        if (hasCucumberKeyword) { return true }
        return false
    }

    onTestStart(test: TestStats | HookStats): void {
        this._consoleOutput = ''

        const fullTitle = (test as TestStats).fullTitle
        const file = (test as MaybeFile).file
        applyTestPlanLabel(this._testPlan, (m) => this._pushRuntimeMessage(m), { file, fullTitle })

        if (this._inCucumberStepMode(test)) {
            this._handleCucumberStepStart(test as TestStats)
            return
        }

        const cid = this._currentCid()
        this._ensureSuitesStarted(cid)
        const start = AllureReporter.getTimeOrNow((test as TestStats).start)
        const uuid = (test as MaybeUid).uid
        const ft = (test as TestStats).fullTitle || this._mochaFullTitle(cid, test.title)
        this._startTest({ name: test.title, start, uuid })
        if (ft) {this._emitHistoryIdsFrom(ft)}
        if (fullTitle) {this._emitHistoryIdsFrom(fullTitle)}

        const fname = toFullName(this._pkgByCid.get(cid)!, fullTitle || test.title)
        this._pushRuntimeMessage({ type: 'allure:test:info', data: { fullName: fname } })

        const suitePath = [...this._suiteStack(cid)]
        const pkg = isFeatureFilePath(this._pkgByCid.get(cid)) ? toPackageLabelCucumber(this._pkgByCid.get(cid) || '') : toPackageLabel(this._pkgByCid.get(cid) || '')
        const labels = [
            ...getSuiteLabels(suitePath),
            ...(pkg ? [{ name: LabelName.PACKAGE, value: pkg }] : []),
            { name: LabelName.LANGUAGE, value: 'javascript' },
            { name: LabelName.FRAMEWORK, value: 'wdio' },
            { name: LabelName.THREAD, value: cid },
            ...getEnvironmentLabels(),
        ]
        this._pushRuntimeMessage({ type: 'metadata', data: { labels } })
    }

    onTestPass(test: TestStats | HookStats): void {
        if (this._inCucumberStepMode(test)) {
            this._handleCucumberStepEnd(test, AllureStatusEnum.PASSED)
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
        if (this._inCucumberStepMode(test)) {
            this._handleCucumberStepEnd(test, getTestStatus(test, this._config), getStatusDetailsFromFailedTest(test))
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
        if (this._inCucumberStepMode(test)) {
            const st = getTestStatus(test as TestStats, this._config)
            this._handleCucumberStepEnd(test, st, getStatusDetailsFromFailedTest(test as TestStats))
            return
        }
        if (!this._hasPendingTest) {
            const t = test as TestStats
            if (!t.fullTitle) {t.fullTitle = this._mochaFullTitle(this._currentCid(), t.title)}
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

    onTestPending(test: TestStats): void {
        if (this._inCucumberStepMode(test)) {
            this._handleCucumberStepEnd(test, AllureStatusEnum.SKIPPED)
            return
        }
    }

    onTestSkip(test: TestStats): void {
        if (this._inCucumberStepMode(test)) {
            this._handleCucumberStepEnd(test, AllureStatusEnum.SKIPPED)
            return
        }

        if (this._hasPendingTest) {
            this._attachLogs()
            this._skipTest()
            return
        }
        const start = AllureReporter.getTimeOrNow(test.start)
        this._startTest({ name: test.title, start })
        if (test.fullTitle) {this._emitHistoryIdsFrom(test.fullTitle)}
        const fname = toFullName(this._pkgByCid.get(this._currentCid())!, test.fullTitle || test.title)
        this._pushRuntimeMessage({ type: 'allure:test:info', data: { fullName: fname } })
        this._attachLogs()
        this._skipTest()
    }

    onBeforeCommand(command: BeforeCommandArgs): void {
        const cid = this._currentCid()
        const allow = (this._hasPendingTest || this._hasPendingHook) && !this._tpSkipActive(cid)
        if (!allow) {return}

        const { disableWebdriverStepsReporting } = this._options
        if (disableWebdriverStepsReporting || this._isMultiremote) {return}

        const { method, endpoint } = command
        const named = typeof command.command === 'string' && command.command.length > 0
        const httpNamed = method && endpoint
        const stepName = named ? String(command.command) : (httpNamed ? `${method} ${endpoint}` : 'unknown command')
        const body = (command as unknown as MaybeBody).body

        this._startStep({ name: stepName, start: Date.now() })
        if (body !== undefined && !(isObject(body) && isEmptyObject(body))) {
            this._attachJSON({ name: 'Request', json: body })
        }
    }

    onAfterCommand(command: AfterCommandArgs): void {
        const { disableWebdriverStepsReporting, disableWebdriverScreenshotsReporting } = this._options
        const allow = this._hasPendingTest || this._hasPendingHook
        const resUnknown: unknown = (command as unknown as MaybeResult).result
        const resObj = isObject(resUnknown) ? (resUnknown as Record<string, unknown>) : undefined
        const errVal = resObj?.error

        const isShot = isScreenshotCommand(command)
        if (!disableWebdriverScreenshotsReporting && isShot && allow) {
            const res: unknown = (command as unknown as MaybeResult).result
            const val =
                isObject(res) && 'value' in (res as Record<string, unknown>)
                    ? (res as Record<string, unknown>)['value']
                    : res
            if (typeof val === 'string') {
                this._attachScreenshot({ name: 'Screenshot', content: Buffer.from(val, 'base64') })
            }
        }

        if (disableWebdriverStepsReporting || this._isMultiremote || !allow) {return}

        if (disableWebdriverStepsReporting || this._isMultiremote || !allow) {return}

        const commandResult = resObj && 'value' in resObj ? resObj['value'] : resUnknown

        if (!isShot && errVal instanceof Error) {
            this._attachFile({
                name: 'Response',
                content: Buffer.from(String(errVal), 'utf8'),
                contentType: AllureContentType.TEXT
            })
        } else if (!isShot) {
            const hasData = commandResult !== undefined && commandResult !== null && !(isObject(commandResult) && isEmptyObject(commandResult))
            if (hasData) {this._attachJSON({ name: 'Response', json: commandResult })}
        }

        this._endStep({ status: AllureStatusEnum.PASSED, stop: Date.now() })
    }

    onHookStart(hook: HookStats): void {
        const cid = this._currentCid()
        if (this._tpSkipActive(cid)) {return}
        const { disableMochaHooks } = this._options
        if (disableMochaHooks) {return}

        if (!hook.parent && !this._isGlobalHook(hook)) {return}

        const isCucumber = this._isCucumberHook(hook)
        if (isCucumber && !this._hasPendingTest) {return}

        const hookType = this._deriveHookType(hook)
        const start = AllureReporter.getTimeOrNow(hook.start)
        this._startHook({ name: hook.title ?? 'Hook', type: hookType, start })
    }

    onHookEnd(hook: HookStats): void {
        const { disableMochaHooks } = this._options
        if (!hook.parent && !this._isGlobalHook(hook)) {return}
        if (disableMochaHooks && !hook.error) {return}

        const isCucumber = this._isCucumberHook(hook)
        if (isCucumber && !this._hasPendingTest && !hook.error) {return}

        const hookType = this._deriveHookType(hook)

        if (hook.error && !this._hasPendingTest && !this._hasPendingHook) {

            const start = AllureReporter.getTimeOrNow(hook.start)
            this._startTest({ name: hook.title || 'Hook failure', start })
            this._startHook({ name: hook.title || 'Hook', type: hookType, start })
            this._endHook({
                status: AllureStatusEnum.BROKEN,
                statusDetails: getMessageAndTraceFromError(hook.error),
                stop: AllureReporter.getTimeOrNow(hook.end),
                duration: hook.duration
            })
            this._endTest({
                status: AllureStatusEnum.BROKEN,
                stage: AllureStage.FINISHED,
                duration: hook.duration,
                stop: AllureReporter.getTimeOrNow(hook.end)
            })
            return
        }

        if (hook.error && this._hasPendingTest && !this._hasPendingHook) {
            const start = AllureReporter.getTimeOrNow(hook.start)
            this._startHook({ name: hook.title ?? 'Hook', type: hookType, start })
        }

        if (hook.error && !this._hasPendingTest && this._hasPendingHook) {
            const start = AllureReporter.getTimeOrNow(hook.start)
            this._startTest({ name: hook.title || 'Hook failure', start })
        }

        this._endHook({
            status: hook.error ? AllureStatusEnum.BROKEN : AllureStatusEnum.PASSED,
            statusDetails: hook.error && getMessageAndTraceFromError(hook.error),
            stop: AllureReporter.getTimeOrNow(hook.end),
            duration: hook.duration,
        })

        if (hook.error && !this._hasPendingTest && this._hasPendingHook) {
            this._endTest({
                status: AllureStatusEnum.BROKEN,
                stage: AllureStage.FINISHED,
                duration: hook.duration,
                stop: AllureReporter.getTimeOrNow(hook.end)
            })
        }
    }

    private get _hasPendingSuite(): boolean {
        const current = this.allureStatesByCid.get(this._currentCid())
        return Boolean(current?.hasPendingSuite)
    }
    private get _hasPendingTest(): boolean {
        const current = this.allureStatesByCid.get(this._currentCid())
        return Boolean(current?.hasPendingTest)
    }
    private get _hasPendingHook(): boolean {
        const current = this.allureStatesByCid.get(this._currentCid())
        return Boolean(current?.hasPendingHook)
    }

    private _tpActive(): boolean {
        return Boolean(this._testPlan)
    }

    private _ensureSuitesStarted(cid: string): void {
        if (!this._tpActive()) {return}
        const stack = this._suiteStack(cid)
        const started = this._suiteStartedDepthByCid.get(cid) ?? 0
        for (let i = started; i < stack.length; i++) {
            this._startSuite({ name: stack[i] })
        }
        this._suiteStartedDepthByCid.set(cid, stack.length)
    }

    private _emitBaseLabels(cid: string): void {
        const suitePath = [...this._suiteStack(cid)]
        const labels = [
            ...getSuiteLabels(suitePath),
            { name: LabelName.LANGUAGE, value: 'javascript' },
            { name: LabelName.FRAMEWORK, value: 'wdio' },
            { name: LabelName.THREAD, value: cid },
            ...getEnvironmentLabels(),
        ]
        this._pushRuntimeMessage({ type: 'metadata', data: { labels } })
    }

    private _isCucumberSuiteLike(s?: Pick<SuiteStats, 'type'> | null): boolean {
        const t = s?.type
        return t === 'feature' || t === 'scenario'
    }

    private _isCucumberHook(h: HookStats): boolean {
        return this._isCucumberSuiteLike(h.parent as unknown as SuiteStats | undefined)
    }

    private _tpSkipActive(cid: string): boolean {
        return Boolean(this._tpSkipByCid.get(cid))
    }

    private _decideCucumberSkip(cid: string, scenarioTitle: string): boolean {
        if (!this._testPlan) {return false}
        const filePath = (this._pkgByCid.get(cid) || '').replace(/\\/g, '/')
        if (!filePath) {return false}
        const fullTitle = this._mochaFullTitle(cid, scenarioTitle)
        const fullNameDot = (() => {
            const parts = fullTitle.split(' ')
            if (parts.length < 2) { return fullTitle }
            const last = parts.pop()!
            const suite = parts.join(' ')
            return suite ? `${suite}.${last}` : last
        })()
        return !includedInTestPlanCommons(this._testPlan.raw, { fullName: `${filePath}#${fullNameDot}` }) &&
               !includedInTestPlanCommons(this._testPlan.raw, { fullName: `${filePath}#${fullTitle}` }) &&
               !includedInTestPlanCommons(this._testPlan.raw, { fullName: fullNameDot }) &&
               !includedInTestPlanCommons(this._testPlan.raw, { fullName: fullTitle })
    }

    private _mochaFullTitle(cid: string, leaf: string): string {
        const parts = [...this._suiteStack(cid)]
        if (leaf) {parts.push(leaf)}
        return parts.map((s) => String(s).trim()).filter(Boolean).join(' ')
    }

    private _deriveHookType(hook: HookStats): 'before' | 'after' {
        const title = hook.title ?? ''
        if (/before\s+each/i.test(title) || (/before/i.test(title))) {return 'before'}
        if (/after\s+each/i.test(title) || (/after/i.test(title))) {return 'after'}
        return this._hasPendingTest && !this._hasPendingHook ? 'before' : 'after'
    }

    private _isGlobalHook(hook: HookStats): boolean {
        const title = hook.title ?? ''
        return !hook.parent ||
               /^(before|after)\s+each/i.test(title) ||
               /global/i.test(title) ||
               title.includes('global')
    }

    private _formatLink(tpl: string, id: string): string {
        return tpl.includes('%s') ? tpl.replace('%s', id) : tpl.replace(/\{\}/g, id)
    }

    private _md5(s: string): string {
        return createHash('md5').update(s).digest('hex')
    }

    public addLabel({ name, value }: { name: string; value: string }): void {
        this._pushRuntimeMessage({ type: 'metadata', data: { labels: [{ name, value }] } })
    }
    public addStory({ storyName }: { storyName: string }): void {
        this.addLabel({ name: LabelName.STORY, value: storyName })
    }
    public addFeature({ featureName }: { featureName: string }): void {
        this.addLabel({ name: LabelName.FEATURE, value: featureName })
    }
    public addSeverity({ severity }: { severity: string }): void {
        this.addLabel({ name: LabelName.SEVERITY, value: severity })
    }
    public addEpic({ epicName }: { epicName: string }): void {
        this.addLabel({ name: LabelName.EPIC, value: epicName })
    }
    public addOwner({ owner }: { owner: string }): void {
        this.addLabel({ name: LabelName.OWNER, value: owner })
    }
    public addSuite({ suiteName }: { suiteName: string }): void {
        this.addLabel({ name: LabelName.SUITE, value: suiteName })
    }
    public addParentSuite({ suiteName }: { suiteName: string }): void {
        this.addLabel({ name: LabelName.PARENT_SUITE, value: suiteName })
    }
    public addSubSuite({ suiteName }: { suiteName: string }): void {
        this.addLabel({ name: LabelName.SUB_SUITE, value: suiteName })
    }
    public addTag({ tag }: { tag: string }): void {
        this.addLabel({ name: LabelName.TAG, value: tag })
    }

    public addIssue({ issue }: { issue: string }): void {
        const tpl = this._linkTemplates?.issue?.urlTemplate
        if (tpl) {
            this._pushRuntimeMessage({
                type: 'metadata',
                data: { links: [{ url: this._formatLink(tpl, issue), name: issue, type: 'issue' }] },
            })
        } else {
            this.addLabel({ name: 'issue', value: issue })
        }
    }

    public addTestId({ testId }: { testId: string }): void {
        const tpl = this._linkTemplates?.tms?.urlTemplate
        if (tpl) {
            this._pushRuntimeMessage({
                type: 'metadata',
                data: { links: [{ url: this._formatLink(tpl, testId), name: testId, type: 'tms' }] },
            })
        } else {
            this.addLabel({ name: 'tms', value: testId })
        }
    }

    public addAllureId({ id }: { id: string }): void {
        this.addLabel({ name: LabelName.AS_ID, value: id })
        this._pushRuntimeMessage({ type: 'metadata', data: { testCaseId: undefined } })
    }

    public addDescription(args: { description: string; descriptionType?: number | 'html' | 'markdown' }): void {
        const { description: text, descriptionType } = args
        const isHtml = descriptionType === 1 || String(descriptionType ?? '').toLowerCase() === 'html'
        if (isHtml) {
            descriptionHtml(text)
        } else {
            description(String(text))
        }
    }

    public addAttachment(args: { name: string; content: string | Buffer | object; type?: string }): void {
        const { name, content, type } = args
        const toCt = (t?: string): ContentType => {
            const s = (t || 'text/plain').toLowerCase()
            if (s.includes('json')) {return AllureContentType.JSON}
            if (s.includes('png')) {return AllureContentType.PNG}
            if (s.includes('jpeg') || s.includes('jpg')) {return AllureContentType.JPEG}
            if (s.includes('html')) {return AllureContentType.HTML}
            if (s.includes('csv')) {return AllureContentType.CSV}
            if (s.includes('xml')) {return AllureContentType.XML}
            if (s.includes('svg')) {return AllureContentType.SVG}
            return AllureContentType.TEXT
        }
        const buf =
            content instanceof Buffer
                ? content
                : typeof content === 'string'
                    ? Buffer.from(content, 'utf8')
                    : Buffer.from(JSON.stringify(content), 'utf8')
        this._attachFile({ name, content: buf, contentType: toCt(type) })
    }

    public addArgument({ name, value }: { name: string; value: string }): void {
        this._pushRuntimeMessage({ type: 'metadata', data: { parameters: [{ name, value }] } })
    }

    public startStep(title: string): void {
        this._startStep({ name: title, start: Date.now() })
    }
    public endStep(status: AllureStatus): void {
        this._endStep({ status, stop: Date.now() })
    }

    public addStep(title: string, payload: StepWrapper): void
    public addStep(payload: StepPayload): void
    public addStep(payload: StepWrapper): void
    public addStep(arg1: string | StepPayload | StepWrapper, arg2?: StepWrapper): void {
        const payload: StepPayload =
            typeof arg1 === 'string' ? (arg2 ? arg2.step : {}) :
                'step' in arg1 ? arg1.step :
                    arg1

        const title = typeof arg1 === 'string' ? (payload.title || arg1) : (payload.title || 'step')

        this.startStep(title)

        const att = payload.attachment
        if (att && att.content !== undefined) {
            this.addAttachment({
                name: att.name ?? 'Attachment',
                content: att.content,
                type: att.type ?? 'text/plain',
            })
        }
        this.endStep(payload.status ?? AllureStatusEnum.PASSED)
    }

    static addFeature = AllureApi.addFeature
    static addLink = AllureApi.addLink
    static addEpic = AllureApi.addEpic
    static addOwner = AllureApi.addOwner
    static addTag = AllureApi.addTag
    static addLabel = AllureApi.addLabel
    static addSeverity = AllureApi.addSeverity
    static addIssue = AllureApi.addIssue
    static addSuite = AllureApi.addSuite
    static addSubSuite = AllureApi.addSubSuite
    static addParentSuite = AllureApi.addParentSuite
    static addTestId = AllureApi.addTestId
    static addStory = AllureApi.addStory
    static addDescription = AllureApi.addDescription
    static addAttachment = AllureApi.addAttachment
    static startStep = AllureApi.startStep
    static endStep = AllureApi.endStep
    static addStep = AllureApi.addStep
    static addArgument = AllureApi.addArgument
    static addAllureId = AllureApi.addAllureId
    static step = AllureApi.step
}

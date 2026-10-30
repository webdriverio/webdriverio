import process from 'node:process'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { stringify } from 'csv-stringify/sync'

import type {
    AfterCommandArgs,
    Argument,
    BeforeCommandArgs,
    ContextEnd,
    HookStats,
    RunnerStats,
    SuiteStats,
    TestStats,
} from '@wdio/reporter'
import WDIOReporter, { hookCountsAsFailure, knownFramework } from '@wdio/reporter'
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
import { getEnvironmentLabels, getSuiteLabels, ReporterRuntime, includedInTestPlan, parseTestPlan } from 'allure-js-commons/sdk/reporter'
import { setGlobalTestRuntime } from 'allure-js-commons/sdk/runtime'

import { LinkingFileSystemWriter } from './writer.js'
import { resolveResultsDir } from './worker.js'
import { WdioTestRuntime } from './WdioTestRuntime.js'
import { AllureReportState, isOpen } from './state.js'
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
    normalizeCapabilityName,
} from './utils.js'
import type { AddTestInfoEventArgs, AllureReporterOptions, WDIORuntimeMessage } from './types.js'
import { DEFAULT_CID, events } from './constants.js'

import {
    applyTestPlanLabel,
    installBddTestPlanFilter,
} from './testplan.js'
import type { TestPlanV1 } from 'allure-js-commons/sdk'

import * as AllureApi from './common/api.js'

type LinkTemplates = { issue?: { urlTemplate: string }; tms?: { urlTemplate: string } }

type StepAttachment = { content: string | Buffer; name?: string; type?: string }
type StepPayload = { title?: string; attachment?: StepAttachment; status?: AllureStatus }
type StepWrapper = { step: StepPayload }

type ReportLane = {
    main: WDIORuntimeMessage[]
    // added for the Mocha framework: a framework that sends the after hooks of a parallel test
    // before its test:pass gets them held back here and replayed after the test's own messages
    tail: WDIORuntimeMessage[]
    inTail: boolean
    console: string
    suitePath?: string[]
    // title of the test after its test:end: the lane stays open for the after hooks that follow
    endedTitle?: string
}

const AFTER_HOOK_PATTERN = /^"after\s+(?:each|all)"\s+hook/i
// the Cucumber scenario that runs in a parallel unit
const CUCUMBER_UNIT = Symbol('allure cucumber unit')

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
    if (!isRecord(obj)) { return undefined }
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
    if (!title) { return false }
    return /^(Given|When|Then|And|But)\b/.test(title)
}

function splitTitlePathPart(part?: string): string[] {
    if (!part) { return [] }
    return part
        .replace(/\\/g, '/')
        .split('/')
        .map((p) => p.trim())
        .filter(Boolean)
}

export default class AllureReporter extends WDIOReporter {
    private _allureRuntime: ReporterRuntime
    private _capabilities: Capabilities.ResolvedTestrunnerCapabilities
    private _isMultiRemote?: boolean
    private _config?: Options.Testrunner
    private _options: AllureReporterOptions
    private _consoleOutput = ''
    private _originalStdoutWrite: typeof process.stdout.write
    private _isFlushing = false
    private _flushChain: Promise<void> = Promise.resolve()
    private _pendingFlushes = 0
    private _cid?: string

    private _testPlan: TestPlanV1 | undefined
    private _suiteStartedDepthByCid = new Map<string, number>()
    private _currentLeafTitleByCid = new Map<string, string>()
    private _tpSkipByCid = new Map<string, boolean>()
    private _linkTemplates?: LinkTemplates

    private _suiteStackByCid = new Map<string, string[]>()
    private _suiteStack = (cid: string) =>
        this._suiteStackByCid.get(cid) ?? this._suiteStackByCid.set(cid, []).get(cid)!
    private _pkgByCid: Map<string, string> = new Map()
    private _titlePathFileByCid: Map<string, string> = new Map()

    private _cukeScenarioActiveByCid = new Map<string, boolean>()

    private _laneMode = false
    /** the framework of the run, from its name in any case or its scoped package; `undefined` when not known */
    private _framework?: ReturnType<typeof knownFramework>
    // lane config alone is not enough: Mocha falls back to sequential runs without BiDi, and then no context id resolves
    private _lanesSeen = false
    private _lanes = new Map<string, ReportLane>()
    private _closedLaneKeys = new Set<string>()

    allureStatesByCid: Map<string, AllureReportState> = new Map()

    private static getTimeOrNow(d: unknown): number {
        return d instanceof Date ? d.getTime() : Date.now()
    }

    get isSynchronised(): boolean {
        return !this._isFlushing
    }

    constructor(options: AllureReporterOptions) {
        const { outputDir, resultsDir: _resultsDir, includeVersionInHistoryId: _includeVersionInHistoryId, ...rest } = options

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
            writer: new LinkingFileSystemWriter(resolveResultsDir(options)),
        })

        this._capabilities = {}
        this._options = options

        {
            const envPlan = process.env.ALLURE_TESTPLAN_PATH
            if (envPlan && envPlan !== 'undefined' && envPlan !== 'null') {
                try {
                    this._testPlan = parseTestPlan()
                } catch {
                    this._testPlan = undefined
                }
            }
            if (this._testPlan) { installBddTestPlanFilter(this._testPlan) }
        }

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
                    const lane = self._openLane()
                    if (!lane) {
                        if (!self._lanesSeen) { self._consoleOutput += str }
                    } else if (!lane.inTail && lane.endedTitle === undefined) {
                        lane.console += str
                    }
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

    private _laneKey(): string | undefined {
        // the unit of the event (a Cucumber hook end has no contextId), else the context of the calling code
        const key = this._laneMode ? this.getContextUnit?.()?.contextId ?? this.getContextId?.() : undefined
        if (key && !this._lanesSeen) {
            this._lanesSeen = true
            this._consoleOutput = ''
        }
        return key
    }

    private _lane(): ReportLane | undefined {
        const key = this._laneKey()
        return key ? this._lanes.get(key) : undefined
    }

    private _openLane(key = this._laneKey()): ReportLane | undefined {
        if (!key || this._closedLaneKeys.has(key)) { return undefined }
        let lane = this._lanes.get(key)
        if (!lane) {
            lane = { main: [], tail: [], inTail: false, console: '' }
            this._lanes.set(key, lane)
        }
        return lane
    }

    private _pushRuntimeMessage(message: WDIORuntimeMessage, key = this._laneKey()): void {
        if (!key) {
            this._ensureState(this._currentCid()).pushRuntimeMessage(message)
            return
        }
        const lane = this._openLane(key)
        if (!lane) { return }
        // after test:end the context runs only the after hooks of its test: their messages
        // (also the runtime API of a hook with disableMochaHooks) belong to that test, as in a sequential run
        (lane.inTail ? lane.tail : lane.main).push(message)
    }

    /**
     * In parallel mode every suite:end comes after the last test and its hooks, so a lane
     * that no context:end closed (older framework) closes there, with its after hooks
     */
    private _closeEndedLanes(): void {
        let closed = false
        for (const [key, lane] of [...this._lanes]) {
            if (lane.endedTitle === undefined) { continue }
            this._closeLane(key, lane.endedTitle)
            closed = true
        }
        if (closed) { this._flushIncrementally() }
    }

    /**
     * A parallel test's messages are replayed into the shared state in one piece, wrapped in a
     * suite of their own, so the sequential state never sees two tests interleaved.
     */
    private _closeLane(key: string, name: string): void {
        const lane = this._lanes.get(key)
        this._lanes.delete(key)
        this._closedLaneKeys.add(key)
        if (!lane || (lane.main.length === 0 && lane.tail.length === 0)) { return }
        const state = this._ensureState(this._currentCid())
        const messages: WDIORuntimeMessage[] = [
            { type: 'allure:suite:start', data: { name } },
            ...lane.main,
            ...lane.tail,
            { type: 'allure:suite:end', data: { writeTest: true } },
        ]
        messages.forEach((m) => state.pushRuntimeMessage(m))
    }

    private _leaveTail(): void {
        const lane = this._lane()
        if (lane) { lane.inTail = false }
    }

    private _suitePathOf(test: TestStats | HookStats): string[] | undefined {
        const find = (suite: SuiteStats, titles: string[]): string[] | undefined => {
            if (suite.tests.includes(test as TestStats)) { return titles }
            for (const child of suite.suites) {
                const found = find(child, [...titles, child.title])
                if (found) { return found }
            }
            return undefined
        }
        return find(this.currentSuites[0], [])
    }

    /** the feature of a parallel Cucumber unit: parallel mode starts every feature first */
    private _unitFeature(): SuiteStats | undefined {
        const stats = this._laneKey() ? this.getContextUnit?.()?.stats : undefined
        return stats && this.pathOf(stats).findLast((suite) => suite.type === 'feature')
    }

    /** the spec file of the unit, else the one that started last */
    private _pkg(cid: string): string | undefined {
        const file = this._unitFeature()?.file
        return file && isFeatureFilePath(file) ? absPosix(file) : this._pkgByCid.get(cid)
    }

    /** the state of a Cucumber scenario in a parallel unit; `undefined` in a sequential run */
    private _cukeUnit(): { scenario: boolean, tpSkip: boolean } | undefined {
        return this._framework === 'cucumber' && this.getContextUnit?.()?.contextId
            ? this.unitState?.(CUCUMBER_UNIT, () => ({ scenario: false, tpSkip: false }))
            : undefined
    }

    private _cukeScenarioActive(cid: string): boolean {
        return this._cukeUnit()?.scenario ?? Boolean(this._cukeScenarioActiveByCid.get(cid))
    }

    private _setCukeScenarioActive(cid: string, active: boolean): void {
        const unit = this._cukeUnit()
        if (unit) {
            unit.scenario = active
        } else if (active) {
            this._cukeScenarioActiveByCid.set(cid, true)
        } else {
            this._cukeScenarioActiveByCid.delete(cid)
        }
    }

    private _activeSuitePath(cid: string): string[] {
        const lane = this._lane()
        return lane ? lane.suitePath ?? [] : this._suiteStack(cid)
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
        const lane = this._lane()
        const output = lane ? lane.console : this._consoleOutput
        if (!output) { return }
        this._attachFile({
            name: 'Console Logs',
            content: Buffer.from(`.........Console Logs.........\n\n${output}`, 'utf8'),
            contentType: AllureContentType.TEXT,
        })
        if (lane) {
            lane.console = ''
        } else {
            this._consoleOutput = ''
        }
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
        if (!this._hasPendingTest) { return }

        const start = AllureReporter.getTimeOrNow(t.start)
        this._startStep({ name: t.title, start })

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

    /**
     * Write out everything buffered so far without finalising the run, so results of
     * completed tests reach the results directory while the run is still going. Flushes are
     * chained so they cannot overlap.
     */
    private _flushIncrementally(): void {
        const state = this._ensureState(this._currentCid())

        this._beginFlush()
        this._flushChain = this._flushChain
            .then(() => state.processRuntimeMessage(false))
            // the state's cursor stays on the message that threw, so the runner end pass
            // retries it and rethrows if it still fails
            .catch(() => {})
            .then(() => this._endFlush())
    }

    private _beginFlush(): void {
        this._pendingFlushes++
        this._isFlushing = true
    }

    private _endFlush(): void {
        this._pendingFlushes--
        if (this._pendingFlushes === 0) {
            this._isFlushing = false
        }
    }

    private _startTest(payload: { name: string; start: number; uuid?: string; standalone?: boolean }): void {
        this._pushRuntimeMessage({ type: 'allure:test:start', data: payload })
        this._setTestParameters()
        /**
         * flush once the new test:start is buffered: a test is only written when the
         * following test starts, because its own scope has to stay open past its test:end
         * for "after each" hooks to attach to
         */
        if (!this._lanesSeen) { this._flushIncrementally() }
    }

    private _endTest(payload: {
        status: AllureStatus
        start?: number
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

    private _startHook(payload: { name: string; type: 'before' | 'after'; start: number; scope?: 'root' | 'all' | 'each' }): void {
        const { scope, ...data } = payload
        this._pushRuntimeMessage({ type: 'allure:hook:start', data: scope ? payload : data })
    }
    private _endHook(payload: { status: AllureStatus; statusDetails?: StatusDetails; stop?: number; duration?: number }): void {
        const { status, statusDetails, stop = Date.now(), duration } = payload
        this._pushRuntimeMessage({ type: 'allure:hook:end', data: { status, statusDetails, stop, duration } })
    }

    /**
     * Stable key from current capabilities for historyId.
     * Uses the browser/device family by default so history survives version bumps.
     * Must NOT include cid. Used to make historyId unique per environment.
     */
    private _getCapabilityKey(): string {
        // hash input only, never shown; changing it resets Allure history for multi-remote tests
        if (this._isMultiRemote) { return 'multiremote' }
        const capsUnknown: unknown = this._capabilities
        const desired: Record<string, unknown> | undefined = ((): Record<string, unknown> | undefined => {
            const maybe = (capsUnknown as Record<string, unknown>)?.['desired']
            return isRecord(maybe) ? maybe : undefined
        })()
        const browserName = getStringField(capsUnknown, 'browserName')
        const device = getStringField(capsUnknown, 'device')
        const deviceName =
            getStringField(desired, 'deviceName') ||
            getStringField(desired, 'appium:deviceName') ||
            getStringField(capsUnknown, 'deviceName') ||
            getStringField(capsUnknown, 'appium:deviceName')
        const targetName = device || browserName || deviceName || ''
        if (!targetName) { return '' }

        if (!this._options.includeVersionInHistoryId) {
            return normalizeCapabilityName(targetName)
        }

        let versionedName = targetName.trim()
        const desiredPlatformVersion = getStringField(desired, 'appium:platformVersion')
        if (desired && deviceName && desiredPlatformVersion) {
            versionedName = `${device || deviceName} ${desiredPlatformVersion}`
        }
        const version =
            getStringField(capsUnknown, 'os_version') ||
            getStringField(capsUnknown, 'osVersion') ||
            getStringField(capsUnknown, 'browserVersion') ||
            getStringField(capsUnknown, 'version') ||
            getStringField(capsUnknown, 'appium:platformVersion') ||
            ''
        return version ? `${versionedName}-${version}`.trim() : versionedName.trim()
    }

    /**
     * Emits historyId (and testCaseId) from full title and capability key (browser/device from test run).
     * Must NOT include cid or file path: cid varies between runs; user asked for no filesystem.
     */
    private _emitHistoryIdsFrom(fullTitleForHash: string): void {
        const capKey = this._getCapabilityKey()
        const input = capKey ? `${fullTitleForHash}#${capKey}` : fullTitleForHash
        const legacy = this._md5(input)
        this._pushRuntimeMessage({ type: 'metadata', data: { historyId: legacy, testCaseId: legacy } })
    }

    private _setTestParameters(): void {
        const cid = getCid()

        if (!this._isMultiRemote) {
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
                data: { parameters: [{ name: 'isMultiRemote', value: 'true' }] },
            })
        }

        const st = this._ensureState(this._currentCid())
        const feat = this._unitFeature()?.title ?? st.currentFeature
        if (feat) {
            this._pushRuntimeMessage({
                type: 'metadata',
                data: { labels: [{ name: LabelName.FEATURE, value: feat }] },
            })
        }
    }

    private _registerListeners(): void {
        setGlobalTestRuntime(new WdioTestRuntime())

        this.onProcess(events.addTestInfo, (payload: AddTestInfoEventArgs) => {
            const { file, testPath, cid = DEFAULT_CID } = payload

            if (file) {
                this._pkgByCid.set(cid, absPosix(file))
                this._titlePathFileByCid.set(cid, file)
            }

            const fileStr = (file || '').replace(/\\/g, '/')
            if (/\.feature$/i.test(fileStr)) {
                const ft = Array.isArray(testPath) ? testPath.map(String).join(' ') : ''
                const fullName = `${relNoSlash(file)}#${ft}`
                const titlePath = this._titlePath(cid, Array.isArray(testPath) ? testPath.slice(0, -1) : undefined)

                this._pushRuntimeMessage({ type: 'allure:test:info', data: { fullName, fullTitle: ft, titlePath } })
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

        const onStartStep = (name: string) => {
            if (this._tpSkipActive(this._currentCid())) { return }
            this._pushRuntimeMessage({ type: 'step_start', data: { name, start: Date.now() } })
        }
        const onEndStep = (arg: AllureStatus | { status: AllureStatus; statusDetails?: StatusDetails }) => {
            if (this._tpSkipActive(this._currentCid())) { return }
            const payload = typeof arg === 'string' ? { status: arg } : arg
            this._pushRuntimeMessage({ type: 'step_stop', data: { ...payload, stop: Date.now() } })
        }
        const onRuntimeMessage = (payload: RuntimeMessage) => {
            if (this._tpSkipActive(this._currentCid())) { return }
            this._pushRuntimeMessage(payload as WDIORuntimeMessage)
        }
        this.onProcess(events.startStep, onStartStep)
        this.onProcess(events.endStep, onEndStep)
        this.onProcess(events.runtimeMessage, onRuntimeMessage)
        this.on(events.startStep, onStartStep)
        this.on(events.endStep, onEndStep)
        this.on(events.runtimeMessage, onRuntimeMessage)
    }

    onRunnerStart(runner: RunnerStats): void {
        this._cid = runner.cid
        this._ensureState(runner.cid)
        this._config = runner.config
        this._framework = knownFramework(runner.config?.framework)
        this._capabilities = runner.capabilities
        this._isMultiRemote = runner.isMultiRemote || false
        const { mochaOpts, cucumberOpts } = (runner.config ?? {}) as { mochaOpts?: { parallelMode?: boolean }, cucumberOpts?: { parallelMode?: boolean } }
        this._laneMode = this._framework === 'vitest' ||
            (this._framework === 'mocha' && Boolean(mochaOpts?.parallelMode)) ||
            (this._framework === 'cucumber' && Boolean(cucumberOpts?.parallelMode))
        this._lanesSeen = false

        const specs = (runner as unknown as { specs?: string[] }).specs || []
        if (specs.length) {
            this._pkgByCid.set(runner.cid, absPosix(specs[0]))
            this._titlePathFileByCid.set(runner.cid, specs[0])
        }
    }

    async onRunnerEnd(_runner: RunnerStats): Promise<void> {
        for (const key of [...this._lanes.keys()]) {
            this._closeLane(key, key)
        }
        /**
         * counted like any other flush, so an incremental flush finishing while we await it
         * cannot report the reporter as synchronised while this pass is still writing
         */
        this._beginFlush()
        try {
            await this._flushChain
            for (const [cid, state] of this.allureStatesByCid) {
                await state.processRuntimeMessage()
                this.allureStatesByCid.delete(cid)
            }
        } finally {
            if (this._options.addConsoleLogs) {
                process.stdout.write = this._originalStdoutWrite
            }
            this._endFlush()
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
            const featureFile = (suite as unknown as MaybeFile).file
            if (isFeatureFilePath(featureFile)) {
                this._pkgByCid.set(cid, absPosix(featureFile!))
                this._titlePathFileByCid.set(cid, featureFile!)
            }
            break
        }
        case 'scenario': {
            this._setCukeScenarioActive(cid, true)
            // a parallel scenario keeps the path of its own feature
            const lane = this._openLane()
            if (lane) { lane.suitePath = this.pathOf(suite).map((parent) => parent.title) }

            this._ensureSuitesStarted(cid)

            const mustSkip = this._decideCucumberSkip(cid, suite.title)
            const start = AllureReporter.getTimeOrNow(suite.start)
            const uuid = (suite as MaybeUid).uid

            this._consoleOutput = ''
            this._startTest({ name: suite.title, start, uuid })

            this._currentLeafTitleByCid.set(cid, suite.title)
            const fullTitleForHash = this._mochaFullTitle(cid, suite.title)
            this._emitHistoryIdsFrom(fullTitleForHash)

            const fullName = toFullName(this._pkg(cid)!, fullTitleForHash)
            this._pushRuntimeMessage({
                type: 'allure:test:info',
                data: { fullName, fullTitle: fullTitleForHash, titlePath: this._titlePath(cid, this._activeSuitePath(cid)) }
            })

            applyTestPlanLabel(this._testPlan, (m) => this._pushRuntimeMessage(m), {
                fullTitle: fullTitleForHash,
                file: this._pkg(cid),
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
                this._setTpSkip(cid, true)
                this._pushRuntimeMessage({
                    type: 'attachment_content',
                    data: {
                        name: 'allure-skip',
                        content: Buffer.from('allure-skip').toString('base64'),
                        contentType: 'application/vnd.allure.skipcucumber+json',
                        encoding: 'base64'
                    }
                })
                this._pushRuntimeMessage({ type: 'metadata', data: { labels: [{ name: 'ALLURE_TESTPLAN_SKIP', value: 'true' }] } })
                this._attachLogs()
                this._endTest({ status: AllureStatusEnum.SKIPPED, stage: AllureStage.PENDING, stop: Date.now() })
                return
            }
            break
        }
        default: {
            this._suiteStack(cid).push(suite.title)
            const suiteFile = (suite as unknown as MaybeFile).file
            if (suiteFile) {
                this._titlePathFileByCid.set(cid, suiteFile)
            }
            this._startSuite({ name: suite.title })
        }
        }
    }

    onSuiteEnd(suite: SuiteStats & { end: Date }): void {
        // a Cucumber scenario ends while other scenarios run: their lanes close at their context:end
        if (this._framework !== 'cucumber') { this._closeEndedLanes() }
        const isScenario = suite.type === 'scenario'
        const cid = this._currentCid()

        if (isScenario && this._tpSkipActive(cid)) {
            this._setTpSkip(cid, false)
            this._setCukeScenarioActive(cid, false)
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

        this._setCukeScenarioActive(cid, false)

        suite.hooks = suite.hooks!.map((h: HookStats) => {
            h.state = h.state || AllureStatusEnum.PASSED
            return h
        })

        const suiteChildren = [...suite.tests!, ...suite.hooks]
        const isSkipped =
            suite.tests.every((t: TestStats) => [AllureStatusEnum.SKIPPED].includes(t.state as AllureStatus)) &&
            suite.hooks.every((h: HookStats) => [AllureStatusEnum.PASSED, AllureStatusEnum.SKIPPED].includes(h.state as AllureStatus))

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

    onSuiteRetry(suite: SuiteStats): void {
        const cid = this._currentCid()

        // Mark the first attempt as a retried result so Allure displays it under the "Retries" tab
        this._pushRuntimeMessage({
            type: 'metadata',
            data: { labels: [{ name: LabelName.TAG, value: 'retried' }] },
        })

        // Determine the status of the first (failed) attempt from its accumulated step/hook stats
        suite.hooks = (suite.hooks || []).map((h: HookStats) => {
            h.state = h.state || AllureStatusEnum.PASSED
            return h
        })
        const suiteChildren = [...(suite.tests || []), ...(suite.hooks || [])]
        const isSkipped =
            suiteChildren.length > 0 &&
            (suite.tests || []).every((t: TestStats) => [AllureStatusEnum.SKIPPED].includes(t.state as AllureStatus)) &&
            (suite.hooks || []).every((h: HookStats) => [AllureStatusEnum.PASSED, AllureStatusEnum.SKIPPED].includes(h.state as AllureStatus))
        const failed = suiteChildren.find((i) => i.state === AllureStatusEnum.FAILED)
        const status = isSkipped
            ? AllureStatusEnum.SKIPPED
            : failed ? getTestStatus(failed) : AllureStatusEnum.FAILED
        const error = failed ? getErrorFromFailedTest(failed) : undefined

        // Close attempt #1 as a proper (failed/skipped) result
        this._attachLogs()
        this._endTest({
            stage: isSkipped ? AllureStage.PENDING : AllureStage.FINISHED,
            status,
            statusDetails: error ? { message: error.message, trace: error.stack } : undefined,
            stop: Date.now(),
        })

        // Open a fresh Allure test for the retry attempt.
        // Sharing the same historyId is intentional: Allure uses it to group
        // separate result files as retry attempts of the same scenario.
        this._consoleOutput = ''
        this._startTest({ name: suite.title, start: Date.now() })
        this._currentLeafTitleByCid.set(cid, suite.title)
        const fullTitleForHash = this._mochaFullTitle(cid, suite.title)
        this._emitHistoryIdsFrom(fullTitleForHash)

        const fullName = toFullName(this._pkg(cid)!, fullTitleForHash)
        this._pushRuntimeMessage({
            type: 'allure:test:info',
            data: { fullName, fullTitle: fullTitleForHash, titlePath: this._titlePath(cid) }
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
    }

    private _inCucumberStepMode(exec: TestStats | HookStats | SuiteStats): boolean {
        const kind = getType(exec)
        if (kind === 'hook' || kind === 'feature' || kind === 'scenario') { return false }
        // a TestStats keeps no Cucumber type or keyword: the runner config decides for a known
        // framework; another one (a custom framework or adapter) keeps the rules below
        if (this._framework) {
            const cucumberOpts = (this._config as { cucumberOpts?: { scenarioLevelReporter?: boolean } }).cucumberOpts
            return this._framework === 'cucumber' && !cucumberOpts?.scenarioLevelReporter
        }
        if (kind === 'step') { return true }
        if (getKeyword(exec)) { return true }
        if (getParentType(exec) === 'scenario') { return true }
        if (isFeatureFilePath((exec as unknown as MaybeFile).file)) { return true }
        return hasCucumberKeywordInTitle(getTitle(exec))
    }

    onTestStart(test: TestStats | HookStats): void {
        const lane = this._openLane()
        if (lane) {
            lane.console = ''
            // a new test in the context (an attempt, a Cucumber step): the lane is no longer after its test
            lane.endedTitle = undefined
            lane.inTail = false
            // a Cucumber step keeps the path of its scenario
            if (!this._inCucumberStepMode(test)) { lane.suitePath = this._suitePathOf(test) }
        } else {
            this._consoleOutput = ''
        }

        const fullTitle = (test as TestStats).fullTitle
        const file = (test as MaybeFile).file
        const cid = this._currentCid()
        if (file) {
            this._titlePathFileByCid.set(cid, file)
        }
        applyTestPlanLabel(this._testPlan, (m) => this._pushRuntimeMessage(m), { file, fullTitle })

        if (this._inCucumberStepMode(test)) {
            this._handleCucumberStepStart(test as TestStats)
            return
        }

        this._laneKey()
        if (!this._lanesSeen) { this._ensureSuitesStarted(cid) }
        const start = AllureReporter.getTimeOrNow((test as TestStats).start)
        const uuid = (test as MaybeUid).uid
        const ft = (test as TestStats).fullTitle || this._mochaFullTitle(cid, test.title)
        this._startTest({ name: test.title, start, uuid })
        const testCaseTitle = ft || fullTitle
        if (testCaseTitle) { this._emitHistoryIdsFrom(testCaseTitle) }

        const fullName = toFullName(this._pkg(cid)!, fullTitle || test.title)
        this._pushRuntimeMessage({
            type: 'allure:test:info',
            data: { fullName: fullName, titlePath: this._titlePath(cid) }
        })

        const suitePath = [...this._activeSuitePath(cid)]
        const specFile = this._pkg(cid)
        const pkg = isFeatureFilePath(specFile) ? toPackageLabelCucumber(specFile || '') : toPackageLabel(specFile || '')
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
        this._leaveTail()
        if (this._inCucumberStepMode(test)) {
            this._handleCucumberStepEnd(test, AllureStatusEnum.PASSED)
            return
        }
        this._attachLogs()
        const end = AllureReporter.getTimeOrNow((test as TestStats).end)
        this._endTest({
            status: AllureStatusEnum.PASSED,
            stage: AllureStage.FINISHED,
            start: AllureReporter.getTimeOrNow((test as TestStats).start),
            stop: end,
            duration: (test as TestStats).duration,
        })
    }

    onTestRetry(test: TestStats): void {
        this._leaveTail()
        if (this._inCucumberStepMode(test)) {
            this._handleCucumberStepEnd(test, getTestStatus(test, this._config), getStatusDetailsFromFailedTest(test))
            return
        }
        // a retried Cucumber scenario attempt keeps its tag, as in onSuiteRetry (its TestStats type is 'test')
        if (this._framework === 'cucumber') {
            this._pushRuntimeMessage({
                type: 'metadata',
                data: { labels: [{ name: LabelName.TAG, value: 'retried' }] },
            })
        }
        this._attachLogs()
        const status = getTestStatus(test, this._config)
        this._endTest({
            status,
            stage: AllureStage.FINISHED,
            statusDetails: getStatusDetailsFromFailedTest(test),
            start: AllureReporter.getTimeOrNow(test.start),
            stop: AllureReporter.getTimeOrNow(test.end),
            duration: test.duration,
        })
    }

    onTestFail(test: TestStats | HookStats): void {
        this._leaveTail()
        if (this._inCucumberStepMode(test)) {
            const st = getTestStatus(test as TestStats, this._config)
            this._handleCucumberStepEnd(test, st, getStatusDetailsFromFailedTest(test as TestStats))
            return
        }
        if (!this._hasPendingTest) {
            const t = test as TestStats
            if (!t.fullTitle) { t.fullTitle = this._mochaFullTitle(this._currentCid(), t.title) }
            this.onTestStart(test)
        }
        this._attachLogs()
        const status = getTestStatus(test as TestStats, this._config)
        this._endTest({
            status,
            stage: AllureStage.FINISHED,
            statusDetails: getStatusDetailsFromFailedTest(test as TestStats),
            start: AllureReporter.getTimeOrNow((test as TestStats).start),
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
        this._leaveTail()
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
        if (test.fullTitle) { this._emitHistoryIdsFrom(test.fullTitle) }
        const cid = this._currentCid()
        if (test.file) { this._titlePathFileByCid.set(cid, test.file) }
        const lane = this._lane()
        if (lane) { lane.suitePath = this._suitePathOf(test) }
        const fullName = toFullName(this._pkg(cid)!, test.fullTitle || test.title)
        this._pushRuntimeMessage({ type: 'allure:test:info', data: { fullName, titlePath: this._titlePath(cid) } })
        this._attachLogs()
        this._skipTest()
    }

    onBeforeCommand(command: BeforeCommandArgs): void {
        const cid = this._currentCid()
        const allow = (this._hasPendingTest || this._hasPendingHook) && !this._tpSkipActive(cid)
        if (!allow) { return }

        const { disableWebdriverStepsReporting } = this._options
        if (disableWebdriverStepsReporting || this._isMultiRemote) { return }

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
        const allow = (this._hasPendingTest || this._hasPendingHook) && !this._tpSkipActive(this._currentCid())
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

        if (disableWebdriverStepsReporting || this._isMultiRemote || !allow) { return }

        const commandResult = resObj && 'value' in resObj ? resObj['value'] : resUnknown

        if (!isShot && errVal instanceof Error) {
            this._attachFile({
                name: 'Response',
                content: Buffer.from(String(errVal), 'utf8'),
                contentType: AllureContentType.TEXT
            })
        } else if (!isShot) {
            const hasData = commandResult !== undefined && commandResult !== null && !(isObject(commandResult) && isEmptyObject(commandResult))
            if (hasData) { this._attachJSON({ name: 'Response', json: commandResult }) }
        }

        this._endStep({ status: AllureStatusEnum.PASSED, stop: Date.now() })
    }

    onTestEnd(test: TestStats): void {
        const key = this._laneKey()
        if (!key) { return }
        const lane = this._openLane(key)
        if (lane) { lane.endedTitle = test.title }
    }

    // the context runs no more hooks: write its test now, while other tests still run
    onContextEnd(payload: ContextEnd): void {
        const lane = this._lanes.get(payload.contextId)
        if (!lane) { return }
        this._closeLane(payload.contextId, lane.endedTitle ?? payload.contextId)
        this._flushIncrementally()
    }

    onHookStart(hook: HookStats): void {
        const cid = this._currentCid()
        const lane = this._lane()
        if (lane && !lane.inTail && this._isAfterHook(hook) && !this._cukeScenarioActive(cid) && isOpen(lane.main, 'allure:test:start', 'allure:test:end')) {
            lane.inTail = true
        }
        if (this._tpSkipActive(cid)) { return }
        const { disableMochaHooks } = this._options
        if (disableMochaHooks) { return }

        const isCucumber = this._isCucumberHook(hook)
        const hookType = this._hookType(hook)

        if (isCucumber && hookType === 'before' && this._decideCucumberSkipForHook(hook)) {
            this._setTpSkip(cid, true)
            return
        }

        if (isCucumber) { return }
        if (this._cukeScenarioActive(cid)) { return }
        const start = AllureReporter.getTimeOrNow(hook.start)
        this._startHook({ name: hook.title ?? 'Hook', type: hookType, start, scope: this._hookScope(hook) })
    }

    onHookEnd(hook: HookStats): void {
        const cid = this._currentCid()
        if (this._tpSkipActive(cid)) { return }
        const { disableMochaHooks } = this._options
        if (disableMochaHooks && !hook.error) { return }
        const hadPendingTest = this._hasPendingTest
        const hadPendingHook = this._hasPendingHook

        // its error is on its test (the `test:retry` of the attempt, or `failedTestUid`), which ended before this hook
        // (Vitest afterEach): the hook stays a fixture of that test, with no extra result for it
        if (hook.error && !hookCountsAsFailure(hook) && !hadPendingTest) {
            if (hadPendingHook) {
                this._endHook({
                    status: AllureStatusEnum.BROKEN,
                    statusDetails: getMessageAndTraceFromError(hook.error),
                    stop: AllureReporter.getTimeOrNow(hook.end),
                    duration: hook.duration,
                })
            }
            return
        }

        const isCucumber = this._isCucumberHook(hook)

        if (this._cukeScenarioActive(cid) && !isCucumber) { return }

        if (isCucumber && !hook.error) { return }

        if (isCucumber && !this._hasPendingTest && !hook.error) { return }

        if (isCucumber && this._tpActive() && !this._hasPendingTest && hook.error) {
            if (this._tpSkipActive(cid) || this._decideCucumberSkipForHook(hook)) { return }
        }

        const hookType = this._hookType(hook)
        const scope = this._hookScope(hook)

        if (hook.error && !hadPendingTest && !hadPendingHook) {

            const start = AllureReporter.getTimeOrNow(hook.start)
            this._startTest({ name: hook.title || 'Hook failure', start })
            this._emitHistoryIdsFrom(this._hookFullTitle(hook))
            // the hook of its own result is a fixture of that result only
            this._startHook({ name: hook.title || 'Hook', type: hookType, start, scope: scope === 'root' ? 'all' : scope })
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
                statusDetails: getMessageAndTraceFromError(hook.error),
                stop: AllureReporter.getTimeOrNow(hook.end)
            })
            return
        }

        if (hook.error && hadPendingTest && !hadPendingHook) {
            const start = AllureReporter.getTimeOrNow(hook.start)
            this._startHook({ name: hook.title ?? 'Hook', type: hookType, start, scope })
        }

        // a failed afterEach of a test that ended: its fixture and the next afterEach hooks stay on that test
        if (hook.error && !hadPendingTest && hadPendingHook && hook.hookKind === 'afterEach') {
            const stop = AllureReporter.getTimeOrNow(hook.end)
            this._endHook({ status: AllureStatusEnum.BROKEN, statusDetails: getMessageAndTraceFromError(hook.error), stop, duration: hook.duration })
            this._startTest({ name: hook.title || 'Hook failure', start: AllureReporter.getTimeOrNow(hook.start), standalone: true })
            this._emitHistoryIdsFrom(this._hookFullTitle(hook))
            this._endTest({ status: AllureStatusEnum.BROKEN, statusDetails: getMessageAndTraceFromError(hook.error), stage: AllureStage.FINISHED, duration: hook.duration, stop })
            return
        }

        if (hook.error && !hadPendingTest && hadPendingHook) {
            const start = AllureReporter.getTimeOrNow(hook.start)
            this._startTest({ name: hook.title || 'Hook failure', start })
        }

        this._endHook({
            status: hook.error ? AllureStatusEnum.BROKEN : AllureStatusEnum.PASSED,
            statusDetails: hook.error && getMessageAndTraceFromError(hook.error),
            stop: AllureReporter.getTimeOrNow(hook.end),
            duration: hook.duration,
        })

        if (hook.error && !hadPendingTest && hadPendingHook) {
            /**
             * the hook fixture has just been closed above, so the metadata lands on the
             * synthetic hook-failure test instead of on the still-open fixture
             */
            this._emitHistoryIdsFrom(this._hookFullTitle(hook))
            this._endTest({
                status: AllureStatusEnum.BROKEN,
                stage: AllureStage.FINISHED,
                duration: hook.duration,
                statusDetails: getMessageAndTraceFromError(hook.error),
                stop: AllureReporter.getTimeOrNow(hook.end)
            })
        }
    }

    private get _hasPendingTest(): boolean {
        if (this._laneKey()) { return this._isOpenInLane('allure:test:start', 'allure:test:end') }
        const current = this.allureStatesByCid.get(this._currentCid())
        return Boolean(current?.hasPendingTest)
    }

    private get _hasPendingHook(): boolean {
        if (this._laneKey()) { return this._isOpenInLane('allure:hook:start', 'allure:hook:end') }
        const current = this.allureStatesByCid.get(this._currentCid())
        return Boolean(current?.hasPendingHook)
    }

    private _isOpenInLane(startType: WDIORuntimeMessage['type'], endType: WDIORuntimeMessage['type']): boolean {
        const lane = this._lane()
        return Boolean(lane) && isOpen(lane!.inTail ? lane!.tail : lane!.main, startType, endType)
    }

    private _tpActive(): boolean {
        return Boolean(this._testPlan)
    }

    private _ensureSuitesStarted(cid: string): void {
        if (!this._tpActive()) { return }
        const stack = this._suiteStack(cid)
        const started = this._suiteStartedDepthByCid.get(cid) ?? 0
        for (let i = started; i < stack.length; i++) {
            this._startSuite({ name: stack[i] })
        }
        this._suiteStartedDepthByCid.set(cid, stack.length)
    }

    private _emitBaseLabels(cid: string): void {
        const suitePath = [...this._activeSuitePath(cid)]
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

    private _decideCucumberSkipForHook(hook: HookStats): boolean {
        if (!this._tpActive()) { return false }
        const parent = hook.parent as unknown as { title?: string } | undefined
        const scenarioTitle = parent?.title ? String(parent.title) : undefined
        if (!scenarioTitle) { return false }
        return this._decideCucumberSkip(this._currentCid(), scenarioTitle)
    }

    // a parallel scenario keeps its own test plan skip; the cid map is the sequential fallback
    private _tpSkipActive(cid: string): boolean {
        return this._cukeUnit()?.tpSkip ?? Boolean(this._tpSkipByCid.get(cid))
    }

    private _setTpSkip(cid: string, skip: boolean): void {
        const unit = this._cukeUnit()
        if (unit) {
            unit.tpSkip = skip
        } else if (skip) {
            this._tpSkipByCid.set(cid, true)
        } else {
            this._tpSkipByCid.delete(cid)
        }
    }

    private _decideCucumberSkip(cid: string, scenarioTitle: string): boolean {
        if (!this._testPlan) { return false }
        const filePath = (this._pkg(cid) || '').replace(/\\/g, '/')
        if (!filePath) { return false }
        const fullTitle = this._mochaFullTitle(cid, scenarioTitle)
        const fullNameDot = (() => {
            const parts = fullTitle.split(' ')
            if (parts.length < 2) { return fullTitle }
            const last = parts.pop()!
            const suite = parts.join(' ')
            return suite ? `${suite}.${last}` : last
        })()
        const abs = filePath
        const relNo = relNoSlash(abs)
        const rel = relNo ? `/${relNo}` : ''
        const base = path.basename(abs)
        const fileVariants = [abs, rel, relNo, base].filter(Boolean) as string[]

        const nameVariants = [fullNameDot, fullTitle]
        const candidates: string[] = []
        for (const n of nameVariants) {
            candidates.push(n)
            for (const f of fileVariants) {
                candidates.push(`${f}#${n}`)
            }
        }
        for (const c of candidates) {
            if (includedInTestPlan(this._testPlan, { fullName: c })) { return false }
        }
        return true
    }

    private _mochaFullTitle(cid: string, leaf: string): string {
        const parts = [...this._activeSuitePath(cid)]
        if (leaf) { parts.push(leaf) }
        return parts.map((s) => String(s).trim()).filter(Boolean).join(' ')
    }

    /**
     * Full title for a synthetic hook-failure result. A hook can fire before any
     * test sets the lane's suite path (parallel mode), so `_activeSuitePath`
     * contributes nothing there and hooks with the same title in different
     * suites would share one history id. `pathOf` reads the base reporter's suite
     * tree, which links every hook to its declaring suite, so the id no longer
     * depends on which lane happened to be open.
     *
     * A root all-hook has no owning suite, so its path stays empty and the id is
     * the same in sequential and parallel mode. A failed each-hook is reported
     * once per test with the same title in parallel mode, so the test title joins
     * the hash; otherwise Allure would read those failures as retries of one
     * result.
     */
    private _hookFullTitle(hook: HookStats): string {
        /**
         * `pathOf` only answers for a hook the base reporter registered from its
         * own `hook:start`. A hook fed straight into `onHookEnd` has no tree
         * entry, so fall back to the open suite stack, which is what the id used
         * before. The distinction matters for a root all-hook: its path is
         * legitimately empty, and an empty path is what keeps its id identical in
         * sequential and parallel mode.
         */
        const registered = Boolean(hook.uid && this.hooks[hook.uid] === hook)
        const suitePath = registered
            ? this.pathOf(hook).map((suite) => String(suite.title).trim()).filter(Boolean)
            : this._activeSuitePath(this._currentCid()).map((title) => String(title).trim()).filter(Boolean)
        const parts = [...suitePath]
        if (hook.title) { parts.push(hook.title) }
        /**
         * An each-hook belongs to one test. In parallel mode the same afterEach
         * fails for every test with the same title, so without the test title the
         * ids collide and Allure reads the failures as retries of one result.
         * `hookKind` is absent on older engines, and an all-hook never has a
         * `currentTest`, so its presence is enough.
         */
        const isAllHook = hook.hookKind === 'beforeAll' || hook.hookKind === 'afterAll'
        if (!isAllHook && hook.currentTest) { parts.push(String(hook.currentTest).trim()) }
        return parts.map((s) => String(s).trim()).filter(Boolean).join(' ')
    }

    private _titlePath(cid: string, cucumberPath?: string[]): string[] {
        const file = this._unitFeature()?.file ?? this._titlePathFileByCid.get(cid) ?? this._pkgByCid.get(cid)
        const relativeFilePath = relNoSlash(file)
        const fileParts = splitTitlePathPart(relativeFilePath)
        const suitePath = this._activeSuitePath(cid).map(String).map((s) => s.trim()).filter(Boolean)
        const normalizedCucumberPath = cucumberPath?.map(String).map((s) => s.trim()).filter(Boolean)

        if (isFeatureFilePath(file)) {
            return [
                ...fileParts.slice(0, -1),
                ...(normalizedCucumberPath && normalizedCucumberPath.length > 0 ? normalizedCucumberPath : suitePath.slice(0, 1)),
            ].filter(Boolean)
        }

        return [...fileParts, ...suitePath]
    }

    // the hook kind of the framework; with no kind, the hook title
    private _hookType(hook: HookStats): 'before' | 'after' {
        const kind = hook.hookKind
        if (kind) { return kind.startsWith('before') ? 'before' : 'after' }
        return this._deriveHookType(hook)
    }

    private _isAfterHook(hook: HookStats): boolean {
        return hook.hookKind ? hook.hookKind === 'afterEach' || hook.hookKind === 'afterAll' : AFTER_HOOK_PATTERN.test(hook.title ?? '')
    }

    // an all-hook of the root suite is a fixture of every test of the run
    private _hookScope(hook: HookStats): 'root' | 'all' | 'each' | undefined {
        const kind = hook.hookKind
        if (!kind) { return undefined }
        if (kind !== 'beforeAll' && kind !== 'afterAll') { return 'each' }
        return !hook.contextId && !hook.hookSuiteUid && !this.parentOf?.(hook) ? 'root' : 'all'
    }

    private _deriveHookType(hook: HookStats): 'before' | 'after' {
        const title = hook.title ?? ''
        if (/before\s+each/i.test(title) || (/before/i.test(title))) { return 'before' }
        if (/after\s+each/i.test(title) || (/after/i.test(title))) { return 'after' }
        return this._hasPendingTest && !this._hasPendingHook ? 'before' : 'after'
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
            if (s.includes('json')) { return AllureContentType.JSON }
            if (s.includes('png')) { return AllureContentType.PNG }
            if (s.includes('jpeg') || s.includes('jpg')) { return AllureContentType.JPEG }
            if (s.includes('html')) { return AllureContentType.HTML }
            if (s.includes('csv')) { return AllureContentType.CSV }
            if (s.includes('xml')) { return AllureContentType.XML }
            if (s.includes('svg')) { return AllureContentType.SVG }
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

    public addArgument({ name, value, mode, excluded }: {
        name: string;
        value: string;
        mode?: 'masked' | 'hidden' | 'default'
        excluded?: boolean
    }): void {
        this._pushRuntimeMessage({ type: 'metadata', data: { parameters: [{ name, value, mode, excluded }] } })
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

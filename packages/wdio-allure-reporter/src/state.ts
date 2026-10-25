import type { ReporterRuntime } from 'allure-js-commons/sdk/reporter'
import type { RuntimeMessage } from 'allure-js-commons/sdk'
import type {
    WDIOHookEndMessage,
    WDIOHookStartMessage,
    WDIORuntimeMessage,
    WDIOSuiteStartMessage,
    WDIOTestEndMessage,
    WDIOTestInfoMessage,
    WDIOTestStartMessage,
} from './types.js'
import { findLast, findLastIndex, last } from './utils.js'
import type { Status as AllureStatus } from 'allure-js-commons'
import { Stage as AllureStage } from 'allure-js-commons'

// Mocha formats a hook's title as the literal quoted hook-type phrase (optionally
// followed by ": fnName"), then a ` for "<test title>"` suffix (each-hooks, which run
// in a specific test's context) or ` in "<suite title>"` suffix (all-hooks) naming the
// context the hook ran in - see mocha's runner.js `setHookTitle`. Matching /all/i or
// /each/i anywhere in the title would false-positive on a test/suite name that happens
// to contain "all" or "each" (e.g. a test titled "should handle all cases", or a suite
// named "All users"), misclassifying an ordinary before/after-each hook as suite-scoped
// or vice versa. Anchoring to the start of the string ensures only the actual hook-type
// phrase is matched, never the name that follows it.
const ALL_HOOK_PATTERN = /^"(?:before|after)\s+all"/i
const EACH_HOOK_PATTERN = /^"(?:before|after)\s+each"/i
const AFTER_ALL_HOOK_PATTERN = /^"after\s+all"/i

// the hook kind of the framework decides the scope; with no kind, the hook title
const isAllHook = ({ name, scope }: WDIOHookStartMessage['data']) => scope ? scope !== 'each' : ALL_HOOK_PATTERN.test(name)
const isEachHook = ({ name, scope }: WDIOHookStartMessage['data']) => scope ? scope === 'each' : EACH_HOOK_PATTERN.test(name)

export function isOpen(messages: WDIORuntimeMessage[], startType: WDIORuntimeMessage['type'], endType: WDIORuntimeMessage['type']): boolean {
    return findLastIndex(messages, ({ type }) => type === startType) > findLastIndex(messages, ({ type }) => type === endType)
}

export class AllureReportState {
    private _scopesStack: string[] = []
    private _scopeKindsStack: Array<'suite' | 'test'> = []
    private _testScopePendingClose: boolean = false
    private _executablesStack: string[] = []
    private _fixturesStack: string[] = []
    private _currentTestUuid?: string
    private _currentTestName?: string
    messages: WDIORuntimeMessage[] = []
    private _processedIndex = 0
    private _pendingHookMessages: WDIORuntimeMessage[] = []
    private _isCapturingPendingHook: boolean = false
    // the scope of the all-hooks of the root suite: every test of the run is a child of it
    private _rootScopeUuid?: string
    private _testUuids: string[] = []
    private _standaloneUuid?: string
    private _rootFixtures = new Set<string>()
    // the fixture that was open when the current test started
    private _testStartFixture?: string

    constructor(private allureRuntime: ReporterRuntime) {
    }

    private _isRuntimeMessage(message: WDIORuntimeMessage): message is RuntimeMessage {
        const wdioSpecificTypes = [
            'allure:suite:start',
            'allure:suite:end',
            'allure:test:start',
            'allure:test:end',
            'allure:test:info',
            'allure:hook:start',
            'allure:hook:end'
        ]
        return !wdioSpecificTypes.includes(message.type)
    }

    private _openSteps = 0

    private _openHookSteps = new Map<string, number>()
    private _hookMeta = new Map<string, { name: string; type: 'before' | 'after' }>()

    private _incHookSteps = (uuid: string) =>
        this._openHookSteps.set(uuid, (this._openHookSteps.get(uuid) ?? 0) + 1)

    private _decHookSteps = (uuid: string) =>
        this._openHookSteps.set(uuid, Math.max(0, (this._openHookSteps.get(uuid) ?? 0) - 1))

    private async _closeOpenedHookSteps(uuid: string, status: AllureStatus, stop?: number, statusDetails?: {
        message?: string;
        trace?: string
    }): Promise<void> {
        let n = this._openHookSteps.get(uuid) ?? 0
        while (n > 0) {
            this.allureRuntime.applyRuntimeMessages(uuid, [{
                type: 'step_stop',
                data: { status, stop: stop ?? Date.now(), statusDetails }
            }])
            n--
        }
        this._openHookSteps.set(uuid, 0)
    }

    private async _closeOpenedSteps(status: AllureStatus, stop?: number, statusDetails?: {
        message?: string;
        trace?: string
    }): Promise<void> {
        if (!this._currentTestUuid) {
            return
        }
        while (this._openSteps > 0) {
            this.allureRuntime.applyRuntimeMessages(this._currentTestUuid, [{
                type: 'step_stop',
                data: { status, stop: stop ?? Date.now(), statusDetails }
            }])
            this._openSteps--
        }
    }

    get hasPendingTest(): boolean {
        return isOpen(this.messages, 'allure:test:start', 'allure:test:end')
    }

    get hasPendingHook(): boolean {
        return isOpen(this.messages, 'allure:hook:start', 'allure:hook:end')
    }

    get currentFeature(): string | undefined {
        const m = findLast(
            this.messages,
            ({ type, data }) => type === 'allure:suite:start' && Boolean((data as WDIOSuiteStartMessage['data']).feature),
        ) as WDIOSuiteStartMessage | undefined
        return m?.data?.name
    }

    private async _openScope(kind: 'suite' | 'test'): Promise<void> {
        const scopeUuid = this.allureRuntime.startScope()
        this._scopesStack.push(scopeUuid)
        this._scopeKindsStack.push(kind)
    }

    private async _closeScope(): Promise<void> {
        const scopeUuid = this._scopesStack.pop()
        this._scopeKindsStack.pop()
        if (scopeUuid) {
            await this.allureRuntime.writeScope(scopeUuid)
        }
    }

    private async _writeLastTest(): Promise<void> {
        if (!this._currentTestUuid) {
            return
        }
        await this.allureRuntime.writeTest(this._currentTestUuid)
        this._currentTestUuid = undefined
    }

    // A test's own scope stays open past its test:end - Mocha fires a test's "after each"
    // hook(s) only after that test's pass/fail/test:end events, so the scope needs to still
    // be there for such a hook to attach to (see _endTest). Once marked pending-close, that
    // scope is orphaned and must be closed before a new suite/test scope is opened, or before
    // a suite-level "after all" hook can reach the suite scope underneath it.
    private async _closeDanglingTestScope(): Promise<void> {
        if (this._testScopePendingClose) {
            await this._closeScope()
            this._testScopePendingClose = false
        }
    }

    private async _startSuite(): Promise<void> {
        if (this._currentTestUuid) {
            await this._writeLastTest()
        }
        await this._closeDanglingTestScope()
        await this._openScope('suite')
    }

    private async _endSuite(write: boolean = false): Promise<void> {
        await this._closeDanglingTestScope()
        await this._closeScope()
        if (write) {
            await this._writeLastTest()
        }
    }

    private async _startTest(message: WDIOTestStartMessage): Promise<void> {
        if (message.data.standalone) {
            // the test that ended keeps its open scope for its next after each hooks
            const scopes = this._testScopePendingClose ? this._scopesStack.slice(0, -1) : this._scopesStack
            const uuid = this.allureRuntime.startTest({ name: message.data.name, start: message.data.start }, [...this._rootScopes(), ...scopes])
            this._testUuids.push(uuid)
            this._executablesStack.push(uuid)
            this._standaloneUuid = uuid
            return
        }
        if (this._currentTestUuid) {
            await this._writeLastTest()
        }
        await this._closeDanglingTestScope()
        await this._openScope('test')

        const { name, start } = message.data
        const testUuid = this.allureRuntime.startTest(
            {
                name,
                start,
            },
            [...this._rootScopes(), ...this._scopesStack],
        )

        this._testUuids.push(testUuid)
        this._executablesStack.push(testUuid)
        this._currentTestUuid = testUuid
        this._currentTestName = name
        this._testStartFixture = this._fixturesStack.at(-1)
        this._openSteps = 0

        if (this._pendingHookMessages.length > 0 && !this.currentFeature) {
            await this._attachPendingHookToCurrentTest('before', name, '')
            await this._attachPendingHookToCurrentTest('before', name, 'each')
        }
    }

    private _addTestInfo(message: WDIOTestInfoMessage): void {
        const { fullName, titlePath } = message.data
        const testUuid = last(this._executablesStack)
        if (!testUuid) {
            return
        }
        this.allureRuntime.updateTest(testUuid, (r) => {
            r.fullName = fullName
            if (Array.isArray(titlePath) && titlePath.length > 0) {
                r.titlePath = titlePath
            }
        })
    }

    private async _endTest(message: WDIOTestEndMessage): Promise<void> {
        const { status, stage, start, stop, duration, statusDetails } = message.data
        const testUuid = this._executablesStack.pop()

        if (!testUuid) {
            return
        }
        const standalone = testUuid === this._standaloneUuid
        if (standalone) {
            this._standaloneUuid = undefined
        } else {
            await this._closeOpenedSteps(status, stop, statusDetails)
        }
        // The test's own scope is intentionally left open here - see _closeDanglingTestScope.
        if (!standalone) {
            this._testScopePendingClose = true
        }

        this.allureRuntime.updateTest(testUuid, r => {
            r.status = status
            if (start !== undefined) {
                r.start = start
            }
            if (stage) {
                r.stage = stage
            }
            if (statusDetails) {
                r.statusDetails = statusDetails
            }
        })
        this.allureRuntime.stopTest(testUuid, { stop, duration })
        if (standalone) {
            await this.allureRuntime.writeTest(testUuid)
        }
    }

    private _rootScopes(): string[] {
        return this._rootScopeUuid ? [this._rootScopeUuid] : []
    }

    // opened at the first root all-hook, with the tests that ran before it
    private _rootScope(): string {
        if (!this._rootScopeUuid) {
            const uuid = this.allureRuntime.startScope()
            this.allureRuntime.updateScope(uuid, (scope) => { scope.tests.push(...this._testUuids) })
            this._rootScopeUuid = uuid
        }
        return this._rootScopeUuid
    }

    // The suite scope is shared by every test started under it, so it must only ever hold a
    // genuinely suite-scoped hook ("before all"/"after all") - attaching anything else there
    // would leak that hook's fixture onto every other test in the suite. A test scope, by
    // contrast, is never shared across multiple real tests, so there's no such leakage risk in
    // being permissive there: it accepts any hook - including a suite-scoped one with no suite
    // scope currently available, e.g. a root-level hook outside any describe() being replayed
    // from _pendingHookMessages (see _attachPendingHookToCurrentTest and the "root-level" test)
    // - as long as that test hasn't been fully finalized yet (_currentTestUuid is only cleared
    // by _writeLastTest). This covers an ordinary running test and a test that just ended and
    // is merely pending close (see _closeDanglingTestScope), which is exactly when a trailing
    // "after each" hook needs to attach. Anything else (no scope open at all) has nowhere safe
    // to attach to yet and is queued as a pending hook to be replayed later.
    private _hasAttachableScope(hook: WDIOHookStartMessage['data']): boolean {
        const kind = this._scopeKindsStack[this._scopeKindsStack.length - 1]
        if (kind === 'suite') {
            return isAllHook(hook)
        }
        if (kind === 'test') {
            return Boolean(this._currentTestUuid)
        }
        return false
    }

    private async _startHook(message: WDIOHookStartMessage): Promise<void> {
        const { name, type, start, scope } = message.data

        const allHook = isAllHook(message.data)
        const afterAll = scope ? allHook && type === 'after' : AFTER_ALL_HOOK_PATTERN.test(name)

        if (afterAll && this._currentTestUuid) {
            await this._writeLastTest()
        }
        // Only an "all"-scoped hook needs the suite scope exposed - closing the dangling
        // test scope here for an "each"-scoped hook would destroy the very scope it needs
        // to attach to (see _closeDanglingTestScope).
        if (allHook) {
            await this._closeDanglingTestScope()
        }

        const testScopeUuid = scope === 'root' ? this._rootScope() : this._scopesStack[this._scopesStack.length - 1]
        if (!testScopeUuid || (scope !== 'root' && !this._hasAttachableScope(message.data))) {
            this._pendingHookMessages.push(message)
            this._isCapturingPendingHook = true
            return
        }

        const hookUuid = this.allureRuntime.startFixture(testScopeUuid, type, { name, start })
        if (hookUuid) {
            if (scope === 'root') {
                this._rootFixtures.add(hookUuid)
            }
            this._fixturesStack.push(hookUuid)
            this._openHookSteps.set(hookUuid, 0)
            this._hookMeta.set(hookUuid, { name, type })
        }
    }

    private async _endHook(message: WDIOHookEndMessage): Promise<void> {
        const { status, statusDetails, duration, stop } = message.data

        // Mirrors _startHook: if there's no matching open fixture, the corresponding
        // hook:start must have been queued as pending (no scope was open yet), so queue
        // this end message alongside it rather than assuming a current test exists.
        if (this._fixturesStack.length === 0) {
            this._pendingHookMessages.push(message)
            this._isCapturingPendingHook = false
            return
        }

        const hookUuid = this._fixturesStack.pop()
        if (!hookUuid) {
            return
        }

        await this._closeOpenedHookSteps(hookUuid, status, stop, statusDetails)

        this.allureRuntime.updateFixture(hookUuid, r => {
            r.status = status
            if (statusDetails) {
                r.statusDetails = statusDetails
            }
        })

        this.allureRuntime.stopFixture(hookUuid, { stop, duration })

        const meta = this._hookMeta.get(hookUuid)
        const testUuid = this._currentTestUuid
        if (meta && testUuid) {
            this.allureRuntime.updateTest(testUuid, (r) => {
                const result = r as unknown as { fixtures?: Array<{ name: string; type: 'before' | 'after'; status: AllureStatus; stage: typeof AllureStage.FINISHED }> }
                const fixtures = Array.isArray(result.fixtures) ? result.fixtures : []
                fixtures.push({ name: meta.name, type: meta.type, status, stage: AllureStage.FINISHED })
                result.fixtures = fixtures
            })
        }
    }

    pushRuntimeMessage(message: WDIORuntimeMessage): void {
        this.messages.push(message)
    }

    /**
     * Consume every message that has not been consumed yet.
     *
     * Pass `final: false` to flush mid-run: messages are applied and completed tests are
     * written out, but the run is not finalised, so the reporter can keep going. The
     * cursor makes this safe to call repeatedly - a message is never applied twice, and a
     * pass that throws leaves the cursor on the message that threw so the next pass
     * retries it rather than replaying the whole batch.
     */
    async processRuntimeMessage(final: boolean = true): Promise<void> {
        for (let i = this._processedIndex; i < this.messages.length; i++) {
            const message = this.messages[i]
            const lastMessage = final && i === this.messages.length - 1
            this._processedIndex = i

            switch (message.type) {
            case 'allure:suite:start':
                await this._startSuite()
                continue

            case 'allure:suite:end':
                await this._endSuite(lastMessage || Boolean(message.data?.writeTest))
                continue

            case 'allure:test:start':
                await this._startTest(message)
                continue

            case 'allure:test:info':
                this._addTestInfo(message)
                continue

            case 'allure:test:end': {
                const standalone = this._standaloneUuid !== undefined && last(this._executablesStack) === this._standaloneUuid
                await this._endTest(message)
                if (!standalone && this._pendingHookMessages.length > 0 && !this.currentFeature) {
                    await this._attachPendingHookToCurrentTest('after', this._currentTestName ?? 'unknown test', 'each')
                    await this._attachPendingHookToCurrentTest('after', this._currentTestName ?? 'unknown test', '')
                }
                continue
            }

            case 'allure:hook:start':
                await this._startHook(message)
                continue

            case 'allure:hook:end':
                if (this._fixturesStack.length === 0 && this._currentTestUuid && this._pendingHookMessages.length > 0 && !this.currentFeature) {
                    this._pendingHookMessages.push(message)
                    this._isCapturingPendingHook = false
                    const testName = this._currentTestName ?? 'unknown test'
                    await this._attachPendingHookToCurrentTest('before', testName, '')
                    await this._attachPendingHookToCurrentTest('before', testName, 'each')
                    await this._attachPendingHookToCurrentTest('after', testName, 'each')
                    await this._attachPendingHookToCurrentTest('after', testName, '')
                    continue
                }
                await this._endHook(message)
                continue

            default:
                break
            }

            if (
                message.type === 'global_error' ||
                message.type === 'global_attachment_content' ||
                message.type === 'global_attachment_path'
            ) {
                this.allureRuntime.applyRuntimeMessages('', [message])
                continue
            }

            const openFixture = this._fixturesStack.at(-1)
            // a result started in an open root fixture (its failed hook) keeps its metadata: the root scope holds every test (U1)
            const hookUuid = openFixture && this._rootFixtures.has(openFixture) && this._testStartFixture === openFixture ? undefined : openFixture
            const target = hookUuid ?? this._standaloneUuid ?? this._currentTestUuid

            if (!target) {
                if (this._isCapturingPendingHook) {
                    this._pendingHookMessages.push(message)
                }
                continue
            }

            if (message.type === 'step_start') {
                if (hookUuid) {
                    this._incHookSteps(hookUuid)
                } else if (!this._standaloneUuid) {
                    this._openSteps++
                }
            }

            if (message.type === 'step_stop') {
                if (hookUuid) {
                    this._decHookSteps(hookUuid)
                } else if (!this._standaloneUuid) {
                    this._openSteps = Math.max(0, this._openSteps - 1)
                }
            }

            if (this._isRuntimeMessage(message)) {
                this.allureRuntime.applyRuntimeMessages(target, [message])
            }
        }

        this._processedIndex = this.messages.length

        if (!final) {
            return
        }

        if (this._currentTestUuid) {
            await this._writeLastTest()
        }
        while (this._scopesStack.length > 0) {
            await this._closeScope()
        }
        if (this._rootScopeUuid) {
            await this.allureRuntime.writeScope(this._rootScopeUuid)
            this._rootScopeUuid = undefined
        }
    }

    private async _attachPendingHookToCurrentTest(kind: 'before' | 'after', testName: string, scope: 'each' | '' = 'each'): Promise<void> {
        if (!this._currentTestUuid) {
            return
        }
        const startIdx = this._pendingHookMessages.findIndex((m) =>
            m.type === 'allure:hook:start' && m.data.type === kind && typeof m.data.name === 'string' && (scope === 'each' ? isEachHook(m.data) : isAllHook(m.data))
        )
        if (startIdx === -1) {
            return
        }

        const endIdx = this._pendingHookMessages.findIndex((m, idx) => idx > startIdx && m.type === 'allure:hook:end')
        if (endIdx === -1) {
            return
        }

        const startMsg = this._pendingHookMessages[startIdx] as WDIOHookStartMessage

        await this._startHook({
            type: 'allure:hook:start',
            data: {
                name: String(startMsg.data.name || ''),
                type: kind,
                start: startMsg.data.start,
                ...(startMsg.data.scope && { scope: startMsg.data.scope }),
            }
        })

        const currentHookUuid = this._fixturesStack.at(-1)

        if (currentHookUuid) {
            for (let i = startIdx + 1; i < endIdx; i++) {
                const msg = this._pendingHookMessages[i]
                if (msg.type === 'step_start') {
                    this._incHookSteps(currentHookUuid)
                }
                if (msg.type === 'step_stop') {
                    this._decHookSteps(currentHookUuid)
                }
                if (this._isRuntimeMessage(msg)) {
                    this.allureRuntime.applyRuntimeMessages(currentHookUuid, [msg])
                }
            }
        }

        const endMsg = this._pendingHookMessages[endIdx] as WDIOHookEndMessage
        await this._endHook(endMsg)
        this._pendingHookMessages.splice(startIdx, (endIdx - startIdx) + 1)
    }
}

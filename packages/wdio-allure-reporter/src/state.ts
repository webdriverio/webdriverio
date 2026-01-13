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

export class AllureReportState {
    private _scopesStack: string[] = []
    private _executablesStack: string[] = []
    private _fixturesStack: string[] = []
    private _currentTestUuid?: string
    private _currentTestName?: string
    messages: WDIORuntimeMessage[] = []
    private _pendingHookMessages: WDIORuntimeMessage[] = []
    private _isCapturingPendingHook: boolean = false

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

    get hasPendingSuite(): boolean {
        const s = findLastIndex(this.messages, ({ type }) => type === 'allure:suite:start')
        const e = findLastIndex(this.messages, ({ type }) => type === 'allure:suite:end')
        return s > e
    }

    get hasPendingTest(): boolean {
        const s = findLastIndex(this.messages, ({ type }) => type === 'allure:test:start')
        const e = findLastIndex(this.messages, ({ type }) => type === 'allure:test:end')
        return s > e
    }

    get hasPendingStep(): boolean {
        const s = findLastIndex(this.messages, ({ type }) => type === 'step_start')
        const e = findLastIndex(this.messages, ({ type }) => type === 'step_stop')
        return s > e
    }

    get hasPendingHook(): boolean {
        const s = findLastIndex(this.messages, ({ type }) => type === 'allure:hook:start')
        const e = findLastIndex(this.messages, ({ type }) => type === 'allure:hook:end')
        return s > e
    }

    get currentFeature(): string | undefined {
        const m = findLast(
            this.messages,
            ({ type, data }) => type === 'allure:suite:start' && Boolean((data as WDIOSuiteStartMessage['data']).feature),
        ) as WDIOSuiteStartMessage | undefined
        return m?.data?.name
    }

    private async _openScope(): Promise<void> {
        const scopeUuid = this.allureRuntime.startScope()
        this._scopesStack.push(scopeUuid)
    }

    private async _closeScope(): Promise<void> {
        const scopeUuid = this._scopesStack.pop()
        if (scopeUuid) {
            await this.allureRuntime.writeScope(scopeUuid)
        }
    }

    private async _writeLastTest(): Promise<void> {
        if (!this._currentTestUuid) {
            return
        }
        // await this._closeScope()
        await this.allureRuntime.writeTest(this._currentTestUuid)
        this._currentTestUuid = undefined
    }

    private async _startSuite(): Promise<void> {
        if (this._currentTestUuid) {
            await this._writeLastTest()
        }
        await this._openScope()
    }

    private async _endSuite(write: boolean = false): Promise<void> {
        await this._closeScope()
        if (write) {
            await this._writeLastTest()
        }
    }

    private async _startTest(message: WDIOTestStartMessage): Promise<void> {
        if (this._currentTestUuid) {
            await this._writeLastTest()
        }
        await this._openScope()

        const { name, start } = message.data
        const testUuid = this.allureRuntime.startTest(
            {
                name,
                start,
            },
            [...this._scopesStack],
        )

        this._executablesStack.push(testUuid)
        this._currentTestUuid = testUuid
        this._currentTestName = name
        this._openSteps = 0

        if (this._pendingHookMessages.length > 0 && !this.currentFeature) {
            await this._attachPendingHookToCurrentTest('before', name, '')
            await this._attachPendingHookToCurrentTest('before', name, 'each')
        }
    }

    private _addTestInfo(message: WDIOTestInfoMessage): void {
        const { fullName } = message.data
        const testUuid = last(this._executablesStack)
        if (!testUuid) {
            return
        }
        this.allureRuntime.updateTest(testUuid, (r) => {
            r.fullName = fullName
        })
    }

    private async _endTest(message: WDIOTestEndMessage): Promise<void> {
        const { status, stage, stop, duration, statusDetails } = message.data
        const testUuid = this._executablesStack.pop()

        if (!testUuid) {
            return
        }

        await this._closeOpenedSteps(status, stop, statusDetails)
        await this._closeScope()

        this.allureRuntime.updateTest(testUuid, r => {
            r.status = status
            if (stage) {
                r.stage = stage
            }
            if (statusDetails) {
                r.statusDetails = statusDetails
            }
        })
        this.allureRuntime.stopTest(testUuid, { stop, duration })

    }

    private async _startHook(message: WDIOHookStartMessage): Promise<void> {
        const { name, type, start } = message.data

        if (/after all/i.test(name) && this._currentTestUuid) {
            await this._writeLastTest()
        }

        if (!this._currentTestUuid) {
            this._pendingHookMessages.push(message)
            this._isCapturingPendingHook = true
            return
        }

        const testScopeUuid = this._scopesStack[this._scopesStack.length - 1]
        if (testScopeUuid) {
            const hookUuid = this.allureRuntime.startFixture(testScopeUuid, type, { name, start })
            if (hookUuid) {
                this._fixturesStack.push(hookUuid)
                this._openHookSteps.set(hookUuid, 0)
                this._hookMeta.set(hookUuid, { name, type })
            }
        }
    }

    private async _endHook(message: WDIOHookEndMessage): Promise<void> {
        const { status, statusDetails, duration, stop } = message.data

        if (!this._currentTestUuid) {
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

    async processRuntimeMessage(): Promise<void> {
        for (let i = 0; i < this.messages.length; i++) {
            const message = this.messages[i]
            const lastMessage = i === this.messages.length - 1

            switch (message.type) {
            case 'allure:suite:start':
                await this._startSuite()
                continue

            case 'allure:suite:end':
                await this._endSuite(lastMessage)
                continue

            case 'allure:test:start':
                await this._startTest(message)
                continue

            case 'allure:test:info':
                this._addTestInfo(message)
                continue

            case 'allure:test:end':
                await this._endTest(message)
                if (this._pendingHookMessages.length > 0 && !this.currentFeature) {
                    await this._attachPendingHookToCurrentTest('after', this._currentTestName ?? 'unknown test', 'each')
                    await this._attachPendingHookToCurrentTest('after', this._currentTestName ?? 'unknown test', '')
                }
                continue

            case 'allure:hook:start':
                if (!this._currentTestUuid) {
                    this._pendingHookMessages.push(message)
                    this._isCapturingPendingHook = true
                    continue
                }
                await this._startHook(message)
                continue

            case 'allure:hook:end':
                if (!this._currentTestUuid) {
                    this._pendingHookMessages.push(message)
                    this._isCapturingPendingHook = false
                    continue
                }
                await this._endHook(message)
                continue

            default:
                break
            }

            const hookUuid = this._fixturesStack.at(-1)
            const target = hookUuid ?? this._currentTestUuid

            if (!target) {
                if (this._isCapturingPendingHook) {
                    this._pendingHookMessages.push(message)
                }
                continue
            }

            if (message.type === 'step_start') {
                if (hookUuid) {
                    this._incHookSteps(hookUuid)
                } else {
                    this._openSteps++
                }
            }

            if (message.type === 'step_stop') {
                if (hookUuid) {
                    this._decHookSteps(hookUuid)
                } else {
                    this._openSteps = Math.max(0, this._openSteps - 1)
                }
            }

            if (this._isRuntimeMessage(message)) {
                this.allureRuntime.applyRuntimeMessages(target, [message])
            }
        }

        if (this._currentTestUuid) {
            await this._writeLastTest()
        }
        while (this._scopesStack.length > 0) {
            await this._closeScope()
        }
    }

    private async _attachPendingHookToCurrentTest(kind: 'before' | 'after', testName: string, scope: 'each' | '' = 'each'): Promise<void> {
        if (!this._currentTestUuid) {
            return
        }
        const startIdx = this._pendingHookMessages.findIndex((m) =>
            m.type === 'allure:hook:start' && m.data.type === kind && typeof m.data.name === 'string' && (scope === 'each' ? /each/i.test(m.data.name) : /all/i.test(m.data.name))
        )
        if (startIdx === -1) {
            return
        }

        const endIdx = this._pendingHookMessages.findIndex((m, idx) => idx > startIdx && m.type === 'allure:hook:end')
        if (endIdx === -1) {
            return
        }

        const startMsg = this._pendingHookMessages[startIdx] as WDIOHookStartMessage
        const endMsg = this._pendingHookMessages[endIdx] as WDIOHookEndMessage

        await this._startHook({
            type: 'allure:hook:start',
            data: {
                name: String(startMsg.data.name || ''),
                type: kind,
                start: startMsg.data.start
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

        await this._endHook(endMsg)

        this._pendingHookMessages.splice(startIdx, (endIdx - startIdx) + 1)
    }
}

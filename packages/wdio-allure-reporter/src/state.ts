import type { ReporterRuntime } from 'allure-js-commons/sdk/reporter'
import type {
    WDIOHookEndMessage,
    WDIOHookStartMessage,
    WDIORuntimeMessage, WDIOSuiteStartMessage,
    WDIOTestEndMessage, WDIOTestInfoMessage,
    WDIOTestStartMessage
} from './types.js'
import { findLast, findLastIndex, last } from './utils.js'

export class AllureReportState {
    _messages: WDIORuntimeMessage[] = []
    _scopesStack: string[] = []
    _executablesStack: string[] = []
    _fixturesStack: string[] = []
    _currentTestUuid?: string

    constructor(private allureRuntime: ReporterRuntime) {
    }

    get hasPendingSuite() {
        const lastSuiteStartMessage = findLastIndex(this._messages, ({ type }) => type === 'allure:suite:start')
        const lastSuiteEndMessage = findLastIndex(this._messages, ({ type }) => type === 'allure:suite:end')

        return lastSuiteStartMessage > lastSuiteEndMessage
    }

    get hasPendingTest() {
        const lastTestStartMessage = findLastIndex(this._messages, ({ type }) => type === 'allure:test:start')
        const lastTestEndMessage = findLastIndex(this._messages, ({ type }) => type === 'allure:test:end')

        return lastTestStartMessage > lastTestEndMessage
    }

    get hasPendingStep() {
        const lastStepStartMessage = findLastIndex(this._messages, ({ type }) => type === 'step_start')
        const lastStepEndMessage = findLastIndex(this._messages, ({ type }) => type === 'step_stop')

        return lastStepStartMessage > lastStepEndMessage
    }

    get hasPendingHook() {
        const lastHookStartMessage = findLastIndex(this._messages, ({ type }) => type === 'allure:hook:start')
        const lastHookEndMessage = findLastIndex(this._messages, ({ type }) => type === 'allure:hook:end')

        return lastHookStartMessage > lastHookEndMessage
    }

    get currentFeature() {
        const featureSuiteMessage = findLast(this._messages, ({ type, data }) => type === 'allure:suite:start' && Boolean(data.feature)) as WDIOSuiteStartMessage | undefined

        return featureSuiteMessage?.data?.name
    }

    _openScope() {
        const scopeUuid = this.allureRuntime.startScope()

        this._scopesStack.push(scopeUuid)
    }

    _closeScope() {
        const scopeUuid = this._scopesStack.pop()!

        this.allureRuntime.writeScope(scopeUuid)
    }

    _writeLastTest() {
        if (!this._currentTestUuid) {
            return
        }

        this._closeScope()
        this.allureRuntime.writeTest(this._currentTestUuid)
        this._currentTestUuid = undefined
    }

    _startSuite() {
        if (this._currentTestUuid) {
            this._writeLastTest()
        }

        this._openScope()
    }

    _endSuite(write: boolean = false) {
        this._closeScope()

        if (!write) {
            return
        }

        this._writeLastTest()
    }

    _startTest(message: WDIOTestStartMessage) {
        if (this._currentTestUuid) {
            this._writeLastTest()
        }

        this._openScope()

        const { name, start } = message.data
        const testUuid = this.allureRuntime.startTest({
            name,
            start
        }, this._scopesStack)

        this._executablesStack.push(testUuid)
        this._currentTestUuid = testUuid
    }

    _addTestInfo(message: WDIOTestInfoMessage) {
        const { fullName } = message.data
        const testUuid = last(this._executablesStack)

        this.allureRuntime.updateTest(testUuid, (r) => {
            r.fullName = fullName
        })
    }

    _endTest(message: WDIOTestEndMessage, write: boolean = false) {
        const { status, stage, stop, duration, statusDetails } = message.data
        const testUuid = this._executablesStack.pop()!

        this.allureRuntime.updateTest(testUuid, (r) => {
            r.status = status

            if (stage) {
                r.stage = stage
            }

            if (statusDetails) {
                r.statusDetails = statusDetails
            }

        })
        this.allureRuntime.stopTest(testUuid, { stop, duration })

        if (!write) {
            return
        }

        this._writeLastTest()
    }

    _startHook(message: WDIOHookStartMessage) {
        const { name, type, start } = message.data

        if (/after all/i.test(name) && this._currentTestUuid) {
            this._writeLastTest()
        }

        const scopeUuid = last(this._scopesStack)
        const hookUuid = this.allureRuntime.startFixture(scopeUuid, type, {
            name,
            start
        })!

        this._fixturesStack.push(hookUuid)
    }

    _endHook(message: WDIOHookEndMessage) {
        const { status, statusDetails, duration, stop } = message.data
        const hookUuid = this._fixturesStack.pop()!

        this.allureRuntime.updateFixture(hookUuid, (r) => {
            r.status = status

            if (statusDetails) {
                r.statusDetails = statusDetails
            }
        })
        this.allureRuntime.stopFixture(hookUuid, { stop, duration })
    }

    pushRuntimeMessage(message: WDIORuntimeMessage) {
        this._messages.push(message)
    }

    processRuntimeMessage() {
        // console.log(this._messages)

        this._messages.forEach((message, i) => {
            const lastMessage = i === this._messages.length - 1

            if (message.type === 'allure:suite:start') {
                this._startSuite()
                return
            }

            if (message.type === 'allure:suite:end') {
                this._endSuite(lastMessage)
                return
            }

            if (message.type === 'allure:test:start') {
                this._startTest(message)
                return
            }

            if (message.type === 'allure:test:info') {
                this._addTestInfo(message)
                return
            }

            if (message.type === 'allure:test:end') {
                this._endTest(message, lastMessage)
                return
            }

            if (message.type === 'allure:hook:start') {
                this._startHook(message)
                return
            }

            if (message.type === 'allure:hook:end') {
                this._endHook(message)
                return
            }

            if (!this._currentTestUuid) {
                return
            }

            this.allureRuntime.applyRuntimeMessages(this._currentTestUuid, [message])
        })
    }
}

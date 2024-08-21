import type { ReporterRuntime } from 'allure-js-commons/sdk/reporter'
import type {
    WDIOHookEndMessage,
    WDIOHookStartMessage,
    WDIORuntimeMessage,
    WDIOTestEndMessage, WDIOTestInfoMessage,
    WDIOTestStartMessage
} from './types.js'
import { last } from './utils.js'

export class AllureReportState {
    _scopesStack: string[] = []
    _executablesStack: string[] = []
    _fixturesStack: string[] = []
    _currentTestUuid?: string

    constructor(private allureRuntime: ReporterRuntime) {
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

    _endSuite() {
        this._closeScope()
    }

    _startTest(message: WDIOTestStartMessage) {
        if (this._currentTestUuid) {
            this._writeLastTest()
        }

        this._openScope()

        const { title, start } = message.data
        const testUuid = this.allureRuntime.startTest({
            name: title,
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

    _endTest(message: WDIOTestEndMessage) {
        const { status, stage, end, error } = message.data
        const testUuid = this._executablesStack.pop()!

        this.allureRuntime.updateTest(testUuid, (r) => {
            r.status = status

            if (stage) {
                r.stage = stage
            }

            if (error) {
                r.statusDetails = {
                    message: error.message,
                    trace: error.stack
                }
            }

        })
        this.allureRuntime.stopTest(testUuid, { stop: end })
    }

    _startHook(message: WDIOHookStartMessage) {
        const { title, type, start } = message.data

        if (/after all/i.test(title) && this._currentTestUuid) {
            this._writeLastTest()
        }

        const scopeUuid = last(this._scopesStack)
        const hookUuid = this.allureRuntime.startFixture(scopeUuid, type, {
            name: title,
            start
        })!

        this._fixturesStack.push(hookUuid)
    }

    _endHook(message: WDIOHookEndMessage) {
        const { status, statusDetails, stop } = message.data
        const hookUuid = this._fixturesStack.pop()!

        this.allureRuntime.updateFixture(hookUuid, (r) => {
            r.status = status

            if (statusDetails) {
                r.statusDetails = statusDetails
            }
        })
        this.allureRuntime.stopFixture(hookUuid, { stop })
    }

    processRuntimeMessage(messages: WDIORuntimeMessage[]) {
        messages.forEach((message) => {
            if (message.type === 'allure:suite:start') {
                this._startSuite()
                return
            }

            if (message.type === 'allure:suite:end') {
                this._endSuite()
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
                this._endTest(message)
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

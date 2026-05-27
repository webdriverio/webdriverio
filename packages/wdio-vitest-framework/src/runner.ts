import url from 'node:url'
import type { VitestRunner, VitestRunnerConfig, File, Suite, Test } from '@vitest/runner'
import type { EventEmitter } from 'node:events'

import { executeHooksWithArgs } from '@wdio/utils'

import type { FrameworkMessage, ErrorInfo } from './types.js'

interface WDIOHooks {
    beforeTest?: Function | Function[]
    afterTest?: Function | Function[]
    beforeHook?: Function | Function[]
    afterHook?: Function | Function[]
}

/**
 * Custom VitestRunner implementation that bridges Vitest lifecycle hooks
 * to WebdriverIO reporter events.
 */
export class WDIOVitestRunner implements VitestRunner {
    config: VitestRunnerConfig
    private _cid: string
    private _specs: string[]
    private _reporter: EventEmitter
    private _hooks: WDIOHooks

    private _level = 0
    private _suiteIds: string[] = ['0']
    private _suiteCnt: Map<string, number> = new Map()
    private _testCnt: Map<string, number> = new Map()
    private _failedCount = 0

    constructor(
        config: VitestRunnerConfig,
        cid: string,
        specs: string[],
        reporter: EventEmitter,
        hooks: WDIOHooks = {}
    ) {
        this.config = config
        this._cid = cid
        this._specs = specs
        this._reporter = reporter
        this._hooks = hooks
    }

    get failedCount(): number {
        return this._failedCount
    }

    async importFile(filepath: string, _source: 'collect' | 'setup') {
        const fileUrl = filepath.startsWith('file://')
            ? filepath
            : url.pathToFileURL(filepath).href
        await import(`${fileUrl}?invalidateCache=${Math.random()}`)
    }

    onBeforeRunSuite(suite: Suite): void {
        if (suite.type === 'suite' && !this._isFileTask(suite)) {
            const message = this._formatSuiteMessage('suite:start', suite)
            message.uid = this._getSuiteStartUID()
            this._reporter.emit('suite:start', message)
        }
    }

    onAfterRunSuite(suite: Suite): void {
        if (suite.type === 'suite' && !this._isFileTask(suite)) {
            const message = this._formatSuiteMessage('suite:end', suite)
            message.uid = this._getSuiteEndUID()
            if (suite.result?.duration) {
                message.duration = suite.result.duration
            }
            this._reporter.emit('suite:end', message)
        }
    }

    async onBeforeRunTask(test: Test): Promise<void> {
        const message = this._formatTestMessage('test:start', test)
        message.uid = this._getTestStartUID()
        this._reporter.emit('test:start', message)

        await Promise.resolve(executeHooksWithArgs(
            'beforeTest',
            this._hooks.beforeTest as Function,
            [message, {}]
        )).catch(() => {})
    }

    async onAfterRunTask(test: Test): Promise<void> {
        const state = test.result?.state

        if (state === 'pass') {
            const message = this._formatTestMessage('test:pass', test)
            message.uid = this._getTestEndUID()
            message.passed = true
            message.duration = test.result?.duration
            this._reporter.emit('test:pass', message)
        } else if (state === 'fail') {
            this._failedCount++
            const message = this._formatTestMessage('test:fail', test)
            message.uid = this._getTestEndUID()
            message.passed = false
            message.duration = test.result?.duration
            if (test.result?.errors?.length) {
                message.error = this._formatError(test.result.errors[0])
            }
            this._reporter.emit('test:fail', message)
        } else if (test.mode === 'skip' || test.mode === 'todo') {
            const message = this._formatTestMessage('test:pending', test)
            message.uid = this._getTestEndUID()
            message.pending = true
            this._reporter.emit('test:pending', message)
        } else {
            const message = this._formatTestMessage('test:end', test)
            message.uid = this._getTestEndUID()
            message.duration = test.result?.duration
            this._reporter.emit('test:end', message)
        }

        const endMessage = this._formatTestMessage('test:end', test)
        endMessage.uid = this._peekTestUID()
        endMessage.duration = test.result?.duration
        this._reporter.emit('test:end', endMessage)

        await Promise.resolve(executeHooksWithArgs(
            'afterTest',
            this._hooks.afterTest as Function,
            [endMessage, {}, {
                error: test.result?.errors?.[0],
                duration: test.result?.duration,
                passed: test.result?.state === 'pass'
            }]
        )).catch(() => {})
    }

    private _isFileTask(suite: Suite): boolean {
        return 'filepath' in suite
    }

    private _formatSuiteMessage(type: string, suite: Suite): FrameworkMessage {
        return {
            type,
            cid: this._cid,
            specs: this._specs,
            title: suite.name,
            parent: suite.suite?.name,
            fullTitle: this._getFullTitle(suite),
            pending: suite.mode === 'skip' || suite.mode === 'todo',
            file: (suite.file as File)?.filepath,
        }
    }

    private _formatTestMessage(type: string, test: Test): FrameworkMessage {
        return {
            type,
            cid: this._cid,
            specs: this._specs,
            title: test.name,
            parent: test.suite?.name,
            fullTitle: this._getFullTitle(test),
            pending: test.mode === 'skip' || test.mode === 'todo',
            file: test.file?.filepath,
            body: undefined,
        }
    }

    private _getFullTitle(task: Suite | Test): string {
        const parts: string[] = [task.name]
        let parent = task.suite
        while (parent && parent.name && !this._isFileTask(parent)) {
            parts.unshift(parent.name)
            parent = parent.suite
        }
        return parts.join('.')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _formatError(error: any): ErrorInfo {
        return {
            name: error.name || 'Error',
            message: error.message || String(error),
            stack: error.stack || error.stackStr || '',
            type: error.name || 'Error',
            expected: error.expected,
            actual: error.actual,
        }
    }

    private _getSuiteStartUID(): string {
        const suiteCnt = this._suiteCnt.has(this._level.toString())
            ? this._suiteCnt.get(this._level.toString())
            : 0
        const suiteId = `suite-${this._level}-${suiteCnt}`

        if (this._suiteCnt.has(this._level.toString())) {
            this._suiteCnt.set(this._level.toString(), this._suiteCnt.get(this._level.toString())! + 1)
        } else {
            this._suiteCnt.set(this._level.toString(), 1)
        }

        this._suiteIds.push(`${this._level}${suiteCnt}`)
        this._level++
        return suiteId
    }

    private _getSuiteEndUID(): string {
        this._level--
        const suiteCnt = this._suiteCnt.get(this._level.toString())! - 1
        const suiteId = `suite-${this._level}-${suiteCnt}`
        this._suiteIds.pop()
        return suiteId
    }

    private _getTestStartUID(): string {
        const suiteId = this._suiteIds[this._suiteIds.length - 1]
        const cnt = this._testCnt.has(suiteId)
            ? this._testCnt.get(suiteId) || 0
            : 0
        this._testCnt.set(suiteId, cnt + 1)
        return `test-${suiteId}-${cnt}`
    }

    private _getTestEndUID(): string {
        const suiteId = this._suiteIds[this._suiteIds.length - 1]
        const cnt = this._testCnt.get(suiteId)! - 1
        return `test-${suiteId}-${cnt}`
    }

    private _peekTestUID(): string {
        const suiteId = this._suiteIds[this._suiteIds.length - 1]
        const cnt = this._testCnt.get(suiteId)! - 1
        return `test-${suiteId}-${cnt}`
    }
}

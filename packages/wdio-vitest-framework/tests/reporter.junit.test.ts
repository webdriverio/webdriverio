import { beforeEach, describe, expect, it, vi } from 'vitest'

import JunitReporter from '../../wdio-junit-reporter/src/index.js'
import { WdioBridgeReporter } from '../src/reporter.js'

const emitted = vi.hoisted(() => [] as [string, Record<string, any>][])

vi.mock('@wdio/runner', () => ({
    BaseReporter: class {
        initReporters = vi.fn().mockResolvedValue(undefined)
        waitForSync = vi.fn().mockResolvedValue(undefined)
        onMessage = vi.fn()
        setContextIdResolver = vi.fn()
        emit(event: string, payload: Record<string, any>) {
            emitted.push([event, { ...payload }])
        }
    }
}))

type Result = { state: 'passed' | 'failed', errors?: { message: string }[] }

const attempt = (retry: number, state: 'passed' | 'failed', beforeEach: { state: 'pass' | 'fail', error?: object }, error?: object) => ({
    event: 'wdio:attempt', retry,
    payload: { start: 100 * retry, end: 100 * retry + 10, state, ...(error && { error }), hooks: { beforeEach } }
})

const run = async (result: Result, entries: object[], retryCount = 1) => {
    const module: any = {
        type: 'module', id: 'm', moduleId: '/repo/a.spec.ts', relativeModuleId: 'a.spec.ts', children: { allTests: () => [test] },
        project: { config: { provide: { wdioCapabilities: { browserName: 'chrome' } } } },
        meta: () => ({ wdio: { sessionId: 's', capabilities: { browserName: 'chrome' } } }), state: () => result.state
    }
    const test: any = {
        type: 'test', id: 't1', name: 't', module, parent: module, options: { concurrent: false },
        result: () => result, diagnostic: () => ({ duration: 5, retryCount }),
        meta: () => ({ 'wdio:runtime': entries })
    }
    const bridge = new WdioBridgeReporter({ reporters: ['junit'] } as WebdriverIO.Config, () => {}, (err) => { throw err })
    bridge.onTestModuleStart(module)
    await bridge.onTestCaseReady(test)
    await bridge.onTestCaseResult(test)
    await bridge.onTestModuleEnd(module)

    const junit = new JunitReporter({ stdout: true, writeStream: { write: () => true } as never })
    const write = vi.spyOn(junit, 'write').mockImplementation(() => {})
    emitted.forEach(([event, payload]) => junit.emit(event, payload))
    return write.mock.calls.map(([xml]) => String(xml)).join('')
}

describe('JUnit output of a bridged run with failing beforeEach hooks', () => {
    beforeEach(() => {
        emitted.length = 0
    })

    it('writes no failure when the failing beforeEach belongs to a retried attempt of a passing test', async () => {
        const xml = await run({ state: 'passed' }, [
            attempt(0, 'failed', { state: 'fail', error: { message: 'hook boom' } }, { message: 'hook boom' }),
            attempt(1, 'passed', { state: 'pass' })
        ])

        expect(xml).not.toContain('<failure')
        expect(xml).not.toContain('<error')
        expect(xml.match(/<testcase /g)).toHaveLength(2)
        expect(xml.match(/<skipped/g)).toHaveLength(1)
        expect(xml).toMatch(/tests="2"[^>]*failures="0"|failures="0"[^>]*tests="2"/)
    })

    it('still writes a failure for a beforeEach that fails on the final attempt', async () => {
        const xml = await run({ state: 'failed', errors: [{ message: 'hook boom' }] }, [
            attempt(0, 'failed', { state: 'pass' }, { message: 'first' }),
            attempt(1, 'failed', { state: 'fail', error: { message: 'hook boom' } }, { message: 'hook boom' })
        ])

        expect(xml).toContain('<failure')
        expect(xml).toContain('hook boom')
    })
})

describe('JUnit output of a bridged test whose body and afterEach fail', () => {
    beforeEach(() => {
        emitted.length = 0
    })

    it('counts one failure and keeps both errors', async () => {
        const xml = await run({ state: 'failed', errors: [{ message: 'body boom' }, { message: 'afterEach boom' }] }, [{
            event: 'wdio:attempt', retry: 0,
            payload: {
                start: 0, end: 10, state: 'failed', error: { message: 'body boom', stack: 'Error: body boom' },
                hooks: { afterEach: { state: 'fail', error: { message: 'afterEach boom', stack: 'Error: afterEach boom' } } }
            }
        }], 0)

        expect(xml).toMatch(/tests="1"[^>]*failures="1"|failures="1"[^>]*tests="1"/)
        expect(xml).toContain('body boom')
        expect(xml).toContain('afterEach boom')
    })
})

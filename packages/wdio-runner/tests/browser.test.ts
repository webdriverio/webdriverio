import url from 'node:url'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'
import { MESSAGE_TYPES, browserChannelMessage, type Workers } from '@wdio/types'
import { setWdioKind } from '@wdio/utils'
import { remote } from 'webdriverio'

import BrowserFramework from '../src/browser.js'
import type BaseReporter from '../src/reporter.js'

const globals = vi.hoisted(() => ({ browser: undefined as unknown }))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('@wdio/globals', () => ({
    get browser () {
        return globals.browser
    }
}))

type MessageHandler = (cmd: Workers.WorkerCommand) => Promise<void>

/**
 * Runs a command that the page sends to the worker, and returns the result
 * that the worker sends back to the page.
 */
async function runCommand (handler: MessageHandler, commandName: string) {
    const send = process.send as ReturnType<typeof vi.fn>
    send.mockClear()
    await handler({
        command: 'workerRequest',
        args: {
            id: 1,
            message: browserChannelMessage(MESSAGE_TYPES.commandRequestMessage, { id: 1, cid: '0-0', commandName, args: [] })
        }
    } as unknown as Workers.WorkerCommand)
    return send.mock.calls[0][0].args.message.value
}

/**
 * The page cannot receive WebdriverIO objects, so the worker reads the
 * `wdio.kind` brand of a command result and sends element references.
 */
describe('BrowserFramework command results', () => {
    const originalSend = process.send
    let handler: MessageHandler
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({ capabilities: { browserName: 'foobar' }, strictSelectors: false })
        globals.browser = browser
        process.send = vi.fn() as unknown as typeof process.send

        const on = vi.spyOn(process, 'on').mockImplementation(() => process)
        new BrowserFramework('0-0', {} as WebdriverIO.Config, [], {} as BaseReporter)
        handler = on.mock.calls.find(([event]) => event === 'message')![1] as MessageHandler
        on.mockRestore()
    })

    afterEach(() => {
        process.send = originalSend
    })

    it('sends an element as an element reference', async () => {
        browser.addCommand('getElement', () => browser.$('#foo'))
        const elem = await browser.$('#foo')

        expect(await runCommand(handler, 'getElement')).toEqual({
            id: 1,
            result: { [ELEMENT_KEY]: elem.elementId }
        })
    })

    it('sends an element list as a list of element references', async () => {
        browser.addCommand('getElements', () => browser.$$('#foo'))
        const elems = await browser.$$('#foo')

        const { result } = await runCommand(handler, 'getElements')
        expect(result).toEqual([...elems].map((elem) => ({ [ELEMENT_KEY]: elem.elementId })))
        expect(result.length).toBeGreaterThan(0)
    })

    it('sends the kind of a mock or a browsing context, because JSON drops the brand', async () => {
        const mock = setWdioKind({ url: '**/api' }, 'mock')
        const context = setWdioKind({ contextId: 'tab-1' }, 'browsing-context')
        browser.addCommand('getMock', () => mock)
        browser.addCommand('getBrowsingContext', () => context)
        browser.addCommand('getElement', () => browser.$('#foo'))

        expect(await runCommand(handler, 'getMock')).toEqual({ id: 1, result: mock, kind: 'mock' })
        expect(await runCommand(handler, 'getBrowsingContext')).toEqual({ id: 1, result: context, kind: 'browsing-context' })
        expect(await runCommand(handler, 'getElement')).not.toHaveProperty('kind')
    })

    it('sends a plain object as it is, also when it looks like an element', async () => {
        class Element {
            elementId = 'foo'
        }
        const value = { foundWith: '$$', selector: '#foo' }
        browser.addCommand('getPlainList', () => value)
        browser.addCommand('getPlainElement', () => new Element())

        expect(await runCommand(handler, 'getPlainList')).toEqual({ id: 1, result: value })
        expect(await runCommand(handler, 'getPlainElement')).toEqual({ id: 1, result: { elementId: 'foo' } })
    })
})

/**
 * Runs an assertion that the page sends to the worker. The page sends the
 * message as JSON, so an element list arrives as a plain array.
 */
async function runExpect (handler: MessageHandler, request: Partial<Workers.ExpectRequestEvent>) {
    const send = process.send as ReturnType<typeof vi.fn>
    send.mockClear()
    const value = JSON.parse(JSON.stringify({ id: 1, cid: '0-0', scope: {}, args: [], ...request }))
    await handler({
        command: 'workerRequest',
        args: { id: 1, message: browserChannelMessage(MESSAGE_TYPES.expectRequestMessage, value) }
    } as unknown as Workers.WorkerCommand)
    return send.mock.calls[0][0].args.message.value
}

describe('BrowserFramework assertion subjects', () => {
    const originalSend = process.send
    let handler: MessageHandler
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        browser = await remote({ capabilities: { browserName: 'foobar' }, strictSelectors: false })
        globals.browser = browser
        process.send = vi.fn() as unknown as typeof process.send

        const on = vi.spyOn(process, 'on').mockImplementation(() => process)
        new BrowserFramework('0-0', {} as WebdriverIO.Config, [], {} as BaseReporter)
        handler = on.mock.calls.find(([event]) => event === 'message')![1] as MessageHandler
        on.mockRestore()
    })

    afterEach(() => {
        process.send = originalSend
    })

    it('loads an element list again as an element list', async () => {
        const elems = await browser.$$('#foo')
        const $$ = vi.spyOn(browser, '$$')

        const response = await runExpect(handler, {
            matcherName: 'toBeElementsArrayOfSize',
            args: [elems.length],
            element: elems,
            elementKind: 'element-array'
        })

        expect(response).toEqual(expect.objectContaining({ id: 1, pass: true }))
        expect($$).toHaveBeenCalledTimes(1)
    })

    it('loads an element again', async () => {
        const elem = await browser.$('#foo')
        const $ = vi.spyOn(browser, '$')

        const response = await runExpect(handler, {
            matcherName: 'toBeExisting',
            element: elem,
            elementKind: 'element'
        })

        expect(response).toEqual(expect.objectContaining({ id: 1, pass: true }))
        expect($).toHaveBeenCalledTimes(1)
    })

    it('does not take an object without a kind for an element', async () => {
        const response = await runExpect(handler, {
            matcherName: 'toBeExisting',
            element: { elementId: 'foo', selector: '#foo' }
        })

        expect(response).toEqual(expect.objectContaining({ id: 1, pass: false }))
        expect(response.message).toContain('Received value is not an element or array of elements')
    })

    it('loads a copy of an element list again item by item', async () => {
        const elems = await browser.$$('#foo')
        const $$ = vi.spyOn(browser, '$$')

        const response = await runExpect(handler, {
            matcherName: 'toBeElementsArrayOfSize',
            args: [elems.length],
            element: [...elems]
        })

        expect(response).toEqual(expect.objectContaining({ id: 1, pass: true }))
        expect($$).not.toHaveBeenCalled()
    })
})

/**
 * While a spec loads, browser errors and `SEVERE` browser logs end it with a
 * useful message. Once Mocha runs the tests, they belong to the tests: Mocha
 * reports the result, so the runner must not end the spec (#14216, #14255).
 */
describe('BrowserFramework browser errors', () => {
    const originalSend = process.send
    let handler: MessageHandler
    let framework: BrowserFramework
    let browser: Record<string, ReturnType<typeof vi.fn>>

    const severeLog = (timestamp: number, message = 'http://localhost/driver.js 297:6 - "an error the test handles"') => ({
        level: 'SEVERE', source: 'console-api', message, timestamp
    })

    async function finishSpec (failures: number) {
        await handler({
            command: 'workerRequest',
            args: { id: 1, message: browserChannelMessage(MESSAGE_TYPES.browserTestResult, { failures, events: [] }) }
        } as unknown as Workers.WorkerCommand)
    }

    function sentErrors () {
        return vi.mocked(process.send!).mock.calls
            .map(([message]) => message as { name?: string, content?: { message: string } })
            .filter((message) => message.name === 'error')
    }

    beforeEach(() => {
        vi.useFakeTimers()
        browser = {
            url: vi.fn().mockResolvedValue(undefined),
            setCookies: vi.fn().mockResolvedValue(undefined),
            setTimeout: vi.fn().mockResolvedValue(undefined),
            execute: vi.fn(),
            getLogs: vi.fn(),
            refresh: vi.fn().mockResolvedValue(undefined)
        }
        globals.browser = browser
        process.send = vi.fn() as unknown as typeof process.send

        const on = vi.spyOn(process, 'on').mockImplementation(() => process)
        framework = new BrowserFramework('0-0', { mochaOpts: { timeout: 60_000 } } as WebdriverIO.Config, [url.pathToFileURL(path.resolve('spec.test.js')).href], { emit: vi.fn() } as unknown as BaseReporter)
        handler = on.mock.calls.find(([event]) => event === 'message')![1] as MessageHandler
        on.mockRestore()
    })

    afterEach(() => {
        vi.useRealTimers()
        process.send = originalSend
    })

    it('ignores browser log errors that are logged after the tests started', async () => {
        browser.execute.mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        browser.getLogs.mockResolvedValue([severeLog(1500)])

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(600)
        expect(browser.getLogs).toHaveBeenCalled()
        await finishSpec(0)

        expect(await result).toBe(0)
        expect(sentErrors()).toEqual([])
    })

    it('ends the spec on browser log errors that are logged before the tests started', async () => {
        browser.execute.mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 2000 })
        browser.getLogs.mockResolvedValue([severeLog(1500)])

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(600)

        expect(await result).toBe(1)
        expect(sentErrors()[0].content!.message).toContain('"an error the test handles"')
    })

    it('ends the spec on browser log errors when the tests did not start', async () => {
        browser.execute.mockResolvedValueOnce({ errors: [], hasViteError: false }).mockResolvedValue(undefined)
        browser.getLogs.mockResolvedValue([severeLog(1500)])

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(600)

        expect(await result).toBe(1)
        expect(sentErrors()).toHaveLength(1)
    })

    it('ignores test errors when Mocha starts between the state read and getLogs', async () => {
        browser.execute
            .mockResolvedValueOnce({ errors: [], hasViteError: false })
            .mockResolvedValueOnce(1000)
            .mockResolvedValue(undefined)
        browser.getLogs.mockResolvedValueOnce([severeLog(1500)]).mockResolvedValue([])

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(600)
        expect(browser.execute).toHaveBeenCalledTimes(2)
        await finishSpec(0)

        expect(await result).toBe(0)
        expect(sentErrors()).toEqual([])
    })

    it('still retries an outdated optimize dep after the tests started', async () => {
        browser.execute.mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        browser.getLogs.mockResolvedValueOnce([
            severeLog(1500, 'http://localhost/node_modules/.vite/deps/expect.js?v=1 - Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)')
        ]).mockResolvedValue([])

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(600)
        expect(browser.refresh).toHaveBeenCalledTimes(1)
        await finishSpec(0)

        expect(await result).toBe(0)
    })

    it('ignores a state check that is still running when the session ends', async () => {
        let rejectState!: (err: Error) => void
        browser.execute.mockReturnValue(new Promise((_, reject) => {
            rejectState = reject
        }))
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)

        try {
            const result = framework.run()
            await vi.advanceTimersByTimeAsync(600)
            expect(browser.execute).toHaveBeenCalledTimes(1)
            await finishSpec(0)
            expect(await result).toBe(0)

            rejectState(Object.assign(new Error('WebDriver Bidi command "script.callFunction" with id 15 got no result: the connection was closed'), { name: 'session ended' }))
            vi.useRealTimers()
            await new Promise((resolve) => setImmediate(resolve))

            expect(unhandled).not.toHaveBeenCalled()
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })

    it('still surfaces a failed state check while the spec runs', async () => {
        browser.execute.mockRejectedValueOnce(new Error('browser crashed')).mockResolvedValue({ errors: [], hasViteError: false })
        browser.getLogs.mockResolvedValue([])
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)

        try {
            const result = framework.run()
            await vi.advanceTimersByTimeAsync(600)
            vi.useRealTimers()
            await new Promise((resolve) => setImmediate(resolve))
            expect(unhandled).toHaveBeenCalledWith(expect.objectContaining({ message: 'browser crashed' }), expect.anything())

            await finishSpec(0)
            expect(await result).toBe(0)
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })

    it('does not stack overlapping error checks while paused at a breakpoint', async () => {
        let resolveExecute!: (value: unknown) => void
        browser.execute.mockReturnValue(new Promise((resolve) => {
            resolveExecute = resolve
        }))

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(2000)
        expect(browser.execute).toHaveBeenCalledTimes(1)

        resolveExecute({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        await finishSpec(0)
        expect(await result).toBe(0)
    })

    it('uses extended timeout when inspect option is enabled even with configured mochaOpts.timeout', async () => {
        const on = vi.spyOn(process, 'on').mockImplementation(() => process)
        const inspectFramework = new BrowserFramework(
            '0-0',
            { runner: ['browser', { inspect: true }], mochaOpts: { timeout: 60_000 } } as unknown as WebdriverIO.Config,
            [url.pathToFileURL(path.resolve('spec.test.js')).href],
            { emit: vi.fn() } as unknown as BaseReporter
        )
        const inspectHandler = on.mock.calls.find(([event]) => event === 'message')![1] as MessageHandler
        on.mockRestore()

        browser.execute
            .mockRejectedValueOnce(new Error('script timeout'))
            .mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        browser.getLogs.mockResolvedValue([])

        const result = inspectFramework.run()
        await vi.advanceTimersByTimeAsync(120_000)
        expect(browser.setTimeout).toHaveBeenCalledWith({ script: 24 * 60 * 60 * 1000 })
        expect(sentErrors()).toEqual([])

        await inspectHandler({
            command: 'workerRequest',
            args: { id: 1, message: browserChannelMessage(MESSAGE_TYPES.browserTestResult, { failures: 0, events: [] }) }
        } as unknown as Workers.WorkerCommand)
        expect(await result).toBe(0)
    })
})

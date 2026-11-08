import url from 'node:url'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'
import { MESSAGE_TYPES, browserChannelMessage, type Workers } from '@wdio/types'
import { setWdioKind } from '@wdio/utils'
import { remote } from 'webdriverio'
// @ts-expect-error mock feature
import { logMock } from '@wdio/logger'

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
            execute: vi.fn(),
            getWindowHandle: vi.fn().mockResolvedValue('test-page'),
            getWindowHandles: vi.fn().mockResolvedValue(['test-page']),
            getLogs: vi.fn(),
            refresh: vi.fn().mockResolvedValue(undefined)
        }
        globals.browser = browser
        process.send = vi.fn() as unknown as typeof process.send
        logMock.info.mockClear()
        framework = createFramework({})
    })

    function createFramework (config: Partial<WebdriverIO.Config>) {
        const on = vi.spyOn(process, 'on').mockImplementation(() => process)
        const created = new BrowserFramework('0-0', { mochaOpts: { timeout: 60_000 }, ...config } as WebdriverIO.Config, [url.pathToFileURL(path.resolve('spec.test.js')).href], { emit: vi.fn() } as unknown as BaseReporter)
        handler = on.mock.calls.find(([event]) => event === 'message')![1] as MessageHandler
        on.mockRestore()
        return created
    }

    // the tab of the test page that `browser.url()` returns in a WebDriver BiDi session
    function testPageTab () {
        return setWdioKind({ contextId: 'test-page', url: 'http://localhost:5173/?cid=0-0&spec=/project/spec.test.js', execute: vi.fn() }, 'browsing-context')
    }

    afterEach(() => {
        vi.useRealTimers()
        process.send = originalSend
    })

    it('reports no load error for a test page that got its first byte less than 5 s ago, as right after a reload', async () => {
        browser.execute.mockResolvedValue(undefined)
        framework.run()
        await vi.advanceTimersByTimeAsync(600)
        const fetchExecutionState = browser.execute.mock.calls[0][0] as () => unknown
        // times from the start of the navigation: the server sent the first byte after 6 s, as a cold Vite start
        const page = {
            document: { readyState: 'loading', title: '', querySelector: () => null, documentElement: { innerHTML: '' } },
            window: {},
            performance: { now: () => 10_999, getEntriesByType: () => [{ responseStart: 6000 }] }
        }
        vi.stubGlobal('document', page.document)
        vi.stubGlobal('window', page.window)
        vi.stubGlobal('performance', page.performance)
        const loadError = { errors: [{ message: expect.stringContaining('Failed to load test page') }] }
        try {
            expect(fetchExecutionState()).toBeUndefined()
            // a page that does not finish to load still reports why
            page.performance.now = () => 11_000
            expect(fetchExecutionState()).toMatchObject(loadError)
            page.performance.now = () => 6000
            page.document.readyState = 'interactive'
            expect(fetchExecutionState()).toMatchObject(loadError)
        } finally {
            vi.unstubAllGlobals()
        }
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

    it('reloads the tab of the test page for an outdated optimize dep, also when the test works in another window', async () => {
        const tab = Object.assign(testPageTab(), { refresh: vi.fn().mockResolvedValue(undefined) })
        tab.execute.mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        browser.url.mockResolvedValue(tab)
        browser.getLogs.mockResolvedValueOnce([
            severeLog(1500, 'http://localhost/node_modules/.vite/deps/expect.js?v=1 - Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)')
        ]).mockResolvedValue([])

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(600)
        expect(tab.refresh).toHaveBeenCalledTimes(1)
        expect(browser.refresh).not.toHaveBeenCalled()
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

    it('reads the test page in its tab, also when the test works in another window', async () => {
        const tab = testPageTab()
        browser.url.mockResolvedValue(tab)
        tab.execute
            .mockResolvedValueOnce({ errors: [], hasViteError: false })
            .mockResolvedValueOnce(1000)
            .mockResolvedValue({ 'file.js': {} })
        browser.getLogs.mockResolvedValueOnce([severeLog(1500)]).mockResolvedValue([])
        framework = createFramework({ runner: ['browser', { coverage: { enabled: true } }] } as Partial<WebdriverIO.Config>)

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(600)
        await finishSpec(0)

        expect(await result).toBe(0)
        expect(browser.execute).not.toHaveBeenCalled()
        // the state check, the start time of the tests and the coverage
        expect(tab.execute).toHaveBeenCalledTimes(3)
        // the tab has the handle of the test page
        expect(browser.getWindowHandle).not.toHaveBeenCalled()
        expect(vi.mocked(process.send!).mock.calls.map(([message]) => JSON.stringify(message)).join()).toContain('file.js')
    })

    it('reads the test page in its tab in watch mode, also when the last run left a popup as the current window', async () => {
        const tab = testPageTab()
        tab.execute.mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        const popup = setWdioKind({ contextId: 'popup', url: 'about:blank', execute: vi.fn() }, 'browsing-context')
        browser.getWindowHandle.mockResolvedValue('popup')
        Object.assign(browser, {
            isBidi: true,
            browsingContexts: vi.fn().mockResolvedValue([popup, tab])
        })
        browser.getLogs.mockResolvedValue([])
        framework = createFramework({ sessionId: 'reused' })

        const result = framework.run()
        await vi.advanceTimersByTimeAsync(600)
        await finishSpec(0)

        expect(await result).toBe(0)
        expect(browser.url).not.toHaveBeenCalled()
        expect(browser.execute).not.toHaveBeenCalled()
        expect(popup.execute).not.toHaveBeenCalled()
        expect(tab.execute).toHaveBeenCalled()
        // the tab has the handle of the test page
        expect(browser.getWindowHandle).not.toHaveBeenCalled()
    })

    it('reads the current window when an overwrite of url() returns another value', async () => {
        browser.url.mockResolvedValue(true)
        browser.execute.mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        browser.getLogs.mockResolvedValue([])
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)

        try {
            const result = framework.run()
            await vi.advanceTimersByTimeAsync(600)
            vi.useRealTimers()
            await new Promise((resolve) => setImmediate(resolve))
            expect(unhandled).not.toHaveBeenCalled()
            expect(browser.execute).toHaveBeenCalled()

            await finishSpec(0)
            expect(await result).toBe(0)
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })

    it('reads the current window in WebDriver Classic, where url() returns the browser, and skips a check in a closed window', async () => {
        browser.url.mockResolvedValue(setWdioKind(browser, 'browser'))
        browser.getWindowHandle.mockResolvedValue('test-page')
        browser.getWindowHandles.mockResolvedValue(['test-page'])
        browser.execute
            .mockRejectedValueOnce(Object.assign(new Error('target window already closed'), { name: 'no such window' }))
            .mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        browser.getLogs.mockResolvedValue([])
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)

        try {
            const result = framework.run()
            await vi.advanceTimersByTimeAsync(600)
            vi.useRealTimers()
            await new Promise((resolve) => setImmediate(resolve))
            expect(unhandled).not.toHaveBeenCalled()
            expect(browser.getWindowHandle).toHaveBeenCalledTimes(1)
            expect(logMock.info).toHaveBeenCalledWith('Skip the browser error check: target window already closed')

            await finishSpec(0)
            expect(await result).toBe(0)
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })

    // the errors that a state check gets when it runs in a window that closes, e.g. a popup after closeWindow()
    const closedWindowErrors = {
        'WebDriver BiDi': new Error('WebDriver Bidi command "script.callFunction" failed with error: no such frame - Context 92A1E179CF613B87930B5970E6AE1A9D not found'),
        'WebDriver Classic': Object.assign(new Error('target window already closed'), { name: 'no such window' })
    }

    it.each([
        ...Object.entries(closedWindowErrors),
        ['a document that the page replaced', new Error('WebDriver Bidi command "script.callFunction" failed with error: unknown error - Cannot find context with specified id')]
    ])('skips a state check that cannot read the test page, and logs why (%s)', async (_, error) => {
        browser.execute.mockRejectedValueOnce(error).mockResolvedValue({ errors: [], hasViteError: false })
        browser.getWindowHandles.mockResolvedValue(['test-page'])
        browser.getLogs.mockResolvedValue([])
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)

        try {
            const result = framework.run()
            await vi.advanceTimersByTimeAsync(600)
            vi.useRealTimers()
            await new Promise((resolve) => setImmediate(resolve))
            expect(unhandled).not.toHaveBeenCalled()
            expect(logMock.info).toHaveBeenCalledWith(`Skip the browser error check: ${(error as Error).message}`)

            await finishSpec(0)
            expect(await result).toBe(0)
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })

    it.each(Object.entries(closedWindowErrors))('still surfaces a state check in a window that closed when the test page is gone (%s)', async (_, error) => {
        browser.execute.mockRejectedValueOnce(error).mockResolvedValue({ errors: [], hasViteError: false })
        browser.getWindowHandles.mockResolvedValue(['popup'])
        browser.getLogs.mockResolvedValue([])
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)

        try {
            const result = framework.run()
            await vi.advanceTimersByTimeAsync(600)
            vi.useRealTimers()
            await new Promise((resolve) => setImmediate(resolve))
            expect(unhandled).toHaveBeenCalledWith(error, expect.anything())

            await finishSpec(0)
            expect(await result).toBe(0)
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })

    it('still surfaces a state check in the tab of the test page when the test page is gone', async () => {
        const tab = testPageTab()
        tab.execute
            .mockRejectedValueOnce(closedWindowErrors['WebDriver BiDi'])
            .mockResolvedValue({ errors: [], hasViteError: false, testsStartedAt: 1000 })
        browser.url.mockResolvedValue(tab)
        browser.getWindowHandles.mockResolvedValue(['popup'])
        browser.getLogs.mockResolvedValue([])
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)

        try {
            const result = framework.run()
            await vi.advanceTimersByTimeAsync(600)
            vi.useRealTimers()
            await new Promise((resolve) => setImmediate(resolve))
            expect(unhandled).toHaveBeenCalledWith(closedWindowErrors['WebDriver BiDi'], expect.anything())

            await finishSpec(0)
            expect(await result).toBe(0)
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })
})

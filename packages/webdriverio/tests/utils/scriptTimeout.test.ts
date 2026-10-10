import { EventEmitter } from 'node:events'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { scriptTimeoutOf, trackScriptTimeout, withScriptTimeout } from '../../src/utils/scriptTimeout.js'

function fakeBrowser (capabilities: Record<string, unknown> = {}, sessionId = 'session-1') {
    return Object.assign(new EventEmitter(), { sessionId, capabilities }) as unknown as WebdriverIO.Browser & EventEmitter
}

function setTimeoutsResult (script: unknown, result: unknown = { value: null }) {
    return { command: 'setTimeouts', body: { implicit: undefined, pageLoad: undefined, script }, result }
}

describe('scriptTimeoutOf', () => {
    it('uses the script timeout of the session capabilities', () => {
        expect(scriptTimeoutOf(fakeBrowser({ timeouts: { script: 12_000 } }))).toBe(12_000)
        expect(scriptTimeoutOf(fakeBrowser({ timeouts: { script: null } }))).toBe(null)
    })

    it('uses the default of the WebDriver spec without a script timeout in the capabilities', () => {
        expect(scriptTimeoutOf(fakeBrowser())).toBe(30_000)
        expect(scriptTimeoutOf({ sessionId: 'x' } as unknown as WebdriverIO.Browser)).toBe(30_000)
    })

    it('follows a successful setTimeouts command', () => {
        const browser = fakeBrowser({ timeouts: { script: 30_000 } })
        trackScriptTimeout(browser)

        browser.emit('result', setTimeoutsResult(2_000))
        expect(scriptTimeoutOf(browser)).toBe(2_000)

        browser.emit('result', setTimeoutsResult(undefined))
        expect(scriptTimeoutOf(browser)).toBe(2_000)

        browser.emit('result', setTimeoutsResult(5_000, { error: new Error('invalid argument') }))
        expect(scriptTimeoutOf(browser)).toBe(2_000)

        browser.emit('result', setTimeoutsResult(null))
        expect(scriptTimeoutOf(browser)).toBe(null)
    })

    it('ignores the value of an earlier session after a reload', () => {
        const browser = fakeBrowser({ timeouts: { script: 30_000 } })
        trackScriptTimeout(browser)
        browser.emit('result', setTimeoutsResult(2_000))

        Object.assign(browser, { sessionId: 'session-2', capabilities: { timeouts: { script: 15_000 } } })
        expect(scriptTimeoutOf(browser)).toBe(15_000)
    })

    it('adds one listener per browser', () => {
        const browser = fakeBrowser()
        trackScriptTimeout(browser)
        trackScriptTimeout(browser)
        expect(browser.listenerCount('result')).toBe(1)
    })
})

describe('withScriptTimeout', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('returns the result when it arrives within the script timeout', async () => {
        const browser = fakeBrowser({ timeouts: { script: 1_000 } })
        await expect(withScriptTimeout(browser, Promise.resolve('done'))).resolves.toBe('done')
    })

    it('passes on an error of the call', async () => {
        const browser = fakeBrowser({ timeouts: { script: 1_000 } })
        await expect(withScriptTimeout(browser, Promise.reject(new Error('boom')))).rejects.toThrow('boom')
    })

    it('rejects with a script timeout error when the call takes longer', async () => {
        vi.useFakeTimers()
        const browser = fakeBrowser({ timeouts: { script: 1_000 } })
        const result = withScriptTimeout(browser, new Promise(() => {}))
        const assertion = expect(result).rejects.toMatchObject({
            name: 'script timeout',
            message: expect.stringContaining('did not finish within 1000ms')
        })
        await vi.advanceTimersByTimeAsync(999)
        await vi.advanceTimersByTimeAsync(1)
        await assertion
    })

    it('does not report a late error of the call as an unhandled rejection', async () => {
        vi.useFakeTimers()
        const unhandled = vi.fn()
        process.on('unhandledRejection', unhandled)
        try {
            const browser = fakeBrowser({ timeouts: { script: 100 } })
            let fail: (err: Error) => void = () => {}
            const call = new Promise((_, reject) => (fail = reject))
            const result = withScriptTimeout(browser, call)
            const assertion = expect(result).rejects.toMatchObject({ name: 'script timeout' })
            await vi.advanceTimersByTimeAsync(100)
            await assertion
            fail(new Error('late'))
            await vi.advanceTimersByTimeAsync(0)
            vi.useRealTimers()
            await new Promise((resolve) => setImmediate(resolve))
            expect(unhandled).not.toHaveBeenCalled()
        } finally {
            process.off('unhandledRejection', unhandled)
        }
    })

    it('sets no limit for a null script timeout or one that a timer cannot hold', async () => {
        vi.useFakeTimers()
        for (const script of [null, Number.MAX_SAFE_INTEGER]) {
            const browser = fakeBrowser({ timeouts: { script } })
            let finish: (value: string) => void = () => {}
            const result = withScriptTimeout(browser, new Promise<string>((resolve) => (finish = resolve)))
            await vi.advanceTimersByTimeAsync(3_000_000_000)
            finish('done')
            await expect(result).resolves.toBe('done')
        }
    })
})

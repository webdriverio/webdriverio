import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'
import Mocha from 'mocha'
import { testFnWrapper } from '@wdio/utils'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface Scenario {
    timeout?: number
    beforeTestTime?: number
    retries?: number
    type?: 'Test' | 'Hook'
    ctx?: Mocha.Context
}

/**
 * Run `body` as a real Mocha runnable through WebdriverIO's test wrapper, as
 * `@wdio/mocha-framework` does, and record when the `afterTest` (or
 * `afterHook`) hook ends and when Mocha finishes the runnable.
 */
let lastRunnable: Mocha.Runnable

function run (body: (this: Mocha.Context) => Promise<unknown>, { timeout = 300, beforeTestTime = 0, retries = 0, type = 'Test', ctx = new Mocha.Context() }: Scenario = {}) {
    const start = Date.now()
    const at: Record<string, number> = {}
    let afterPassed: boolean | undefined
    let afterError: Error | undefined
    const runnable = new Mocha.Runnable('scenario', function (this: Mocha.Context) {
        return testFnWrapper.call(
            this,
            type,
            { specFn: body, specFnArgs: [] },
            { beforeFn: [() => sleep(beforeTestTime)], beforeFnArgs: () => [{ title: 'scenario' }] },
            {
                afterFn: [async (_test: unknown, _context: unknown, result: { passed: boolean, error?: Error }) => {
                    afterPassed = result.passed
                    afterError = result.error
                    /**
                     * after a timeout, Mocha waits one more timeout for the after hooks
                     */
                    await sleep(60)
                    at.afterHookEnd = Date.now() - start
                }],
                afterFnArgs: () => [{ title: 'scenario' }, {}]
            },
            '0-0',
            retries,
            type === 'Hook' ? '"before each" hook' : undefined
        )
    })
    lastRunnable = runnable
    /**
     * the Mocha Runner listens to this event, e.g. for a second `done()`; without
     * a listener the error would be an unhandled rejection
     */
    const errors: Error[] = []
    runnable.on('error', (err: Error) => errors.push(err))
    runnable.parent = new Mocha.Suite('suite', new Mocha.Context())
    runnable.timeout(timeout)
    runnable.ctx = ctx
    return new Promise<{ err?: Error, at: Record<string, number>, afterPassed?: boolean, afterError?: Error, runnable: Mocha.Runnable & { timer?: unknown }, afterPassedNow: () => boolean | undefined, errors: Error[] }>((resolve) => {
        runnable.run((err?: Error) => {
            at.mochaDone = Date.now() - start
            resolve({ err, at, afterPassed, afterError, runnable, afterPassedNow: () => afterPassed, errors })
        })
    })
}

/**
 * Mocha starts the next test when it finishes this one, so the after hook has
 * to end first (https://github.com/webdriverio/webdriverio/issues/14051)
 */
function expectAfterHookBeforeMochaDone ({ err, at, afterPassed }: Awaited<ReturnType<typeof run>>, timeout: number) {
    expect(err?.message).toContain(`Timeout of ${timeout}ms exceeded`)
    expect(afterPassed).toBe(false)
    expect(at.afterHookEnd).toBeDefined()
    expect(at.mochaDone).toBeGreaterThanOrEqual(at.afterHookEnd)
}

describe('Mocha timeout and the after hooks', () => {
    it('lets Mocha wait for afterTest after a timeout', async () => {
        expectAfterHookBeforeMochaDone(await run(() => sleep(1000)), 300)
    })

    it('lets Mocha wait for afterTest when the process pauses as the WebdriverIO timer starts', async () => {
        const realSetTimeout = globalThis.setTimeout
        // Mocha keeps its own setTimeout, so this pauses only the WebdriverIO timer
        const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms?: number) => {
            if (ms !== undefined && ms > 200 && ms <= 300) {
                const end = performance.now() + 10
                while (performance.now() < end) { /* a GC or a stopped CPU */ }
            }
            return realSetTimeout(fn, ms)
        }) as typeof setTimeout)
        try {
            expectAfterHookBeforeMochaDone(await run(() => new Promise((resolve) => realSetTimeout(resolve, 1000))), 300)
        } finally {
            spy.mockRestore()
        }
    })

    it('lets Mocha wait for afterTest when a pause ends with another timer of the same duration due', async () => {
        const pause = () => {
            const end = performance.now() + 30
            while (performance.now() < end) { /* a GC or a stopped CPU */ }
        }
        // Node fires all due timers of one duration before it looks at the next duration
        const other = setTimeout(() => {}, 300)
        const pauseTimer = setTimeout(pause, 290)
        const started = performance.now()
        while (performance.now() - started < 5) { /* this timer ends first */ }
        try {
            expectAfterHookBeforeMochaDone(await run(() => sleep(1000)), 300)
        } finally {
            clearTimeout(other)
            clearTimeout(pauseTimer)
        }
    })

    it('lets Mocha wait for afterTest of the next test when the test before it ends late', async () => {
        const ctx = new Mocha.Context()
        // Mocha times this test out in beforeTest and starts the next one, on the same context
        await run(async () => {}, { beforeTestTime: 400, ctx })
        expectAfterHookBeforeMochaDone(await run(() => sleep(1000), { ctx }), 300)
    })

    it('lets Mocha wait for afterTest of the next test when the test before it has retries left', async () => {
        const ctx = new Mocha.Context()
        await run(async () => { throw new Error('fails') }, { beforeTestTime: 400, retries: 1, ctx })
        expectAfterHookBeforeMochaDone(await run(() => sleep(1000), { ctx }), 300)
    })

    it('lets Mocha wait for afterTest with fake timers, as Mocha keeps the real timers', async () => {
        const realSetTimeout = globalThis.setTimeout
        // a fake timer that nothing moves on
        const spy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms?: number) => (
            ms === 300 ? realSetTimeout(() => {}, 0) : realSetTimeout(fn, ms)
        )) as typeof setTimeout)
        try {
            expectAfterHookBeforeMochaDone(await run(() => new Promise((resolve) => realSetTimeout(resolve, 1000))), 300)
        } finally {
            spy.mockRestore()
        }
    })

    it('gives a hook that runs again a new timeout', async () => {
        const hook = new Mocha.Runnable('hook', function (this: Mocha.Context) {
            return testFnWrapper.call(
                this, 'Hook', { specFn: () => sleep(200), specFnArgs: [] },
                { beforeFn: [], beforeFnArgs: () => [{ title: 'hook' }] },
                { afterFn: [], afterFnArgs: () => [{ title: 'hook' }, {}] },
                '0-0', 0, '"before each" hook'
            )
        })
        hook.parent = new Mocha.Suite('suite', new Mocha.Context())
        hook.timeout(300)
        hook.ctx = new Mocha.Context()
        const runHook = () => new Promise<Error | undefined>((resolve) => hook.run(resolve))
        expect(await runHook()).toBeUndefined()
        expect(await runHook()).toBeUndefined()
    })

    it('ends a test that Mocha timed out in beforeTest, with no new timer', async () => {
        const result = await run(() => new Promise(() => {}), { beforeTestTime: 400 })
        const { timer } = result.runnable
        expect(result.err?.message).toContain('Timeout of 300ms exceeded')
        expect(result.at.afterHookEnd).toBeUndefined()
        await sleep(250)
        expect(result.afterPassedNow()).toBe(false)
        expect(result.at.afterHookEnd).toBeDefined()
        expect(result.runnable.timer).toBe(timer)
    })

    it('does not start the body of a test that Mocha timed out in beforeTest, as Mocha runs the next test', async () => {
        const body = vi.fn(() => sleep(10))
        const result = await run(body, { beforeTestTime: 400 })
        expect(result.err?.message).toContain('Timeout of 300ms exceeded')
        await sleep(250)
        expect(body).not.toHaveBeenCalled()
        // afterTest still gets the timeout of the test
        expect(result.afterPassedNow()).toBe(false)
    })

    it('does not make Mocha wait for afterTest of a test that passed, as Mocha does', async () => {
        const { err, at } = await run(() => sleep(10), { timeout: 40 })
        expect(err?.message).toContain('Timeout of 40ms exceeded')
        expect(at.afterHookEnd).toBeUndefined()
    })

    it('makes Mocha wait one more timeout for afterTest after a timeout, not longer', async () => {
        const { err, at } = await run(() => sleep(1000), { timeout: 20 })
        expect(err?.message).toContain('Timeout of 20ms exceeded')
        expect(at.afterHookEnd).toBeUndefined()
    })

    it('keeps the timeout of the next test when a retry starts after an uncaught error of the test before it', async () => {
        const ctx = new Mocha.Context()
        const first = run(async () => {
            await sleep(50)
            throw new Error('fails late')
        }, { retries: 1, ctx })
        await sleep(10)
        // what Mocha does for an uncaught error: it ends the test and moves on
        const uncaught = ctx.runnable() as unknown as { clearTimeout: () => void, callback: (err: Error) => void }
        uncaught.clearTimeout()
        uncaught.callback(new Error('uncaught'))
        await first
        expectAfterHookBeforeMochaDone(await run(() => sleep(1000), { ctx }), 300)
    })

    it('runs afterTest of a test that Mocha ended on an uncaught error, at its timeout', async () => {
        const first = run(() => new Promise(() => {}))
        await sleep(10)
        const ctxRunnable = lastRunnable as unknown as { clearTimeout: () => void, callback: (err: Error) => void }
        ctxRunnable.clearTimeout()
        ctxRunnable.callback(new Error('uncaught'))
        const { err, at, afterPassedNow } = await first
        expect(err?.message).toBe('uncaught')
        expect(at.afterHookEnd).toBeUndefined()
        await sleep(450)
        expect(afterPassedNow()).toBe(false)
        expect(at.afterHookEnd).toBeDefined()
    })

    it('counts the time of beforeTest, as Mocha does', async () => {
        expectAfterHookBeforeMochaDone(await run(() => sleep(1000), { beforeTestTime: 100 }), 300)
    })

    it('follows this.timeout() when a test makes its timeout shorter', async () => {
        expectAfterHookBeforeMochaDone(await run(async function () {
            await sleep(50)
            this.timeout(150)
            await sleep(1000)
        }), 150)
    })

    it('follows this.timeout() when a test turns its timeout off and on again', async () => {
        expectAfterHookBeforeMochaDone(await run(async function () {
            this.timeout(0)
            await sleep(50)
            this.timeout(150)
            await sleep(1000)
        }), 150)
    })

    it('keeps one Mocha timeout for all WebdriverIO retries of a test', async () => {
        let attempt = 0
        expectAfterHookBeforeMochaDone(await run(async () => {
            if (++attempt === 1) {
                await sleep(150)
                throw new Error('first attempt fails')
            }
            await sleep(1000)
        }, { retries: 1 }), 300)
        expect(attempt).toBe(2)
    })

    it('names the WebdriverIO attempt that timed out, for Mocha and afterTest', async () => {
        let attempt = 0
        const result = await run(async () => {
            if (++attempt === 1) {
                throw new Error('first attempt fails')
            }
            await sleep(1000)
        }, { retries: 1 })
        expectAfterHookBeforeMochaDone(result, 300)
        expect(result.err?.message).toMatch(/ \(WDIO attempt 2\/2\)$/)
        expect(result.afterError).toBe(result.err)
    })

    it('keeps the Mocha timeout error of a test without WebdriverIO retries', async () => {
        const result = await run(() => sleep(1000))
        expectAfterHookBeforeMochaDone(result, 300)
        expect(result.err?.message).not.toContain('WDIO attempt')
    })

    it('lets Mocha wait for afterHook after a hook timeout', async () => {
        expectAfterHookBeforeMochaDone(await run(() => sleep(1000), { type: 'Hook' }), 300)
    })

    it('names the WebdriverIO attempt of a hook that timed out, for Mocha and afterHook', async () => {
        let attempt = 0
        const result = await run(async () => {
            if (++attempt === 1) {
                throw new Error('first attempt fails')
            }
            await sleep(1000)
        }, { retries: 1, type: 'Hook' })
        expectAfterHookBeforeMochaDone(result, 300)
        expect(result.err?.message).toMatch(/ \(WDIO attempt 2\/2\)$/)
        expect(result.afterError).toBe(result.err)
    })

    it('passes a test that made its timeout longer', async () => {
        const { err, afterPassed } = await run(async function () {
            this.timeout(1000)
            await sleep(400)
        })
        expect(err).toBeUndefined()
        expect(afterPassed).toBe(true)
    })

    it('passes a test without a timeout', async () => {
        const { err, afterPassed } = await run(() => sleep(400), { timeout: 0 })
        expect(err).toBeUndefined()
        expect(afterPassed).toBe(true)
    })
})

/**
 * `followFrameworkTimer` in `@wdio/utils` replaces these private methods of Mocha and copies
 * what they do. When Mocha changes them, update that copy, then this text.
 */
describe('the Mocha timer that WebdriverIO copies', () => {
    const source = (fn: Function) => fn.toString().replace(/\s+/g, ' ').trim()

    it('is the same as when WebdriverIO copied it', () => {
        const runnable = Mocha.Runnable.prototype as unknown as { resetTimeout: Function, clearTimeout: Function }
        expect(source(runnable.resetTimeout)).toBe(
            'resetTimeout() { var self = this; var ms = this.timeout() || MAX_TIMEOUT; this.clearTimeout(); ' +
            'this.timer = setTimeout(function () { if (self.timeout() === 0) { return; } ' +
            'self.callback(self._timeoutError(ms)); self.timedOut = true; }, ms); }'
        )
        expect(source(runnable.clearTimeout)).toBe('clearTimeout() { clearTimeout(this.timer); }')
    })
})

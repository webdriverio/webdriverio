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
}

/**
 * Run `body` as a real Mocha runnable through WebdriverIO's test wrapper, as
 * `@wdio/mocha-framework` does, and record when the `afterTest` (or
 * `afterHook`) hook ends and when Mocha finishes the runnable.
 */
function run (body: (this: Mocha.Context) => Promise<unknown>, { timeout = 300, beforeTestTime = 0, retries = 0, type = 'Test' }: Scenario = {}) {
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
    runnable.parent = new Mocha.Suite('suite', new Mocha.Context())
    runnable.timeout(timeout)
    runnable.ctx = new Mocha.Context()
    return new Promise<{ err?: Error, at: Record<string, number>, afterPassed?: boolean, afterError?: Error }>((resolve) => {
        runnable.run((err?: Error) => {
            at.mochaDone = Date.now() - start
            resolve({ err, at, afterPassed, afterError })
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

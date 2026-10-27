import { browser, expect } from '@wdio/globals'
import { PARALLEL_FIXTURE_ORIGIN } from '../parallelFixtureServer.js'

/**
 * The two tests run at the same time (`maxParallelContexts: 2`): the second one
 * waits for the mocks of the first, and the first checks its mocks after the
 * second called `mockClearAll()` and `mockRestoreAll()`. `wdio.parallel.conf.ts`
 * mocks `/api/suite-wide` in `beforeSuite`, outside the test windows.
 */
const fetchText = (endpoint: string) => browser.execute(
    (url) => fetch(url, { cache: 'no-store' }).then((response) => response.text()),
    `${PARALLEL_FIXTURE_ORIGIN}/api/${endpoint}`
)

const signal = (label: string) => {
    let resolve!: () => void
    const done = new Promise<void>((r) => { resolve = r })
    const wait = () => Promise.race([
        done,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`timed out waiting for ${label}`)), 30_000))
    ])
    return { resolve, wait }
}
const mocked = signal('the first test to create its mock')
const restored = signal('the second test to restore its mocks')
const respondOptions = { headers: { 'Content-Type': 'text/plain' }, fetchResponse: false }

describe('mocks in parallel mode', () => {
    before(async () => {
        // runs once per test, in the test's window
        const hook = await browser.mock('**/api/hook')
        hook.respond('mocked', respondOptions)
    })

    it('keeps its mocks when another test clears and restores all mocks', async () => {
        const own = await browser.mock('**/api/own')
        own.respond('mocked', respondOptions)
        await browser.url(`${PARALLEL_FIXTURE_ORIGIN}/checkboxes`)
        expect(await fetchText('own')).toBe('mocked')
        mocked.resolve()

        await restored.wait()
        expect(await fetchText('own')).toBe('mocked')
        expect(await fetchText('hook')).toBe('mocked')
        expect(await fetchText('suite-wide')).toBe('mocked')
        expect(own.calls.length).toBe(2)
    })

    it('clears and restores only the mocks of its window', async () => {
        try {
            const own = await browser.mock('**/api/own')
            own.respond('other', respondOptions)
            await browser.url(`${PARALLEL_FIXTURE_ORIGIN}/checkboxes`)
            await mocked.wait()

            await browser.mockClearAll()
            await browser.mockRestoreAll()
            expect(await fetchText('own')).toBe('Not found')
            expect(await fetchText('hook')).toBe('Not found')
            expect(await fetchText('suite-wide')).toBe('mocked')
        } finally {
            restored.resolve()
        }
    })
})

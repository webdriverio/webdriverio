import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'

import implicitWait from '../../src/utils/implicitWait.js'
import { waitedFor } from '../../src/utils/elementNotFound.js'
import { findElementAgain } from '../../src/utils/findElementAgain.js'
import { StrictSelectorError } from '../../src/utils/strictSelectorError.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/utils/findElementAgain.js', async (importOriginal) => ({
    ...await importOriginal<Record<string, unknown>>(),
    findElementAgain: vi.fn()
}))

/**
 * an element without an element id, in a browser
 */
const missing = (waitForExist: () => Promise<unknown>) => ({
    selector: '#missing',
    parent: { isMobile: false },
    waitForExist: vi.fn(waitForExist),
    /**
     * a spy: no check runs after the wait
     */
    isExisting: vi.fn(async () => false)
}) as unknown as WebdriverIO.Element

/**
 * the wait times out: the error of `waitUntil` has the code of a timeout
 */
const notExisting = async () => { throw Object.assign(new Error('element ("#missing") still not existing after 100.5ms'), { code: 'WAIT_UNTIL_TIMEOUT' }) }

/**
 * The implicit wait flags its "element wasn't found" error when the wait for the element
 * ended without it: the element middleware tells the outer layers of a command that the
 * element was waited for (#16072)
 */
describe('implicitWait', () => {
    it('flags the error when the wait ends without the element', async () => {
        const el = missing(notExisting)
        const error = await implicitWait(el, 'getText').then(() => null, (err: Error) => err)
        expect(error?.message).toBe('Can\'t call getText on element with selector "#missing" because element wasn\'t found')
        expect(waitedFor(error)).toBe(true)
        expect(Object.keys(error!)).toEqual([])

    })

    /**
     * a check after the wait would look for the element again, and for a removed parent through
     * the middleware of the parent, which waits for it again (#16072 review)
     */
    it('does not look for the element again after the wait', async () => {
        const el = missing(notExisting)
        await implicitWait(el, 'getText').catch(() => {})
        expect(el.isExisting).not.toHaveBeenCalled()
        expect(el.waitForExist).toHaveBeenCalledTimes(1)
    })

    /**
     * a poll that throws (a closed window) or a session that ends: not a wait that ended without
     * the element (#16077 review)
     */
    it('does not flag the error when the wait failed for another reason than its timeout', async () => {
        for (const reason of ['waitUntil condition failed with the following reason: no such window', 'invalid session id', 'element ("#missing") still not existing after 100ms']) {
            const error = await implicitWait(missing(async () => { throw new Error(reason) }), 'getText').then(() => null, (err: Error) => err)
            expect(error?.message).toBe('Can\'t call getText on element with selector "#missing" because element wasn\'t found')
            expect(waitedFor(error)).toBe(false)
        }
    })

    it('does not flag the error when the element existed and its lookup failed after', async () => {
        vi.mocked(findElementAgain).mockRejectedValueOnce(new Error('Index out of bounds'))
        const error = await implicitWait(missing(async () => true), 'getText').then(() => null, (err: Error) => err)
        expect(error?.message).toContain('because element wasn\'t found')
        expect(waitedFor(error)).toBe(false)
    })

    it('throws a strict-mode violation as it is, without a flag', async () => {
        const strict = new StrictSelectorError('#missing', 2)
        const error = await implicitWait(missing(async () => { throw strict }), 'getText').then(() => null, (err: Error) => err)
        expect(error).toBe(strict)
        expect(waitedFor(error)).toBe(false)
    })

    it('is false for a value that is not an error', () => {
        for (const value of [undefined, null, 'wasn\'t found', 42]) {
            expect(waitedFor(value)).toBe(false)
        }
    })
})

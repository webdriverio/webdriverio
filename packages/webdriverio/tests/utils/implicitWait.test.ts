import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'

import implicitWait, { waitedFor } from '../../src/utils/implicitWait.js'
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
    waitForExist: vi.fn(waitForExist)
}) as unknown as WebdriverIO.Element

const notExisting = async () => { throw new Error('still not existing') }

/**
 * The implicit wait flags its "element wasn't found" error when the wait for the element
 * ended without it: the element middleware tells the outer layers of a command that the
 * element was waited for (#16072)
 */
describe('implicitWait', () => {
    it('flags the error when the wait ends without the element', async () => {
        const error = await implicitWait(missing(notExisting), 'getText').then(() => null, (err: Error) => err)
        expect(error?.message).toBe('Can\'t call getText on element with selector "#missing" because element wasn\'t found')
        expect(waitedFor(error)).toBe(true)
        expect(Object.keys(error!)).toEqual([])
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

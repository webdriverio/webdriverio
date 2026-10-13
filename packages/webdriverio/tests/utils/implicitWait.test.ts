import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'

import implicitWait from '../../src/utils/implicitWait.js'
import { findElementAgain } from '../../src/utils/findElementAgain.js'
import { StrictSelectorError } from '../../src/utils/strictSelectorError.js'
import { enterCommand, leaveCommand, isMarkedNotFound, waitedFor } from '../../src/utils/elementLookup.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../src/utils/findElementAgain.js', async (importOriginal) => ({
    ...await importOriginal<Record<string, unknown>>(),
    findElementAgain: vi.fn()
}))

/**
 * an element without an element id, in a browser
 */
const missing = (waitForExist: () => Promise<unknown>, isExisting: () => Promise<boolean> = async () => false) => ({
    selector: '#missing',
    parent: { isMobile: false },
    waitForExist: vi.fn(waitForExist),
    isExisting: vi.fn(isExisting)
}) as unknown as WebdriverIO.Element

const notExisting = async () => { throw new Error('still not existing') }

/**
 * The implicit wait flags its "element wasn't found" error and marks the element when the
 * wait for the element ended and the element is still missing: the element middleware
 * does not wait for it again (#16072)
 */
describe('implicitWait', () => {
    it('flags the error and marks the element when the wait ends and the element is still missing', async () => {
        const el = missing(notExisting)
        const layer = enterCommand(el)
        try {
            const error = await implicitWait(el, 'getText').then(() => null, (err: Error) => err)
            expect(error?.message).toBe('Can\'t call getText on element with selector "#missing" because element wasn\'t found')
            expect(waitedFor(error)).toBe(true)
            expect(isMarkedNotFound(el)).toBe(true)
        } finally {
            leaveCommand(el, layer)
        }
    })

    it('does not flag the error when the element exists after the wait', async () => {
        const el = missing(notExisting, async () => true)
        const layer = enterCommand(el)
        try {
            const error = await implicitWait(el, 'getText').then(() => null, (err: Error) => err)
            expect(error?.message).toContain('because element wasn\'t found')
            expect(waitedFor(error)).toBe(false)
            expect(isMarkedNotFound(el)).toBe(false)
        } finally {
            leaveCommand(el, layer)
        }
    })

    it('does not flag the error when the element existed and its lookup failed after', async () => {
        vi.mocked(findElementAgain).mockRejectedValueOnce(new Error('Index out of bounds'))
        const el = missing(async () => true)
        const error = await implicitWait(el, 'getText').then(() => null, (err: Error) => err)
        expect(error?.message).toContain('because element wasn\'t found')
        expect(waitedFor(error)).toBe(false)
        expect(el.isExisting).not.toHaveBeenCalled()
    })

    it('keeps the error when the existence check fails', async () => {
        const el = missing(notExisting, async () => { throw new Error('session deleted') })
        const error = await implicitWait(el, 'getText').then(() => null, (err: Error) => err)
        expect(error?.message).toBe('Can\'t call getText on element with selector "#missing" because element wasn\'t found')
        expect(waitedFor(error)).toBe(false)
    })

    it('keeps the error when the existence check throws at once', async () => {
        const el = missing(notExisting, () => { throw new TypeError('isExisting is not a function') })
        const error = await implicitWait(el, 'getText').then(() => null, (err: Error) => err)
        expect(error?.message).toBe('Can\'t call getText on element with selector "#missing" because element wasn\'t found')
        expect(waitedFor(error)).toBe(false)
    })

    it('throws a strict-mode violation as it is, without a flag', async () => {
        const strict = new StrictSelectorError('#missing', 2)
        const error = await implicitWait(missing(async () => { throw strict }), 'getText').then(() => null, (err: Error) => err)
        expect(error).toBe(strict)
        expect(waitedFor(error)).toBe(false)
    })
})

import path from 'node:path'

import { ELEMENT_KEY } from 'webdriver'
import { describe, it, afterEach, beforeEach, expect, vi } from 'vitest'

import { remote } from '../src/index.js'
import { StrictSelectorError } from '../src/utils/strictMode.js'
import { SHIPPED_STRICT_SELECTORS_DEFAULT } from '../../../tests/setup/strictSelectors.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const SINGLE_MATCH = [{ [ELEMENT_KEY]: 'some-elem-123' }]
const MULTIPLE_MATCHES = [
    { [ELEMENT_KEY]: 'some-elem-123' },
    { [ELEMENT_KEY]: 'some-elem-456' },
    { [ELEMENT_KEY]: 'some-elem-789' },
]

/**
 * the unit test bootstrap flips `strictSelectors` off for the existing test
 * suite, so strict mode has to be opted into explicitly here
 */
const strictSession = () => remote({
    baseUrl: 'http://foobar.com',
    strictSelectors: true,
    capabilities: { browserName: 'foobar' }
})

const matches = (value: unknown[]) =>
    vi.mocked(fetch).customResponseFor(/\/elements$/, { value })

describe('strict selectors', () => {
    beforeEach(() => {
        vi.mocked(fetch).mockClear()
    })

    afterEach(() => {
        vi.mocked(fetch).resetCustomResponses()
    })

    it('ships enabled by default', () => {
        expect(SHIPPED_STRICT_SELECTORS_DEFAULT).toBe(true)
    })

    it('is passed on to the browser options', async () => {
        const browser = await strictSession()
        expect(browser.options.strictSelectors).toBe(true)
    })

    it('returns the element if the selector matches exactly one element', async () => {
        matches(SINGLE_MATCH)
        const browser = await strictSession()

        const elem = await browser.$('#foo')
        expect(elem.elementId).toBe('some-elem-123')
        expect(elem.error).toBeUndefined()
    })

    it('throws if the selector matches multiple elements', async () => {
        matches(MULTIPLE_MATCHES)
        const browser = await strictSession()

        const err = await browser.$('button').catch((e: Error) => e)
        expect(err).toBeInstanceOf(StrictSelectorError)
        expect((err as StrictSelectorError).matches).toBe(3)
        expect((err as Error).message).toContain('strict mode violation')
        expect((err as Error).message).toContain('$("button")')
        expect((err as Error).message).toContain('resolved to 3 elements')
        expect((err as Error).message).toContain('$$("button")')
        expect((err as Error).message).toContain('strict: false')
        expect((err as Error).message).toContain('strictSelectors: false')
    })

    it('does not throw for zero matches but flags the element as not found', async () => {
        matches([])
        const browser = await strictSession()

        const elem = await browser.$('#does-not-exist')
        expect(elem.elementId).toBeUndefined()
        expect(elem.error?.message).toContain('Couldn\'t find element with selector "#does-not-exist"')
    })

    it('is strict at every step of a chain', async () => {
        matches(SINGLE_MATCH)
        const browser = await strictSession()
        const parent = await browser.$('#foo')

        matches(MULTIPLE_MATCHES)
        const err = await parent.$('div').catch((e: Error) => e)
        expect(err).toBeInstanceOf(StrictSelectorError)
    })

    it('does not affect $$', async () => {
        matches(MULTIPLE_MATCHES)
        const browser = await strictSession()

        const elems = await browser.$$('button')
        expect(elems).toHaveLength(3)
    })

    it('can be opted out of per call', async () => {
        matches(MULTIPLE_MATCHES)
        const browser = await strictSession()

        const elem = await browser.$('button', { strict: false })
        expect(elem.elementId).toBe('some-elem-123')
    })

    it('can be opted into per call when disabled globally', async () => {
        matches(MULTIPLE_MATCHES)
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            strictSelectors: false,
            capabilities: { browserName: 'foobar' }
        })

        await expect(browser.$('button', { strict: true })).rejects.toThrow(StrictSelectorError)
        await expect(browser.$('button')).resolves.toBeDefined()
    })

    it('can be disabled globally', async () => {
        matches(MULTIPLE_MATCHES)
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            strictSelectors: false,
            capabilities: { browserName: 'foobar' }
        })

        const elem = await browser.$('button')
        expect(elem.elementId).toBe('some-elem-123')
    })

    it('does not apply to element references', async () => {
        matches(MULTIPLE_MATCHES)
        const browser = await strictSession()

        const elem = await browser.$({ [ELEMENT_KEY]: 'some-elem-123' } as never)
        expect(elem.elementId).toBe('some-elem-123')
    })

    it('forwards a per-call opt-out through the browser runner bridge', async () => {
        matches(SINGLE_MATCH)
        const browser = await strictSession()
        const parent = await browser.$('#foo')

        const execute = vi.fn().mockResolvedValue({ [ELEMENT_KEY]: 'some-elem-123' })
        const executeWithScope = vi.fn().mockResolvedValue({ [ELEMENT_KEY]: 'some-elem-123' })
        const previous = (globalThis as { wdio?: unknown }).wdio
        ;(globalThis as { wdio?: unknown }).wdio = { execute, executeWithScope }

        try {
            await browser.$('button', { strict: false })
            expect(execute).toHaveBeenCalledWith('$', 'button', { strict: false })

            await parent.$('button', { strict: false })
            expect(executeWithScope).toHaveBeenCalledWith('$', 'some-elem-123', 'button', { strict: false })
        } finally {
            ;(globalThis as { wdio?: unknown }).wdio = previous
        }
    })

    it('surfaces a strict violation that appears while implicitly waiting', async () => {
        matches([])
        const browser = await strictSession()

        /**
         * the element does not exist yet, so no violation on the first query
         */
        const elem = await browser.$('button')
        expect(elem.elementId).toBeUndefined()

        /**
         * by the time a command implicitly waits for it, multiple elements match -
         * the strict violation must not be masked as a generic "not found" error
         */
        matches(MULTIPLE_MATCHES)
        const err = await elem.click().catch((e: Error) => e)
        expect(err).toBeInstanceOf(StrictSelectorError)
        expect((err as Error).message).not.toContain('wasn\'t found')
    })

    it('remembers the strictness of an element so re-fetching keeps working', async () => {
        matches(MULTIPLE_MATCHES)
        const browser = await strictSession()

        const strictElem = await browser.$('#foo', { strict: false })
        expect(strictElem.strict).toBe(false)

        matches(SINGLE_MATCH)
        const elem = await browser.$('#foo')
        expect(elem.strict).toBe(true)

        const elems = await browser.$$('#foo')
        expect(elems[0].strict).toBe(false)
    })
})

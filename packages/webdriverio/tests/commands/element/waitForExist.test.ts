import path from 'node:path'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

import { remote } from '../../../src/index.js'
import { bidiGetTagName, isBidiCommandsEnabled } from '../../../src/utils/bidi/elementCommands.js'

vi.mock('fetch')
vi.mock('../../../src/utils/bidi/elementCommands.js', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return { ...actual, isBidiCommandsEnabled: vi.fn(() => false), bidiGetTagName: vi.fn() }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('waitForExists', () => {
    const timeout = 1000
    let browser: WebdriverIO.Browser

    beforeEach(async () => {
        vi.mocked(fetch).mockClear()

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should use default waitFor options', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForExist: tmpElem.waitForExist,
            waitUntil: vi.fn(),
            options: { waitforInterval: 5, waitforTimeout: timeout }
        } as unknown as WebdriverIO.Element

        await elem.waitForExist()
        expect(vi.mocked(elem.waitUntil).mock.calls).toMatchSnapshot()
    })

    it('should allow to set custom error', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForExist: tmpElem.waitForExist,
            waitUntil: vi.fn(),
            options: { waitforInterval: 5, waitforTimeout: timeout }
        } as unknown as WebdriverIO.Element

        await elem.waitForExist({
            timeout,
            reverse: true,
            timeoutMsg: 'my custom error'
        })
        expect(vi.mocked(elem.waitUntil).mock.calls).toMatchSnapshot()
    })

    it('should maintain elementId for shadow element', async () => {
        const elem = await browser.$('#foo')
        const shadowElem = await elem.shadow$('#bar')
        const isExistingSpy = vi.spyOn(shadowElem, 'isExisting').mockResolvedValue(true)

        expect(shadowElem.elementId).toBe('some-shadow-sub-elem-321')
        await shadowElem.waitForExist({ timeout })
        expect(shadowElem.elementId).toBe('some-shadow-sub-elem-321')
        expect(isExistingSpy).toHaveBeenCalledTimes(1)
    })

    it('should not swap elementId for indexed elements returned from $$', async () => {
        const elems = await browser.$$('iframe')
        const elem = elems[1]

        vi.spyOn(elem, 'isExisting').mockResolvedValue(true)
        vi.spyOn(elem, 'waitUntil').mockImplementation(async (cond) => cond())

        const $$Spy = vi.spyOn(browser, '$$')
        const $Spy = vi.spyOn(browser, '$')

        expect(elem.index).toBe(1)
        expect(elem.elementId).toBe('some-elem-456')

        await elem.waitForExist({ timeout })

        expect(elem.elementId).toBe('some-elem-456')
        expect($Spy).not.toHaveBeenCalled()
    })

    it('should not swap elementId for indexed elements returned from $$ when accessed via chainable index', async () => {
        const $$Spy = vi.spyOn(browser, '$$')
        const $Spy = vi.spyOn(browser, '$')

        const elem = await browser.$$('iframe')[1]

        vi.spyOn(elem, 'isExisting').mockResolvedValue(true)
        vi.spyOn(elem, 'waitUntil').mockImplementation(async (cond) => cond())

        expect(elem.index).toBe(1)
        expect(elem.elementId).toBe('some-elem-456')

        await elem.waitForExist({ timeout })

        expect(elem.elementId).toBe('some-elem-456')
        expect($Spy).not.toHaveBeenCalled()
    })

    /**
     * a command on an element that appears later: the implicit wait polls until it exists,
     * then the element is looked up once to get its id, and the command runs (#16415)
     */
    describe('in the implicit wait of an element command', () => {
        const fetchImpl = vi.mocked(fetch).getMockImplementation()!

        afterEach(() => {
            vi.mocked(fetch).mockImplementation(fetchImpl)
        })

        it.each([
            { strictSelectors: true, lookup: 'elements' },
            { strictSelectors: false, lookup: 'element' }
        ])('looks the element up once after the poll that found it (strictSelectors: $strictSelectors)', async ({ strictSelectors, lookup }) => {
            const ELEMENT_KEY = 'element-6066-11e4-a52e-4f735466cecf'
            let lookups = 0
            vi.mocked(fetch).mockImplementation((async (uri: URL, params: RequestInit) => {
                const body = params?.body ? JSON.parse(params.body as string) : undefined
                if (/\/elements?$/.test(uri.pathname) && body?.value === '#late') {
                    /**
                     * the third lookup is the first one that finds the element
                     */
                    const found = ++lookups >= 3
                    if (uri.pathname.endsWith('/elements')) {
                        return Response.json({ value: found ? [{ [ELEMENT_KEY]: 'late-elem-1' }] : [] })
                    }
                    return found
                        ? Response.json({ value: { [ELEMENT_KEY]: 'late-elem-1' } })
                        : Response.json({ value: { error: 'no such element', message: 'no such element', stacktrace: '' } }, { status: 404 })
                }
                return fetchImpl(uri, params)
            }) as typeof fetch)

            const browser = await remote({
                baseUrl: 'http://foobar.com',
                strictSelectors,
                waitforInterval: 1,
                waitforTimeout: timeout,
                capabilities: { browserName: 'foobar' }
            })
            const elem = await browser.$('#late')
            expect(elem.elementId).toBeUndefined()
            vi.mocked(fetch).mockClear()

            await elem.click()

            const paths = vi.mocked(fetch).mock.calls
                .map(([uri]) => (uri as URL).pathname.split('/').slice(3).join('/'))
            /**
             * a poll without the element, the poll that finds it, and the `$` lookup of
             * `waitForExist` that gives the element its id. The implicit wait does not look
             * the element up again
             */
            expect(paths).toEqual(['elements', 'elements', lookup, 'element/late-elem-1/click'])
            expect(elem.elementId).toBe('late-elem-1')
        })
    })

    describe('with BiDi commands enabled', () => {
        afterEach(() => {
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(false)
        })

        it('validates the current element id through BiDi', async () => {
            const browser = await remote({ baseUrl: 'http://foobar.com', capabilities: { browserName: 'foobar' } })
            vi.mocked(bidiGetTagName).mockReset().mockResolvedValue('div')
            const elem = await browser.$('#foo')
            vi.mocked(fetch).mockClear()
            vi.mocked(isBidiCommandsEnabled).mockReturnValue(true)
            expect(await elem.waitForExist({ timeout })).toBe(true)
            expect(bidiGetTagName).toHaveBeenCalled()
            expect(vi.mocked(fetch).mock.calls.map(([url]) => (url as URL).pathname).filter((p) => p.endsWith('/name'))).toEqual([])
        })
    })
})

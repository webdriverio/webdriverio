import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { findElementAgain } from '../../../src/utils/findElementAgain.js'
import { StrictSelectorError } from '../../../src/utils/strictSelectorError.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../../../src/utils/findElementAgain.js', async (importOriginal) => {
    const actual = (await importOriginal()) as { findElementAgain: typeof findElementAgain }
    return { ...actual, findElementAgain: vi.fn(actual.findElementAgain) }
})

describe('isEqual test', () => {
    let browser: WebdriverIO.Browser
    let elem: any

    describe('web', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
            elem = await browser.$('#foo')
            vi.mocked(fetch).mockClear()
        })

        it('should return true if elements are equal', async () => {
            expect(await elem.isEqual(elem)).toBe(true)
        })

        it('should return false if elements are NOT equal', async () => {
            const elements = await browser.$$('#bar')
            expect(await elem.isEqual(elements[1])).toBe(false)
        })

        /**
         * an element that the page rendered again: the script gets the removed node in BiDi, the
         * driver throws a stale element error in Classic
         */
        describe('an element that the page rendered again', () => {
            const stale = () => Object.assign(
                new Error('stale element reference: element is not attached to the page document'),
                { name: 'stale element reference' }
            )

            afterEach(() => {
                vi.mocked(findElementAgain).mockClear()
                if (vi.isMockFunction(browser.execute)) {
                    (browser.execute as ReturnType<typeof vi.fn>).mockRestore()
                }
            })

            it('the compare script throws a stale element error for an element that is not on the page', async () => {
                const execute = vi.spyOn(browser, 'execute')
                await elem.isEqual(elem)
                const script = execute.mock.calls.map(([fn]) => fn).find((fn) => String(fn).includes('isSameElement')) as unknown as (a: unknown, b: unknown) => boolean
                const removed = { isConnected: false, ownerDocument: {} }
                const onPage = { isConnected: true, ownerDocument: { defaultView: {} } }
                ;(onPage.ownerDocument.defaultView as { document: unknown }).document = onPage.ownerDocument

                expect(() => script(removed, onPage)).toThrow('stale element reference')
                expect(() => script(onPage, removed)).toThrow('stale element reference')
                expect(script(onPage, onPage)).toBe(true)
            })

            /**
             * the page rendered `elements` again: a script that gets one of them throws a stale element error
             */
            const renderedAgain = (...elements: unknown[]) => vi.spyOn(browser, 'execute').mockImplementation(
                (async (_script: unknown, ...args: unknown[]) => {
                    if (args.some((arg) => elements.includes(arg))) {
                        throw stale()
                    }
                    return true
                }) as never
            )

            it('finds again only the stale element, without a wait, and compares it with the other one', async () => {
                const execute = renderedAgain(elem)
                const other = await browser.$('#other')
                const found = await browser.$('#found')
                vi.mocked(findElementAgain).mockResolvedValueOnce(found)

                expect(await elem.isEqual(other)).toBe(true)
                expect(findElementAgain).toHaveBeenCalledWith(elem, { parent: browser })
                expect(findElementAgain).not.toHaveBeenCalledWith(other, expect.anything())
                expect(execute).toHaveBeenLastCalledWith(expect.any(Function), found, other)
            })

            it('finds a stale element again once when it is compared with itself', async () => {
                const execute = renderedAgain(elem)
                const found = await browser.$('#found')
                vi.mocked(findElementAgain).mockResolvedValueOnce(found)

                expect(await elem.isEqual(elem)).toBe(true)
                expect(vi.mocked(findElementAgain).mock.calls.filter(([element]) => element === elem)).toHaveLength(1)
                expect(execute).toHaveBeenLastCalledWith(expect.any(Function), found, found)
            })

            it('gives false when an element is not on the page any more', async () => {
                const execute = renderedAgain(elem)
                const gone = await browser.$('#gone')
                gone.elementId = undefined as unknown as string
                vi.mocked(findElementAgain).mockResolvedValueOnce(gone)

                expect(await elem.isEqual(elem)).toBe(false)
                expect(execute).not.toHaveBeenCalledWith(expect.any(Function), gone, expect.anything())
            })

            it('sends up a strict mode error of the lookup', async () => {
                renderedAgain(elem)
                vi.mocked(findElementAgain).mockRejectedValueOnce(new StrictSelectorError('#foo', 2))

                await expect(elem.isEqual(elem)).rejects.toThrow(StrictSelectorError)
            })

            it('keeps an element that has no selector to find it again (an element reference)', async () => {
                const execute = renderedAgain(elem)
                const ref = await browser.$({ 'element-6066-11e4-a52e-4f735466cecf': 'ref-id' } as unknown as string)

                expect(await elem.isEqual(ref)).toBe(true)
                expect(execute).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({ selector: '#foo' }), ref)
            })

            it('finds the parents again from the browser, without a wait', async () => {
                const child = await browser.$('#parent').$('#child')
                renderedAgain(child)

                expect(await child.isEqual(child)).toBe(true)
                expect(findElementAgain).toHaveBeenCalledWith(child.parent, { parent: browser })
                expect(findElementAgain).toHaveBeenCalledWith(child, { parent: expect.objectContaining({ selector: '#parent' }) })
            })

            it('gives false at once when a parent is not on the page any more', async () => {
                const child = await browser.$('#parent').$('#child')
                renderedAgain(child)
                const gone = await browser.$('#gone')
                gone.elementId = undefined as unknown as string
                vi.mocked(findElementAgain).mockResolvedValueOnce(gone)

                expect(await child.isEqual(elem)).toBe(false)
                expect(findElementAgain).not.toHaveBeenCalledWith(child)
                expect(findElementAgain).not.toHaveBeenCalledWith(child, expect.anything())
            })
        })

        it('should return false if execute command fails', async () => {
            const execute = browser.execute
            // @ts-ignore remove command to make it fail
            delete browser.execute
            expect(await elem.isEqual(elem)).toBe(false)
            browser.execute = execute
        })
    })

    describe('mobile', () => {
        beforeAll(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    // @ts-ignore mock feature
                    mobileMode: true,
                    browserName: 'foobar'
                } as any
            })
            elem = await browser.$('#foo')
            vi.mocked(fetch).mockClear()
        })

        it('should return true if elements are equal', async () => {
            // @ts-ignore mock feature
            vi.mocked(fetch).setMockResponse(['NATIVE_APP'])
            expect(await elem.isEqual(elem)).toBe(true)
        })

        it('should return false if elements are NOT equal', async () => {
            const elements = await browser.$$('#bar')
            // @ts-ignore mock feature
            vi.mocked(fetch).setMockResponse(['NATIVE_APP'])
            expect(await elem.isEqual(elements[1])).toBe(false)
        })

        it('should call execute if in webview', async () => {
            // @ts-ignore mock feature
            vi.mocked(fetch).setMockResponse(['WEBVIEW'])
            const execute = browser.execute
            // @ts-ignore remove command to make it fail
            delete browser.execute
            browser.execute = vi.fn().mockReturnValue(true)

            expect(await elem.isEqual(elem)).toBe(true)
            expect(browser.execute).toBeCalled()

            // @ts-ignore remove command to make it fail
            delete browser.execute
            browser.execute = execute
        })
    })

    afterEach(() => {
        vi.mocked(fetch).mockClear()
    })
})

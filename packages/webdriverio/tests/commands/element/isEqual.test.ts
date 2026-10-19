import path from 'node:path'
import { expect, describe, it, beforeAll, afterEach, vi } from 'vitest'

import { remote } from '../../../src/index.js'
import { findElementAgain } from '../../../src/utils/findElementAgain.js'

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
                const [script] = execute.mock.calls[0] as unknown as [(a: unknown, b: unknown) => boolean]
                const removed = { isConnected: false, ownerDocument: {} }
                const onPage = { isConnected: true, ownerDocument: { defaultView: {} } }
                ;(onPage.ownerDocument.defaultView as { document: unknown }).document = onPage.ownerDocument

                expect(() => script(removed, onPage)).toThrow('stale element reference')
                expect(() => script(onPage, removed)).toThrow('stale element reference')
                expect(script(onPage, onPage)).toBe(true)
            })

            it('looks up both elements again at once and compares them again', async () => {
                const execute = vi.spyOn(browser, 'execute').mockRejectedValueOnce(stale()).mockResolvedValueOnce(true)

                expect(await elem.isEqual(elem)).toBe(true)
                expect(execute).toHaveBeenCalledTimes(2)
                expect(findElementAgain).toHaveBeenCalledWith(elem, { parent: browser })
                expect(findElementAgain).not.toHaveBeenCalledWith(elem, expect.objectContaining({ wait: true }))
            })

            it('gives false when an element is not on the page any more', async () => {
                const execute = vi.spyOn(browser, 'execute').mockRejectedValueOnce(stale())
                const gone = await browser.$('#gone')
                gone.elementId = undefined as unknown as string
                vi.mocked(findElementAgain).mockResolvedValueOnce(gone)

                expect(await elem.isEqual(elem)).toBe(false)
                expect(execute).toHaveBeenCalledTimes(1)
            })

            it('keeps an element that has no selector to find it again (an element reference)', async () => {
                const execute = vi.spyOn(browser, 'execute').mockRejectedValueOnce(stale()).mockResolvedValueOnce(true)
                const ref = await browser.$({ 'element-6066-11e4-a52e-4f735466cecf': 'ref-id' } as unknown as string)

                expect(await elem.isEqual(ref)).toBe(true)
                expect(execute).toHaveBeenLastCalledWith(expect.any(Function), expect.objectContaining({ selector: '#foo' }), ref)
            })

            it('finds the parents again from the browser, without a wait', async () => {
                vi.spyOn(browser, 'execute').mockRejectedValueOnce(stale()).mockResolvedValueOnce(true)
                const child = await browser.$('#parent').$('#child')

                expect(await child.isEqual(child)).toBe(true)
                expect(findElementAgain).toHaveBeenCalledWith(child.parent, { parent: browser })
                expect(findElementAgain).toHaveBeenCalledWith(child, { parent: expect.objectContaining({ selector: '#parent' }) })
            })

            it('gives false at once when a parent is not on the page any more', async () => {
                vi.spyOn(browser, 'execute').mockRejectedValueOnce(stale())
                const child = await browser.$('#parent').$('#child')
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

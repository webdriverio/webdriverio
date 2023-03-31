import path from 'node:path'
import { expect, describe, it, beforeEach, vi } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'

vi.mock('got')
vi.mock('devtools')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../../src/scripts/isElementDisplayed', () => ({
    __esModule: true,
    default: function () { return true }
}))

describe('isDisplayed test', () => {
    let browser: WebdriverIO.Browser
    let elem: WebdriverIO.Element

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
        vi.mocked(got).mockClear()
    })

    it('should allow to check if element is displayed', async () => {
        expect(await elem.isDisplayed()).toBe(true)
        expect(got).toBeCalledTimes(1)
        expect(vi.mocked(got).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/displayed')
    })

    it('should allow to check if element is displayed in mobile mode without browserName', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                // @ts-ignore mock feature
                keepBrowserName: true,
                mobileMode: true
            } as any
        })
        elem = await browser.$('#foo')
        vi.mocked(got).mockClear()
        expect(await elem.isDisplayed()).toBe(true)
        expect(got).toBeCalledTimes(1)
        expect(vi.mocked(got).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/displayed')
    })

    it('should refetch element if non existing', async () => {
        // @ts-ignore test scenario
        delete elem.elementId
        expect(await elem.isDisplayed()).toBe(true)
        expect(got).toBeCalledTimes(2)
        expect(vi.mocked(got).mock.calls[0][0]!.pathname)
            .toBe('/session/foobar-123/element')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/displayed')
    })

    it('should refect React element if non existing', async () => {
        elem = await browser.react$('FooCmp')
        // @ts-ignore test scenario
        delete elem.elementId

        expect(await elem.isDisplayed()).toBe(true)
    })

    it('should return false if element is not existing anymore', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'safari',
                // @ts-ignore mock feature
                keepBrowserName: true
            } as any
        })
        elem = await browser.$('#foo')

        expect(await elem.isDisplayed()).toBe(true)

        elem.selector = '#nonexisting'
        // @ts-ignore mock feature
        vi.mocked(got).setMockResponse([{ error: 'no such element', statusCode: 404 }])

        expect(await elem.isDisplayed()).toBe(false)
    })

    it('should return false if element can\'t be found after refetching it', async () => {
        const elem = await browser.$('#nonexisting')
        expect(await elem.isDisplayed()).toBe(false)
        expect(got).toBeCalledTimes(2)
    })

    describe('isElementDisplayed script', () => {
        it('should be used if safari and w3c', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'safari',
                    // @ts-ignore mock feature
                    keepBrowserName: true
                } as any
            })
            elem = await browser.$('#foo')
            vi.mocked(got).mockClear()

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(vi.mocked(got).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(vi.mocked(got).mock.calls[0][1]!.json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
        it('should be used if stp and w3c', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'safari technology preview',
                    // @ts-ignore mock feature
                    keepBrowserName: true
                } as any
            })
            elem = await browser.$('#foo')
            vi.mocked(got).mockClear()

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(vi.mocked(got).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(vi.mocked(got).mock.calls[0][1]!.json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
        it('should be used if edge and wc3', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'MicrosoftEdge',
                    // @ts-ignore mock feature
                    keepBrowserName: true
                } as any
            })
            elem = await browser.$('#foo')
            vi.mocked(got).mockClear()

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(vi.mocked(got).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(vi.mocked(got).mock.calls[0][1]!.json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
        it('should be used if chrome and wc3', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'chrome',
                    // @ts-ignore mock feature
                    keepBrowserName: true
                } as any
            })
            elem = await browser.$('#foo')
            vi.mocked(got).mockClear()

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(vi.mocked(got).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(vi.mocked(got).mock.calls[0][1]!.json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
        it('should be used if devtools', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'firefox',
                }
            })
            elem = await browser.$('#foo')
            vi.mocked(got).mockClear()
            browser.isDevTools = true

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(vi.mocked(got).mock.calls[0][0]!.pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(vi.mocked(got).mock.calls[0][1]!.json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
    })
})

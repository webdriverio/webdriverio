import got from 'got'
import { remote } from '../../../src'

jest.mock('../../../src/scripts/isElementDisplayed', () => ({
    __esModule: true,
    default: function () { return true }
}))

describe('isDisplayed test', () => {
    let browser
    let elem

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('#foo')
        got.mockClear()
    })

    it('should allow to check if element is displayed', async () => {
        expect(await elem.isDisplayed()).toBe(true)
        expect(got).toBeCalledTimes(1)
        expect(got.mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/displayed')
    })

    it('should allow to check if element is displayed in mobile mode without browserName', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                keepBrowserName: true,
                mobileMode: true
            }
        })
        elem = await browser.$('#foo')
        got.mockClear()
        expect(await elem.isDisplayed()).toBe(true)
        expect(got).toBeCalledTimes(1)
        expect(got.mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/displayed')
    })

    it('should refetch element if non existing', async () => {
        delete elem.elementId
        expect(await elem.isDisplayed()).toBe(true)
        expect(got).toBeCalledTimes(2)
        expect(got.mock.calls[0][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/displayed')
    })

    it('should refect React element if non existing', async () => {
        elem = await browser.react$('FooCmp')

        delete elem.elementId

        expect(await elem.isDisplayed()).toBe(true)
    })

    it('should return false if element is not existing anymore', async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'safari',
                keepBrowserName: true
            }
        })
        elem = await browser.$('#foo')

        expect(await elem.isDisplayed()).toBe(true)

        elem.selector = '#nonexisting'
        got.setMockResponse([{ error: 'no such element', statusCode: 404 }])

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
                    keepBrowserName: true
                }
            })
            elem = await browser.$('#foo')
            got.mockClear()

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(got.mock.calls[0][0].pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(got.mock.calls[0][1].json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
        it('should be used if stp and w3c', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'safari technology preview',
                    keepBrowserName: true
                }
            })
            elem = await browser.$('#foo')
            got.mockClear()

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(got.mock.calls[0][0].pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(got.mock.calls[0][1].json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
        it('should be used if edge and wc3', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'MicrosoftEdge',
                    keepBrowserName: true
                }
            })
            elem = await browser.$('#foo')
            got.mockClear()

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(got.mock.calls[0][0].pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(got.mock.calls[0][1].json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
        it('should be used if chrome and wc3', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'chrome',
                    keepBrowserName: true
                }
            })
            elem = await browser.$('#foo')
            got.mockClear()

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(got.mock.calls[0][0].pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(got.mock.calls[0][1].json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
        it('should be used if devtools', async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'firefox',
                    keepBrowserName: true,
                    mobileMode: true
                }
            })
            elem = await browser.$('#foo')
            got.mockClear()
            browser.isDevTools = true

            expect(await elem.isDisplayed()).toBe(true)
            expect(got).toBeCalledTimes(1)
            expect(got.mock.calls[0][0].pathname)
                .toBe('/session/foobar-123/execute/sync')
            expect(got.mock.calls[0][1].json.args[0]).toEqual({
                'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
                ELEMENT: 'some-elem-123'
            })
        })
    })
})

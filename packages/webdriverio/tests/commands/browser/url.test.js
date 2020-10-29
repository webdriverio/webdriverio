import got from 'got'
import { remote } from '../../../src'

const pageMock = { evaluate: jest.fn().mockReturnValue('visible') }
const puppeteerPages = {
    pages: jest.fn().mockReturnValue([pageMock])
}
describe('url', () => {
    let browser

    beforeAll(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    it('should accept a full url', async () => {
        await browser.url('http://google.com')
        expect(got.mock.calls[1][1].uri.pathname)
            .toBe('/session/foobar-123/url')
        expect(got.mock.calls[1][1].json)
            .toEqual({ url: 'http://google.com/' })
    })

    it('should accept a relative url', async () => {
        await browser.url('/foobar')
        expect(got.mock.calls[0][1].json)
            .toEqual({ url: 'http://foobar.com/foobar' })
    })

    it('should throw an exception when a non-string value passed in path', async () => {
        try {
            expect.assertions(1)
            await browser.url(true)
        } catch (e) {
            expect(e.message).toContain('command needs to be type of string')
        }
    })

    it('should throw an exception when a non-function value passed in inject', async () => {
        try {
            expect.assertions(1)
            await browser.url('/', { inject: 123 })
        } catch (e) {
            expect(e.message).toContain('command needs to be type of function')
        }
    })

    it('should continue the navigation if inject parameter is not passed', async () => {
        browser.puppeteer = puppeteerPages
        await browser.url('/foobar')
        expect(pageMock.evaluate).toBeCalledTimes(0)
        expect(got.mock.calls[0][1].json)
            .toEqual({ url: 'http://foobar.com/foobar' })
    })

    it('should accept an arrow function as the inject parameter', async () => {
        browser.puppeteer = puppeteerPages
        const urlParams = { inject: jest.fn(() => console.log('foo-bar')) }
        await browser.url('/foobar', urlParams)
        expect(pageMock.evaluate).toBeCalledTimes(2)
        expect(got.mock.calls[0][1].json)
            .toEqual({ url: 'http://foobar.com/foobar' })
    })

    it('should accept a normal function as the inject parameter', async () => {
        browser.puppeteer = puppeteerPages
        const urlParams = { inject: jest.fn(function (){ console.log('foo-bar') }) }
        await browser.url('/foobar', urlParams)
        expect(pageMock.evaluate).toBeCalledTimes(2)
        expect(got.mock.calls[0][1].json)
            .toEqual({ url: 'http://foobar.com/foobar' })
    })

    it('should run the intected function only on the visible page', async () => {
        const pageMockInvisible = { evaluate: jest.fn().mockReturnValue('hidden') }
        const puppeteerPagesInvisible = {
            pages: jest.fn().mockReturnValue([pageMockInvisible])
        }
        browser.puppeteer = puppeteerPagesInvisible
        const urlParams = { inject: jest.fn(function (){ console.log('foo-bar') }) }
        await browser.url('/foobar', urlParams)
        expect(pageMockInvisible.evaluate).toBeCalledTimes(1)
        expect(got.mock.calls[0][1].json)
            .toEqual({ url: 'http://foobar.com/foobar' })
    })

    afterEach(() => {
        got.mockClear()
        jest.clearAllMocks()
    })
})

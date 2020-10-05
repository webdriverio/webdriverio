import got from 'got'
import { remote } from '../../../src'

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
            await browser.url(true)
        } catch (e) {
            expect(e.message).toContain('command needs to be type of string')
        }
    })

    it('should throw an exception when a non-function value passed in inject', async () => {
        try {
            await browser.url('/', { inject: 123 })
        } catch (e) {
            expect(e.message).toContain('command needs to be type of function')
        }
    })

    it('should continue the navigation if inject parameter is not passed', async () => {
        await browser.url('/')
        expect(got.mock.calls[0][1].json).toEqual({ url: 'http://foobar.com/' })
    })

    it('should accept an arrow function as the inject parameter', async () => {
        const arrowFunction = jest.fn(() => console.log('foo-bar'))
        await browser.url('/', { inject: arrowFunction })
        expect(got.mock.calls[0][1].json).toEqual({ url: 'http://foobar.com/' })
    })

    it('should accept a normal function as the inject parameter', async () => {
        const arrowFunction = jest.fn(function () { console.log('foo-bar') })
        await browser.url('/', arrowFunction)
        expect(got.mock.calls[0][1].json).toEqual({ url: 'http://foobar.com/' })
    })

    afterEach(() => {
        got.mockClear()
    })
})

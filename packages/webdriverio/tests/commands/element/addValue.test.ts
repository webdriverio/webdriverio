// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as jest.Mock

describe('addValue test', () => {
    describe('should allow to add value to an input element', () => {
        let browser: WebdriverIO.BrowserObject

        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        afterEach(() => {
            got.mockClear()
        })

        it('add string', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue('foobar')
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.text).toEqual('foobar')
            expect(got.mock.calls[2][1].json.value).toEqual(undefined)
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue(42)
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.text).toEqual('42')
            expect(got.mock.calls[2][1].json.value).toEqual(undefined)
        })

        it('add Array<string | number>', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue([2, '3'])
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.text).toEqual('23')
            expect(got.mock.calls[2][1].json.value).toEqual(undefined)
        })
    })

    describe('should allow to add value to an input element using jsonwp', () => {
        let browser: WebdriverIO.BrowserObject

        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar-noW3C'
                }
            })
        })

        afterEach(() => {
            got.mockClear()
        })

        it('add string', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue('foobar')
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.value)
                .toEqual(['f', 'o', 'o', 'b', 'a', 'r'])
            expect(got.mock.calls[2][1].json.text).toEqual(undefined)
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(42)
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.value).toEqual(['4', '2'])
            expect(got.mock.calls[2][1].json.text).toEqual(undefined)
        })

        it('add Array<string | number>', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue([1, '2'])
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.value)
                .toEqual(['1', '2'])
            expect(got.mock.calls[2][1].json.text).toEqual(undefined)
        })
    })

    describe('should allow to add value to an input element as workaround for /webdriverio/issues/4936', () => {
        let browser: WebdriverIO.BrowserObject

        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        afterEach(() => {
            got.mockClear()
        })

        it('add string', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue('Delete', { translateToUnicode: false })
            expect(got.mock.calls[2][0].pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.text).toEqual('Delete')
        })
    })

    describe('when passing invalid types', () => {
        let browser: WebdriverIO.BrowserObject

        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        afterEach(() => {
            got.mockClear()
        })

        it('should throw', async () => {
            const elem = await browser.$('#foo')

            expect(async () => await elem.addValue('{}', { translateToUnicode: false }))
                .rejects
                .toThrowError('Value must be of type "string", "number" or "Array<string | number>"')
        })
    })
})

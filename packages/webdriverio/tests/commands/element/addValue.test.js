import got from 'got'
import { remote } from '../../../src'

describe('addValue test', () => {
    describe('should allow to add value to an input element', () => {
        let browser

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

        it('add object', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue({ a: 42 })
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.text).toEqual('{"a":42}')
            expect(got.mock.calls[2][1].json.value).toEqual(undefined)
        })

        it('add boolean', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue(true)
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.text).toEqual('true')
            expect(got.mock.calls[2][1].json.value).toEqual(undefined)
        })

        it('add Array<any>', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue([2, '3', true, [1, 2]])
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.text).toEqual('23true[1,2]')
            expect(got.mock.calls[2][1].json.value).toEqual(undefined)
        })
    })

    describe('should allow to add value to an input element using jsonwp', () => {
        let browser

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

        it('add object', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue({ a: 42 })
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.value)
                .toEqual(['{', '"', 'a', '"', ':', '4', '2', '}'])
            expect(got.mock.calls[2][1].json.text).toEqual(undefined)
        })

        it('add boolean', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(true)
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.value)
                .toEqual(['t', 'r', 'u', 'e'])
            expect(got.mock.calls[2][1].json.text).toEqual(undefined)
        })

        it('add Array<any>', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue([1, '2', true, [1, 2]])
            expect(got.mock.calls[2][0].pathname)
                .toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.value)
                .toEqual(['1', '2', 't', 'r', 'u', 'e', '[', '1', ',', '2', ']'])
            expect(got.mock.calls[2][1].json.text).toEqual(undefined)
        })
    })

    describe('should allow to add value to an input element as workaround for /webdriverio/issues/4936', () => {
        let browser

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
})

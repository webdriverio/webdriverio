import request from 'request'
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
            request.mockClear()
        })

        it('add string', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue('foobar')
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('foobar')
            expect(request.mock.calls[2][0].body.value).toEqual(undefined)
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue(42)
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('42')
            expect(request.mock.calls[2][0].body.value).toEqual(undefined)
        })

        it('add object', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue({ a: 42 })
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('{"a":42}')
            expect(request.mock.calls[2][0].body.value).toEqual(undefined)
        })

        it('add boolean', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue(true)
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('true')
            expect(request.mock.calls[2][0].body.value).toEqual(undefined)
        })

        it('add Array<any>', async () => {
            const elem = await browser.$('#foo')
            await elem.addValue([2, '3', true, [1, 2]])
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('23true[1,2]')
            expect(request.mock.calls[2][0].body.value).toEqual(undefined)
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
            request.mockClear()
        })

        it('add string', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue('foobar')
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.value).toEqual(['f', 'o', 'o', 'b', 'a', 'r'])
            expect(request.mock.calls[2][0].body.text).toEqual(undefined)
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(42)
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.value).toEqual(['4', '2'])
            expect(request.mock.calls[2][0].body.text).toEqual(undefined)
        })

        it('add object', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue({ a: 42 })
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.value).toEqual(['{', '"', 'a', '"', ':', '4', '2', '}'])
            expect(request.mock.calls[2][0].body.text).toEqual(undefined)
        })

        it('add boolean', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(true)
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.value).toEqual(['t', 'r', 'u', 'e'])
            expect(request.mock.calls[2][0].body.text).toEqual(undefined)
        })

        it('add Array<any>', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue([1, '2', true, [1, 2]])
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.value).toEqual(['1', '2', 't', 'r', 'u', 'e', '[', '1', ',', '2', ']'])
            expect(request.mock.calls[2][0].body.text).toEqual(undefined)
        })
    })

    describe('should allow to add value to an input element as workaround for /appium/issues/12085', () => {
        let browser

        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar',
                    mobileMode: true,
                    'appium-version': '1.13.0'
                }
            })
        })

        afterEach(() => {
            request.mockClear()
        })

        it('add string', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue('foobar')
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('foobar')
            expect(request.mock.calls[2][0].body.value).toEqual(['f', 'o', 'o', 'b', 'a', 'r'])
        })

        it('add number', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(42)
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('42')
            expect(request.mock.calls[2][0].body.value).toEqual(['4', '2'])
        })

        it('add object', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue({ a: 42 })
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('{"a":42}')
            expect(request.mock.calls[2][0].body.value).toEqual(['{', '"', 'a', '"', ':', '4', '2', '}'])
        })

        it('add boolean', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue(true)
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('true')
            expect(request.mock.calls[2][0].body.value).toEqual(['t', 'r', 'u', 'e'])
        })

        it('add Array<any>', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue([1, '2', true, [1, 2]])
            expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
            expect(request.mock.calls[2][0].body.text).toEqual('12true[1,2]')
            expect(request.mock.calls[2][0].body.value).toEqual(['1', '2', 't', 'r', 'u', 'e', '[', '1', ',', '2', ']'])
        })
    })
})

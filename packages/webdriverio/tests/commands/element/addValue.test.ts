// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'
import { DeprecatedWarning } from '../../../../webdriverio/src/utils/DeprecatedWarning'

jest.mock('../../../../webdriverio/src/utils/DeprecatedWarning')

beforeEach(() => {
    (DeprecatedWarning as jest.Mock).mockReset()
})

const got = gotMock as jest.Mock

let browser: WebdriverIO.BrowserObject

describe('addValue test', () => {
    afterEach(() => {
        got.mockClear()
    })

    describe('should allow to add value to an input element', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
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
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar-noW3C'
                }
            })
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
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        it('add string', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue('Delete', { translateToUnicode: false })
            expect(got.mock.calls[2][0].pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[2][1].json.text).toEqual('Delete')
        })
    })

    describe('translate to unicode characters', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        test('should not translate to unicode', async () => {
            const elem = await browser.$('#foo')

            await elem.setValue('Delete', { translateToUnicode: false })
            expect(got.mock.calls[2][0].pathname).toBe('/session/foobar-123/element/some-elem-123/clear')
            expect(got.mock.calls[3][0].pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[3][1].json.text).toEqual('Delete')
        })
        test('should translate to unicode', async () => {
            const elem = await browser.$('#foo')

            await elem.setValue('Delete', { translateToUnicode: true })
            expect(got.mock.calls[2][0].pathname).toBe('/session/foobar-123/element/some-elem-123/clear')
            expect(got.mock.calls[3][0].pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[3][1].json.text).toEqual('\uE017')
        })

        test('should translate to unicode by default', async () => {
            const elem = await browser.$('#foo')

            await elem.setValue('Delete', { translateToUnicode: true })
            expect(got.mock.calls[2][0].pathname).toBe('/session/foobar-123/element/some-elem-123/clear')
            expect(got.mock.calls[3][0].pathname).toBe('/session/foobar-123/element/some-elem-123/value')
            expect(got.mock.calls[3][1].json.text).toEqual('\uE017')
        })
    })

    describe('when passing deprecated types', () => {
        beforeEach(async () => {
            browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    browserName: 'foobar'
                }
            })
        })

        it('should trigger a deprecation warning', async () => {
            const elem = await browser.$('#foo')

            await elem.addValue({ a: 42 }, { translateToUnicode: false })

            expect(DeprecatedWarning).toHaveBeenCalledTimes(1)
            expect(DeprecatedWarning).toHaveBeenCalledWith('Support for values that are not of type "string", "number" or "Array<string | number>" will soon be dropped')
        })
    })
})

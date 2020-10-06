import got from 'got'
import { remote } from '../../../src'

describe('setValue', () => {
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

    test('should set the value clearning the element first', async () => {
        const elem = await browser.$('#foo')

        await elem.setValue('foobar')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/clear')
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/value')
        expect(got.mock.calls[3][1].json.text).toEqual('foobar')
    })

    test('should stringify number', async () => {
        const elem = await browser.$('#boo')
        await elem.setValue(42)
        expect(got.mock.calls[3][1].json.text).toEqual('42')
    })

    test('should stringify object', async () => {
        const elem = await browser.$('#foo')
        await elem.setValue({ a: 22 })
        expect(got.mock.calls[3][1].json.text).toEqual('{"a":22}')
    })

    test('should stringify Array<any>', async () => {
        const elem = await browser.$('#foo')
        await elem.setValue([1, '2', true, [1, 2]])
        expect(got.mock.calls[3][1].json.text).toEqual('12true[1,2]')
    })

    test('should set the value clearning the element first', async () => {
        const elem = await browser.$('#foo')

        await elem.setValue('Delete', { translateToUnicode: false })
        expect(got.mock.calls[2][0].pathname).toBe('/session/foobar-123/element/some-elem-123/clear')
        expect(got.mock.calls[3][0].pathname).toBe('/session/foobar-123/element/some-elem-123/value')
        expect(got.mock.calls[3][1].json.text).toEqual('Delete')
    })
})

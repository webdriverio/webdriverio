import request from 'request'
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
        request.mockClear()
    })

    test('should set the value clearning the element first', async () => {
        const elem = await browser.$('#foo')

        await elem.setValue('foobar')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/clear')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/value')
        expect(request.mock.calls[3][0].body.text).toEqual('foobar')
    })

    test('should stringify number', async () => {
        const elem = await browser.$('#boo')
        await elem.setValue(42)
        expect(request.mock.calls[3][0].body.text).toEqual('42')
    })

    test('should stringify object', async () => {
        const elem = await browser.$('#foo')
        await elem.setValue({ a: 22 })
        expect(request.mock.calls[3][0].body.text).toEqual('{"a":22}')
    })

    test('should stringify Array<any>', async () => {
        const elem = await browser.$('#foo')
        await elem.setValue([1, '2', true, [1, 2]])
        expect(request.mock.calls[3][0].body.text).toEqual('12true[1,2]')
    })
})

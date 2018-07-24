import request from 'request'
import { remote } from '../../../src'

describe('getValue', () => {
    beforeAll(async () => {
        request.mockClear()
    })

    test('should get the value using getElementProperty', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#foo')

        await elem.getValue()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/property/value')
    })

    test('should get the value using getElementAttribute', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar-noW3C'
            }
        })

        const tmp = await browser.$('#foo')
        const elem = {
            elementId : 123,
            getValue : tmp.getValue,
            getElementAttribute : jest.fn(),
        }

        await elem.getValue()

        expect(elem.getElementAttribute).toBeCalledWith(elem.elementId, 'value')
    })
})
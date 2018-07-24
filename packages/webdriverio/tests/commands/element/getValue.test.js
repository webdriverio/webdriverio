import request from 'request'
import { remote } from '../../../src'

describe('getValue', () => {
    let browser

    beforeAll(async () => {
        request.mockClear()

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    test('should get the value using getElementProperty', async () => {
        const elem = await browser.$('#foo')

        await elem.getValue()
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/property/value')
        expect(request.mock.calls[3]).toBeFalsy()
    })

    test('should get the value using getElementAttribute', async () => {
        const tmp = await browser.$('#foo')
        const elem = {
            elementId : 123,
            getValue : tmp.getValue,
            getElementProperty : jest.fn(() => {
                throw {
                    message : 'this.getElementProperty is not a function',
                }
            }),
            getElementAttribute : jest.fn(),
        }

        await elem.getValue()

        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/property/value')
        expect(elem.getElementAttribute).toBeCalledWith(elem.elementId, 'value')
    })

    test('should throw a regular error and not call getElementAttribute', async () => {
        const tmp = await browser.$('#foo')
        const elem = {
            elementId : 123,
            getValue : tmp.getValue,
            getElementProperty : jest.fn(() => {
                throw {
                    message : 'foo'
                }
            }),
            getElementAttribute : jest.fn(),
        }

        try {
            await elem.getValue()
        } catch (error) {
            expect(elem.getElementAttribute).not.toBeCalled()
            expect(error.message).toBe('foo')
        }
    })
})
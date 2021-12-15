// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'

const got = gotMock as any as jest.Mock

describe('getCSSProperty test', () => {
    it('should allow to get the css property of an element', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('width')

        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/css/width')
        expect(property.value).toBe('1250px')
        expect(property.parsed.value).toBe(1250)
    })

    it('should merge equal symmetrical values', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const property = await elem.getCSSProperty('padding')

        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/css/padding-top')
        expect(property.value).toBe('4px 2px')
    })

    afterEach(() => {
        got.mockClear()
    })
})

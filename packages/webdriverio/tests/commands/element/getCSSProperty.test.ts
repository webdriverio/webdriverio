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

    it('should expand shorthand property and fetch for all', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        const elem = await browser.$('#foo')
        const margin = await elem.getCSSProperty('margin')
        expect(margin.value).toBe('42px')
        expect(margin.parsed.value).toBe(42)

        const padding = await elem.getCSSProperty('padding')
        expect(padding.value).toBe('4px 2px')
        expect(padding.parsed.length).toBe(2)
        expect(padding.parsed[0].value).toBe(4)
        expect(padding.parsed[1].value).toBe(2)
    })

    afterEach(() => {
        got.mockClear()
    })
})

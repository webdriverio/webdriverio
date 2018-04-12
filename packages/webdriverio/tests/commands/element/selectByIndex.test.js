import request from 'request'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'
import * as utils from '../../../src/utils'

describe('selectByIndex test', () => {
    const getElementFromResponseSpy = jest.spyOn(utils, 'getElementFromResponse')
    let browser
    let elem

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        elem = await browser.$('some-elem-123')
    })

    afterEach(() => {
        request.mockClear()
    })

    it('should select by index', async () => {
        await elem.selectByIndex(1)

        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/elements')
        expect(request.mock.calls[3][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-456/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-elem-456'
        })
    })

    it('should throw an error when index < 0', async () => {
        expect.hasAssertions()
        try {
            await elem.selectByIndex(-2)
        } catch (e) {
            expect(e.toString()).toBe('Error: Index needs to be 0 or any other positive number')
        }
    })
})

import got from 'got'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'
import * as utils from '../../../src/utils'

describe('selectByAttribute test', () => {
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
        got.mockClear()
        getElementFromResponseSpy.mockClear()
    })

    it('should select value by attribute when value is string', async () => {
        await elem.selectByAttribute('value', ' someValue1 ')

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json.value)
            .toBe('./option[normalize-space(@value) = "someValue1"]|./optgroup/option[normalize-space(@value) = "someValue1"]')
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by attribute when value is number', async () => {
        await elem.selectByAttribute('value', 123)

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json.value)
            .toBe('./option[normalize-space(@value) = "123"]|./optgroup/option[normalize-space(@value) = "123"]')
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should throw if option is not found', async () => {
        expect.hasAssertions()

        const mockElem = {
            selector: 'foobar2',
            elementId: 'some-elem-123',
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            findElementFromElement: jest.fn().mockReturnValue(Promise.resolve({ error: 'no such element' }))
        }
        mockElem.selectByAttribute = elem.selectByAttribute.bind(mockElem)

        try {
            await mockElem.selectByAttribute('value', 'non-existing-value')
        } catch (e) {
            expect(e.toString()).toBe('Error: Option with attribute "value=non-existing-value" not found.')
        }
    })
})

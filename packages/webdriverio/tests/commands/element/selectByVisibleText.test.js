import got from 'got'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'
import * as utils from '../../../src/utils'

describe('selectByVisibleText test', () => {
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

    it('should select value by visible text', async () => {
        await elem.selectByVisibleText(' someValue1 ')
        const optionSelection = './option[. = "someValue1"]|./option[normalize-space(text()) = "someValue1"]'
        const optgroupSelection = './optgroup/option[. = "someValue1"]|./optgroup/option[normalize-space(text()) = "someValue1"]'

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json.value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by visible text with spaces', async () => {
        await elem.selectByVisibleText('some Value1')
        const optionSelection = './option[. = "some Value1"]|./option[normalize-space(text()) = "some Value1"]'
        const optgroupSelection = './optgroup/option[. = "some Value1"]|./optgroup/option[normalize-space(text()) = "some Value1"]'

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json.value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by visible text with leading and trailing white-space', async () => {
        await elem.selectByVisibleText(' someValue1 ')
        const optionSelection = './option[. = "someValue1"]|./option[normalize-space(text()) = "someValue1"]'
        const optgroupSelection = './optgroup/option[. = "someValue1"]|./optgroup/option[normalize-space(text()) = "someValue1"]'

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json.value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by visible text with sequences of whitespace characters', async () => {
        await elem.selectByVisibleText('some    Value1')
        const optionSelection = './option[. = "some Value1"]|./option[normalize-space(text()) = "some Value1"]'
        const optgroupSelection = './optgroup/option[. = "some Value1"]|./optgroup/option[normalize-space(text()) = "some Value1"]'

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json.value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should select value by visible text with quotes', async () => {
        await elem.selectByVisibleText('"someValue1""')
        const optionSelection = './option[. = concat("", \'"\', "someValue1", \'"\', "", \'"\', "")]|./option[normalize-space(text()) = concat("", \'"\', "someValue1", \'"\', "", \'"\', "")]'
        const optgroupSelection = './optgroup/option[. = concat("", \'"\', "someValue1", \'"\', "", \'"\', "")]|./optgroup/option[normalize-space(text()) = concat("", \'"\', "someValue1", \'"\', "", \'"\', "")]'

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json.value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-sub-elem-321/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-sub-elem-321'
        })
    })

    it('should convert number to string when selecting', async () => {
        await elem.selectByVisibleText(123)
        const optionSelection = './option[. = "123"]|./option[normalize-space(text()) = "123"]'
        const optgroupSelection = './optgroup/option[. = "123"]|./optgroup/option[normalize-space(text()) = "123"]'

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/element')
        expect(got.mock.calls[2][1].json.value)
            .toBe(`${optionSelection}|${optgroupSelection}`)
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
        mockElem.selectByVisibleText = elem.selectByVisibleText.bind(mockElem)

        try {
            await mockElem.selectByVisibleText('non-existing-option')
        } catch (e) {
            expect(e.toString()).toBe('Error: Option with text "non-existing-option" not found.')
        }
    })
})

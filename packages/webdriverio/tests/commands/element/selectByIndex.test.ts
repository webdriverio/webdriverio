// @ts-ignore mocked (original defined in webdriver package)
import gotMock from 'got'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'
import * as utils from '../../../src/utils'

const got = gotMock as any as jest.Mock

describe('selectByIndex test', () => {
    const getElementFromResponseSpy = jest.spyOn(utils, 'getElementFromResponse')
    let browser: WebdriverIO.BrowserObject
    let elem: WebdriverIO.Element

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
    })

    it('should select by index', async () => {
        await elem.selectByIndex(1)

        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/element')
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/elements')
        expect(got.mock.calls[3][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-456/click')
        expect(getElementFromResponseSpy).toBeCalledWith({
            [ELEMENT_KEY]: 'some-elem-456'
        })
    })

    it('should throw an error when index < 0', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        try {
            await elem.selectByIndex(-2)
        } catch (e) {
            expect(e.toString()).toBe('Error: Index needs to be 0 or any other positive number')
        }
    })

    it('should throw if there are no options elements', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        const mockElem = {
            selector: 'foobar2',
            elementId: 'some-elem-123',
            'element-6066-11e4-a52e-4f735466cecf': 'some-elem-123',
            findElementsFromElement: jest.fn().mockReturnValue(Promise.resolve([]))
        }
        // @ts-ignore mock feature
        mockElem.selectByIndex = elem.selectByIndex.bind(mockElem)

        try {
            await elem.selectByIndex.call(mockElem, 0)
        } catch (e) {
            expect(e.toString()).toBe('Error: Select element doesn\'t contain any option element')
        }
    })

    it('should throw if index is out of range', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        const mockElem = {
            selector: 'foobar',
            findElementsFromElement: jest.fn().mockReturnValue(Promise.resolve([{ elem: 1 }]))
        }
        // @ts-ignore mock feature
        mockElem.selectByIndex = elem.selectByIndex.bind(mockElem)

        try {
            // @ts-ignore mock feature
            await mockElem.selectByIndex(2)
        } catch (e) {
            expect(e.toString()).toBe('Error: Can\'t call selectByIndex on element with selector "foobar" because element wasn\'t found')
        }
    })

    it('should throw if index is out of rangew', async () => {
        // @ts-ignore uses expect-webdriverio
        expect.hasAssertions()
        try {
            await elem.selectByIndex(3)
        } catch (e) {
            expect(e.toString()).toBe('Error: Option with index "3" not found. Select element only contains 3 option elements')
        }
    })
})

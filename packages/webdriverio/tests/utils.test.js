import { ELEMENT_KEY } from '../src/constants'
import {
    findStrategy,
    getElementFromResponse,
    getBrowserObject,
    transformToCharString,
    parseCSS,
    checkUnicode,
    findElement,
    findElements,
    verifyArgsAndStripIfElement
} from '../src/utils'

describe('utils', () => {
    describe('selector strategies helper', () => {
        it('should find an element using "css selector" method', () => {
            const element = findStrategy('.red')
            expect(element.using).toBe('css selector')
            expect(element.value).toBe('.red')
        })

        it('should find an element using "id" method', () => {
            const element = findStrategy('#purplebox')
            expect(element.using).toBe('css selector')
            expect(element.value).toBe('#purplebox')
        })

        it('should find an element using "name" method through jsonwp', () => {
            const element = findStrategy('[name="searchinput"]', false)
            expect(element.using).toBe('name')
            expect(element.value).toBe('searchinput')
        })

        it('should find an element using "name" method through WC3', () => {
            const element = findStrategy('[name="searchinput"]', true)
            expect(element.using).toBe('css selector')
            expect(element.value).toBe('[name="searchinput"]')
        })

        it('should find an element using "name" method with a . in the name', () => {
            const element = findStrategy('[name="search.input"]')
            expect(element.using).toBe('name')
            expect(element.value).toBe('search.input')
        })

        it('should find an element using "link text" method', () => {
            const element = findStrategy('=GitHub Repo')
            expect(element.using).toBe('link text')
            expect(element.value).toBe('GitHub Repo')
        })

        it('should find an element using "partial link text" method', () => {
            const element = findStrategy('*=new')
            expect(element.using).toBe('partial link text')
            expect(element.value).toBe('new')
        })

        it('should find an element using "tag name" method and tag format <XXX />', () => {
            const element = findStrategy('<textarea />')
            expect(element.using).toBe('tag name')
            expect(element.value).toBe('textarea')
        })

        it('should find an element using "tag name" method and tag format <XXX>', () => {
            const element = findStrategy('<textarea>')
            expect(element.using).toBe('tag name')
            expect(element.value).toBe('textarea')
        })

        it('should find an element using "xpath" method', () => {
            const element = findStrategy('//html/body/section/div[6]/div/span')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('//html/body/section/div[6]/div/span')
        })

        it('should find an element using "xpath" method for ParenthesizedExpressions', () => {
            const element = findStrategy('(//div)[7]/span')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('(//div)[7]/span')
        })

        it('should find an element by tag name + content', () => {
            const element = findStrategy('div=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//div[normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should find an element by tag name + id + similar content', () => {
            const element = findStrategy('h1=Christian')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//h1[normalize-space() = "Christian"]')
        })

        it('should find an element by tag name + similar content', () => {
            const element = findStrategy('div*=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//div[contains(., "some random text with "§$%&/()div=or others")]')
        })

        it('should find an element by tag name + class + content', () => {
            const element = findStrategy('div.some-class=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//div[contains(@class, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should find an element class + content', () => {
            const element = findStrategy('.some-class=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//*[contains(@class, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should find an element by tag name + class + similar content', () => {
            const element = findStrategy('div.some-class*=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//div[contains(@class, "some-class") and contains(., "some random text with "§$%&/()div=or others")]')
        })

        it('should find an element by class + similar content', () => {
            const element = findStrategy('.some-class*=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//*[contains(@class, "some-class") and contains(., "some random text with "§$%&/()div=or others")]')
        })

        it('should find an element by tag name + id + content', () => {
            const element = findStrategy('div#some-class=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//div[contains(@id, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should find an element by id + content', () => {
            const element = findStrategy('#some-class=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//*[contains(@id, "some-class") and normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should find an element by tag name + id + similar content', () => {
            const element = findStrategy('div#some-id*=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//div[contains(@id, "some-id") and contains(., "some random text with "§$%&/()div=or others")]')
        })

        it('should find an element by id + similar content', () => {
            const element = findStrategy('#some-id*=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//*[contains(@id, "some-id") and contains(., "some random text with "§$%&/()div=or others")]')
        })

        it('should find an element by id + similar content see #1494', () => {
            const element = findStrategy('#What-is-WebdriverIO*=What')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//*[contains(@id, "What-is-WebdriverIO") and contains(., "What")]')
        })

        it('should find an element by tag name + attribute + content', () => {
            const element = findStrategy('div[some-attribute="some-value"]=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//div[contains(@some-attribute, "some-value") and normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should find an element by attribute + content', () => {
            const element = findStrategy('[some-attribute="some-value"]=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//*[contains(@some-attribute, "some-value") and normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should find an element by attribute existence + content', () => {
            const element = findStrategy('[some-attribute]=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//*[@some-attribute and normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should find an element by tag name + attribute + similar content', () => {
            const element = findStrategy('div[some-attribute="some-value"]*=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//div[contains(@some-attribute, "some-value") and contains(., "some random text with "§$%&/()div=or others")]')
        })

        it('should find an element by attribute + similar content', () => {
            const element = findStrategy('[some-attribute="some-value"]*=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//*[contains(@some-attribute, "some-value") and contains(., "some random text with "§$%&/()div=or others")]')
        })

        it('should find an custom element by tag name + content', () => {
            const element = findStrategy('custom-element-with-multiple-dashes=some random text with "§$%&/()div=or others')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('.//custom-element-with-multiple-dashes[normalize-space() = "some random text with "§$%&/()div=or others"]')
        })

        it('should allow to go up and down the DOM tree with xpath', () => {
            let element = findStrategy('..')
            expect(element.using).toBe('xpath')
            element = findStrategy('.')
            expect(element.using).toBe('xpath')
        })

        it('should find an element by ui automator strategy (android only)', () => {
            const element = findStrategy('android=foo')
            expect(element.using).toBe('-android uiautomator')
            expect(element.value).toBe('foo')
        })

        it('should find an element by ui automation strategy (ios only)', () => {
            const element = findStrategy('ios=foo')
            expect(element.using).toBe('-ios uiautomation')
            expect(element.value).toBe('foo')
        })

        it('should find an element by predicate strategy (ios only)', () => {
            const element = findStrategy('-ios predicate string:type == \'XCUIElementTypeSwitch\' && name CONTAINS \'Allow\'')
            expect(element.using).toBe('-ios predicate string')
            expect(element.value).toBe('type == \'XCUIElementTypeSwitch\' && name CONTAINS \'Allow\'')
        })

        it('should find an element by class chain strategy (ios only)', () => {
            const element = findStrategy('-ios class chain:**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton')
            expect(element.using).toBe('-ios class chain')
            expect(element.value).toBe('**/XCUIElementTypeCell[`name BEGINSWITH "D"`]/**/XCUIElementTypeButton')
        })

        it('should find an element by accessibility id', () => {
            const element = findStrategy('~foo')
            expect(element.using).toBe('accessibility id')
            expect(element.value).toBe('foo')
        })

        it('should find an element by css selector with id and attribute', () => {
            const element = findStrategy('#purplebox[data-foundBy]')
            expect(element.using).toBe('css selector')
        })

        it('should find an element by css selector with id and immediately preceded operator', () => {
            const element = findStrategy('#purplebox+div')
            expect(element.using).toBe('css selector')
        })

        it('should find an element by css selector with id and preceded operator', () => {
            const element = findStrategy('#purplebox~div')
            expect(element.using).toBe('css selector')
        })

        it('should find an element by css selector with id and pseudo class', () => {
            const element = findStrategy('#purplebox:before')
            expect(element.using).toBe('css selector')
        })

        it('should find an element by android accessibility id', () => {
            const selector = 'new UiSelector().text("Cancel")).className("android.widget.Button")'
            const element = findStrategy('android=' + selector)
            expect(element.using).toBe('-android uiautomator')
            expect(element.value).toBe(selector)
        })

        it('should find an element by ios accessibility id', () => {
            const selector = 'UIATarget.localTarget().frontMostApp().mainWindow().buttons()[0]'
            const element = findStrategy('ios=' + selector)
            expect(element.using).toBe('-ios uiautomation')
            expect(element.value).toBe(selector)
        })

        it('should find an mobile ios element class name', () => {
            const element = findStrategy('UIATextField')
            expect(element.using).toBe('class name')
        })

        it('should find an mobile android element class name', () => {
            const element = findStrategy('android.widget.EditText')
            expect(element.using).toBe('class name')
        })

        it('allows to specify selector strategy directly', () => {
            let element = findStrategy('id:foobar id')
            expect(element.using).toBe('id')
            expect(element.value).toBe('foobar id')
            element = findStrategy('css selector:foobar css selector')
            expect(element.using).toBe('css selector')
            expect(element.value).toBe('foobar css selector')
            element = findStrategy('xpath:foobar xpath')
            expect(element.using).toBe('xpath')
            expect(element.value).toBe('foobar xpath')
            element = findStrategy('link text:foobar link text')
            expect(element.using).toBe('link text')
            expect(element.value).toBe('foobar link text')
            element = findStrategy('partial link text:foobar partial link text')
            expect(element.using).toBe('partial link text')
            expect(element.value).toBe('foobar partial link text')
            element = findStrategy('name:foobar name')
            expect(element.using).toBe('name')
            expect(element.value).toBe('foobar name')
            element = findStrategy('tag name:foobar tag name')
            expect(element.using).toBe('tag name')
            expect(element.value).toBe('foobar tag name')
            element = findStrategy('class name:foobar class name')
            expect(element.using).toBe('class name')
            expect(element.value).toBe('foobar class name')
            element = findStrategy('-android uiautomator:foobar -android uiautomator')
            expect(element.using).toBe('-android uiautomator')
            expect(element.value).toBe('foobar -android uiautomator')
            element = findStrategy('-ios uiautomation:foobar -ios uiautomation')
            expect(element.using).toBe('-ios uiautomation')
            expect(element.value).toBe('foobar -ios uiautomation')
            element = findStrategy('accessibility id:foobar accessibility id')
            expect(element.using).toBe('accessibility id')
            expect(element.value).toBe('foobar accessibility id')

            element = findStrategy('.ui-cloud__sec__develop-content__app-grid:nth-child(1)')
            expect(element.using).toBe('css selector')
            expect(element.value).toBe('.ui-cloud__sec__develop-content__app-grid:nth-child(1)')
        })

        it('should not allow unsupported selector strategies if w3c is used', () => {
            expect(() => findStrategy('accessibility id:foobar accessibility id', true)).toThrow()
            expect(() => findStrategy('android=foo', true)).toThrow()
        })

        it('should allow mobile selector strategies if isMobile is used', () => {
            let element = findStrategy('android=foo', undefined, true)
            expect(element.using).toBe('-android uiautomator')
            expect(element.value).toBe('foo')

            element = findStrategy('ios=foo', undefined, true)
            expect(element.using).toBe('-ios uiautomation')
            expect(element.value).toBe('foo')
        })

        it('should allow mobile selector strategies if isMobile is used even when w3c is used', () => {
            let element = findStrategy('android=foo', true, true)
            expect(element.using).toBe('-android uiautomator')
            expect(element.value).toBe('foo')

            element = findStrategy('ios=foo', true, true)
            expect(element.using).toBe('-ios uiautomation')
            expect(element.value).toBe('foo')
        })
    })

    describe('getElementFromResponse', () => {
        it('should return null if response is null', () => {
            expect(getElementFromResponse(null)).toBe(null)
        })

        it('should return null if response is undfined', () => {
            expect(getElementFromResponse()).toBe(null)
        })

        it('should find element from JSONWireProtocol response', () => {
            expect(getElementFromResponse({ ELEMENT: 'foobar' })).toBe('foobar')
        })

        it('should find element from W3C response', () => {
            expect(getElementFromResponse({ 'element-6066-11e4-a52e-4f735466cecf': 'barfoo' })).toBe('barfoo')
        })

        it('should throw otherwise', () => {
            expect(getElementFromResponse({ invalid: 'response '})).toBe(null)
        })
    })

    describe('getBrowserObject', () => {
        it('should traverse up', () => {
            expect(getBrowserObject({
                parent: {
                    parent: {
                        parent: {
                            foo: 'bar'
                        }
                    }
                }
            })).toEqual({ foo: 'bar' })
        })
    })

    describe('transformToCharString', () => {
        it('should allow to pass non arrays to it', () => {
            expect(transformToCharString('foobar')).toEqual(['f', 'o', 'o', 'b', 'a', 'r'])
        })

        it('should do nothing if all is good', () => {
            expect(transformToCharString(['f'])).toEqual(['f'])
        })

        it('should be able to transform objects', () => {
            expect(transformToCharString({ a: 1 })).toEqual(['{', '"', 'a', '"', ':', '1', '}'])
        })

        it('should be able to transform numbers', () => {
            expect(transformToCharString(42)).toEqual(['4', '2'])
        })

        it('should be able to transform booleans', () => {
            expect(transformToCharString(true)).toEqual(['t', 'r', 'u', 'e'])
        })

        it('ignore undefined/null', () => {
            expect(transformToCharString([null])).toEqual([])
            expect(transformToCharString([undefined])).toEqual([])
        })

        it('can do all of this together', () => {
            expect(transformToCharString(['foo', undefined, { b: 1 }, null, 42, false])).toEqual(
                ['f', 'o', 'o', '{', '"', 'b', '"', ':', '1', '}', '4', '2', 'f', 'a', 'l', 's', 'e'])
        })

        it('should convert string to unicode', () => {
            expect(transformToCharString('Enter')).toEqual(['\uE007'])
            expect(transformToCharString('Back space')).toEqual(['\uE003'])
            expect(transformToCharString('Backspace')).toEqual(['\uE003'])
            expect(transformToCharString('Pageup')).toEqual(['\uE00E'])
        })
    })

    describe('parseCSS', () => {
        it('should return null if css prop is null', () => {
            expect(parseCSS()).toBe(null)
        })

        it('should parse colors properly', () => {
            expect(parseCSS('rgba(0, 136, 204, 1)', 'color')).toEqual({
                property: 'color',
                value: 'rgba(0,136,204,1)',
                parsed: {
                    hex: '#0088cc',
                    alpha: 1,
                    type: 'color',
                    rgba: 'rgba(0,136,204,1)'
                }
            })

            expect(parseCSS('#0088cc', 'color')).toEqual({
                property: 'color',
                value: '#0088cc'
            })
        })

        it('should parse fonts properly', () => {
            expect(parseCSS('helvetica', 'font-family')).toEqual({
                property: 'font-family',
                value: 'helvetica',
                parsed: {
                    value: ['helvetica'],
                    type: 'font',
                    string: 'helvetica'
                }
            })
        })

        it('should parse number with unit values', () => {
            expect(parseCSS('100px', 'width')).toEqual({
                property: 'width',
                value: '100px',
                parsed: {
                    type: 'number',
                    string: '100px',
                    unit: 'px',
                    value: 100
                }
            })

            expect(parseCSS('50%', 'width')).toEqual({
                property: 'width',
                value: '50%',
                parsed: {
                    type: 'number',
                    string: '50%',
                    unit: '%',
                    value: 50
                }
            })

            expect(parseCSS('42', 'foobar')).toEqual({
                property: 'foobar',
                value: 42,
                parsed: {
                    type: 'number',
                    string: '42',
                    unit: '',
                    value: 42
                }
            })
        })
    })

    describe('checkUnicode', () => {
        it('should return array with unicode', () => {
            const result = checkUnicode('Home')

            expect(Array.isArray(result)).toBe(true)
            expect(result[0]).toEqual('\uE011')
        })

        it('should return an array without unicode', () => {
            const result = checkUnicode('foo')

            expect(Array.isArray(result)).toBe(true)
            expect(result[0]).toBe('f')
            expect(result[1]).toBe('o')
            expect(result[2]).toBe('o')
        })
    })

    describe('findElement', () => {
        const malformedElementResponse = { foo: 'bar' }
        const elementResponse = { [ELEMENT_KEY]: 'foobar' }
        const elementsResponse = [
            { [ELEMENT_KEY]: 'foobar' },
            { [ELEMENT_KEY]: 'barfoo' }
        ]
        let scope

        beforeEach(() => {
            scope = {
                findElementsFromElement: jest.fn(),
                findElementFromElement: jest.fn(),
                findElements: jest.fn(),
                findElement: jest.fn(),
                execute: jest.fn()
            }
        })

        it('fetches element using a selector string with browser scope', async () => {
            await findElement.call(scope, '.elem')
            expect(scope.findElement).toBeCalledWith('css selector', '.elem')
            expect(scope.findElementFromElement).not.toBeCalled()
        })

        it('fetches element using a selector string with element scope', async () => {
            scope.elementId = 'foobar'
            await findElement.call(scope, '.elem')
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement)
                .toBeCalledWith('foobar', 'css selector', '.elem')
        })

        it('fetches element using a function with browser scope', async () => {
            scope.execute.mockReturnValue(elementResponse)
            const elem = await findElement.call(scope, () => { return global.document.body })
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem[ELEMENT_KEY]).toBe('foobar')
        })

        it('fetches element using a function with element scope', async () => {
            scope.elementId = 'foobar'
            scope.execute.mockReturnValue(elementResponse)
            const elem = await findElement.call(scope, () => { return global.document.body })
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem[ELEMENT_KEY]).toBe('foobar')
            expect(scope.execute.mock.calls[0][1]).toEqual(scope)
        })

        it('should return only one element if multiple are returned', async () => {
            scope.execute.mockReturnValue(elementsResponse)
            const elem = await findElement.call(scope, () => { return global.document.body })
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem[ELEMENT_KEY]).toBe('foobar')
        })

        it('throws if element response is malformed', async () => {
            scope.execute.mockReturnValue(malformedElementResponse)
            const res = await findElement.call(scope, () => { return global.document.body })
            expect(res instanceof Error)
            expect(res.message).toMatch('did not return an HTMLElement')
        })

        it('throws if selector is neither string nor function', async () => {
            const expectedMatch = 'selector needs to be typeof `string` or `function`'
            await expect(findElement.call(scope, null)).rejects.toEqual(new Error(expectedMatch))
            await expect(findElement.call(scope, 123)).rejects.toEqual(new Error(expectedMatch))
            await expect(findElement.call(scope, false)).rejects.toEqual(new Error(expectedMatch))
            await expect(findElement.call(scope)).rejects.toEqual(new Error(expectedMatch))
        })
    })

    describe('findElements', () => {
        const malformedElementResponse = { foo: 'bar' }
        const elementResponse = { [ELEMENT_KEY]: 'foobar' }
        const elementsResponse = [
            { [ELEMENT_KEY]: 'foobar' },
            { [ELEMENT_KEY]: 'barfoo' }
        ]
        let scope

        beforeEach(() => {
            scope = {
                findElementsFromElement: jest.fn(),
                findElementFromElement: jest.fn(),
                findElements: jest.fn(),
                findElement: jest.fn(),
                execute: jest.fn()
            }
        })

        it('fetches element using a selector string with browser scope', async () => {
            await findElements.call(scope, '.elem')
            expect(scope.findElements).toBeCalledWith('css selector', '.elem')
            expect(scope.findElementsFromElement).not.toBeCalled()
        })

        it('fetches element using a selector string with element scope', async () => {
            scope.elementId = 'foobar'
            await findElements.call(scope, '.elem')
            expect(scope.findElements).not.toBeCalled()
            expect(scope.findElementsFromElement)
                .toBeCalledWith('foobar', 'css selector', '.elem')
        })

        it('fetches element using a function with browser scope', async () => {
            scope.execute.mockReturnValue(elementResponse)
            const elem = await findElements.call(scope, () => { return global.document.body })
            expect(scope.findElements).not.toBeCalled()
            expect(scope.findElementsFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem).toHaveLength(1)
            expect(elem[0][ELEMENT_KEY]).toBe('foobar')
        })

        it('fetches element using a function with element scope', async () => {
            scope.elementId = 'foobar'
            scope.execute.mockReturnValue(elementResponse)
            const elem = await findElements.call(scope, () => { return global.document.body })
            expect(scope.findElements).not.toBeCalled()
            expect(scope.findElementsFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem).toHaveLength(1)
            expect(elem[0][ELEMENT_KEY]).toBe('foobar')
            expect(scope.execute.mock.calls[0][1]).toEqual(scope)
        })

        it('should return multiple elements if multiple are returned', async () => {
            scope.execute.mockReturnValue(elementsResponse)
            const elem = await findElements.call(scope, () => { return global.document.body })
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem).toEqual(elementsResponse)
        })

        it('should filter out malformed responses', async () => {
            scope.execute.mockReturnValue([...elementsResponse, 'foobar'])
            const elem = await findElements.call(scope, () => { return global.document.body })
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem).toEqual(elementsResponse)
        })

        it('throws if element response is malformed', async () => {
            scope.execute.mockReturnValue(malformedElementResponse)
            const res = await findElements.call(scope, () => { return global.document.body })
            expect(res).toHaveLength(0)
        })

        it('throws if selector is neither string nor function', async () => {
            const expectedMatch = 'selector needs to be typeof `string` or `function`'
            await expect(findElements.call(scope, null)).rejects.toEqual(new Error(expectedMatch))
            await expect(findElements.call(scope, 123)).rejects.toEqual(new Error(expectedMatch))
            await expect(findElements.call(scope, false)).rejects.toEqual(new Error(expectedMatch))
            await expect(findElements.call(scope)).rejects.toEqual(new Error(expectedMatch))
        })
    })
    describe('verifyArgsAndStripIfElement', () => {
        class Element {
            constructor({ elementId, ...otherProps }) {
                this.elementId = elementId
                Object.keys(otherProps).forEach(key => this[key] = otherProps[key])
            }
        }

        it('returns the same value if it is not an element object', () => {
            expect(verifyArgsAndStripIfElement([1, 'two', true, false, null, undefined])).toEqual([1, 'two', true, false, null, undefined])
        })

        it('strips down properties if value is element object', () => {
            const fakeObj = new Element({ 
                elementId: 'foo-bar',
                someProp: 123,
                anotherProp: 'abc'
            })

            expect(verifyArgsAndStripIfElement([fakeObj, 'abc', 123])).toMatchObject([
                { [ELEMENT_KEY]: 'foo-bar', ELEMENT: 'foo-bar' },
                'abc',
                123
            ])
        })

        it('should work even if parameter is not of type Array', () => {
            const fakeObj = new Element({ 
                elementId: 'foo-bar',
                someProp: 123,
                anotherProp: 'abc'
            })

            expect(verifyArgsAndStripIfElement(fakeObj)).toMatchObject(
                { [ELEMENT_KEY]: 'foo-bar', ELEMENT: 'foo-bar' }
            )
            expect(verifyArgsAndStripIfElement('foo')).toEqual('foo')
        })

        it('throws error if element object is missing element id', () => {
            const fakeObj = new Element({
                someProp: 123,
                anotherProp: 'abc',
                selector: 'div'
            })

            expect(() => verifyArgsAndStripIfElement(fakeObj)).toThrow('The element with selector "div" you trying to pass into the execute method wasn\'t found')
        })
    })
})

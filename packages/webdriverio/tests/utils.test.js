import fs from 'fs'
import http from 'http'
import path from 'path'

import { ELEMENT_KEY } from '../src/constants'
import {
    getElementFromResponse,
    getBrowserObject,
    transformToCharString,
    parseCSS,
    checkUnicode,
    findElement,
    findElements,
    verifyArgsAndStripIfElement,
    getElementRect,
    getAbsoluteFilepath,
    assertDirectoryExists,
    validateUrl,
    getAutomationProtocol,
    updateCapabilities
} from '../src/utils'

jest.mock('http', () => {
    const req = { on: jest.fn(), end: jest.fn() }
    let response = { statusCode: 200 }
    return {
        setResponse: (data) => {
            response = data
        },
        request: jest.fn((url, cb) => {
            cb(response)
            return req
        })
    }
})

jest.mock('fs')

describe('utils', () => {
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
            expect(getElementFromResponse({ invalid: 'response ' })).toBe(null)
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

        it('should transform string without converting to unicode', () => {
            expect(transformToCharString('Delete', false)).toEqual(
                ['D', 'e', 'l', 'e', 't', 'e'])
            expect(transformToCharString('Back space', false)).toEqual(
                ['B', 'a', 'c', 'k', ' ', 's', 'p', 'a', 'c', 'e'])
            expect(transformToCharString('Backspace', false)).toEqual(
                ['B', 'a', 'c', 'k', 's', 'p', 'a', 'c', 'e'])
            expect(transformToCharString('Pageup', false)).toEqual(
                ['P', 'a', 'g', 'e', 'u', 'p'])
        })

        it('should transform string with converting to unicode', () => {
            expect(transformToCharString('Delete', true)).toEqual(['\uE017'])
            expect(transformToCharString('Back space', true)).toEqual(['\uE003'])
            expect(transformToCharString('Backspace', true)).toEqual(['\uE003'])
            expect(transformToCharString('Pageup', true)).toEqual(['\uE00E'])
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
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual('\uE011')
        })

        it('should not convert unicode if devtools is used', () => {
            const result = checkUnicode('Home', true)

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual('Home')
        })

        it('should return an array without unicode', () => {
            const result = checkUnicode('foo')

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(3)
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

    describe('getElementRect', () => {
        it('uses getBoundingClientRect if a key is missing', async () => {
            const fakeScope = {
                elementId: 123,
                getElementRect: jest.fn(() => Promise.resolve({ x: 10, width: 300, height: 400 })),
                execute: jest.fn(() => Promise.resolve({ x: 11, y: 22, width: 333, height: 444 }))
            }
            expect(await getElementRect(fakeScope)).toEqual({ x: 10, y: 22, width: 300, height: 400 })
            expect(fakeScope.getElementRect).toHaveBeenCalled()
            expect(fakeScope.execute).toHaveBeenCalled()
        })
    })

    describe('getAbsoluteFilepath', () => {
        it('should not change filepath if starts with forward slash', () => {
            const filepath = '/packages/bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should not change filepath if starts with backslash slash', () => {
            const filepath = '\\packages\\bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should not change filepath if starts with windows drive letter', async () => {
            const filepath = 'E:\\foo\\bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(filepath)
        })

        it('should change filepath if does not start with forward or back slash', async () => {
            const filepath = 'packages/bar.png'
            expect(getAbsoluteFilepath(filepath)).toEqual(path.join(process.cwd(), 'packages/bar.png'))
        })
    })

    describe('assertDirectoryExists', () => {
        beforeEach(() => {
            const fsOrig = jest.requireActual('fs')
            fs.existsSync.mockImplementation(fsOrig.existsSync.bind(fsOrig))
        })

        it('should fail if not existing directory', () => {
            expect(() => assertDirectoryExists('/i/dont/exist.png')).toThrowError(new Error('directory (/i/dont) doesn\'t exist'))
        })
        it('should not fail if directory exists', () => {
            expect(() => assertDirectoryExists('.')).not.toThrow()
        })
    })

    describe('validateUrl', () => {
        it('should ensure url is correct', () => {
            expect(validateUrl('http://json.org')).toEqual('http://json.org/')
            expect(validateUrl('www.json.org')).toEqual('http://www.json.org/')
            expect(validateUrl('json.org')).toEqual('http://json.org/')
            expect(validateUrl('about:blank')).toEqual('about:blank')
            expect(validateUrl('IamInAHost')).toEqual('http://iaminahost/')
            expect(validateUrl('data:text/html, <html contenteditable>'))
                .toEqual('data:text/html, <html contenteditable>')
            expect(() => validateUrl('_I.am.I:nvalid'))
                .toThrowError('Invalid URL: _I.am.I:nvalid')
        })
    })

    describe('getAutomationProtocol', () => {
        it('should not default to devtools if there is an indication not to', async () => {
            expect(await getAutomationProtocol({ hostname: 'foobar', automationProtocol: 'webdriver' }))
                .toBe('webdriver')
            expect(await getAutomationProtocol({ port: 1234, automationProtocol: 'webdriver' }))
                .toBe('webdriver')
            expect(await getAutomationProtocol({ user: 'a', key: 'b', automationProtocol: 'webdriver' }))
                .toBe('webdriver')
        })

        it('should switch if /status returns with 200', async () => {
            expect(await getAutomationProtocol({ automationProtocol: 'webdriver' }))
                .toBe('webdriver')
            expect(await getAutomationProtocol({ automationProtocol: 'devtools' }))
                .toBe('devtools')
        })

        it('should default to devtools if /status request fails', async () => {
            http.setResponse({ statusCode: 404 })
            expect(await getAutomationProtocol({}))
                .toBe('devtools')
            expect(await getAutomationProtocol({ automationProtocol: 'webdriver' }))
                .toBe('webdriver')
        })

        it('should default to webdriver if browserName is not supported with DevTools automation protocol', async () => {
            http.setResponse({ statusCode: 404 })
            expect(await getAutomationProtocol({ capabilities: { browserName: 'foobar' } }))
                .toBe('webdriver')
        })
    })

    describe('updateCapabilities', () => {
        it('should do nothing if no browser specified', async () => {
            const params = { capabilities: {} }
            await updateCapabilities(params)
            expect(params).toMatchSnapshot()
        })

        describe('setting devtools port in Firefox', () => {
            it('should set firefox options if there aren\'t any', async () => {
                const params = { capabilities: { browserName: 'firefox' } }
                await updateCapabilities(params, 'webdriver')
                expect(params).toMatchSnapshot()

                const params2 = { capabilities: { browserName: 'firefox' } }
                await updateCapabilities(params2, 'devtools')
                expect(params2).toMatchSnapshot()
            })

            it('should not overwrite if already set', async () => {
                const params = {
                    capabilities: {
                        browserName: 'firefox',
                        'moz:firefoxOptions': {
                            args: ['foo', 'bar', '-remote-debugging-port', 1234, 'barfoo']
                        }
                    }
                }
                await updateCapabilities(params)
                expect(params).toMatchSnapshot()
            })
        })
    })
})

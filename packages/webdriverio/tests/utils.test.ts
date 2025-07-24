import path from 'node:path'
import { ELEMENT_KEY } from 'webdriver'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { ElementReference } from '@wdio/protocols'
import {
    getElementFromResponse,
    parseCSS,
    checkUnicode,
    findElement,
    findElements,
    verifyArgsAndStripIfElement,
    getElementRect,
    validateUrl
} from '../src/utils/index.js'

vi.mock('http', () => {
    const req = { on: vi.fn(), end: vi.fn() }
    let response = { statusCode: 200 }
    return {
        default: {
            setResponse: (data: any) => {
                response = data
            },
            request: vi.fn((url, cb) => {
                cb(response)
                return req
            })
        }
    }
})

vi.mock('fs')

describe('utils', () => {
    describe('getElementFromResponse', () => {
        it('should return null if response is null', () => {
            // @ts-expect-error invalid param
            expect(getElementFromResponse(null)).toBe(null)
        })

        it('should return null if response is undfined', () => {
            // @ts-ignore test invalid parameter
            expect(getElementFromResponse()).toBe(null)
        })

        it('should find element from JSONWireProtocol response', () => {
            // @ts-ignore depcrecated functionality
            expect(getElementFromResponse({ ELEMENT: 'foobar' })).toBe('foobar')
        })

        it('should find element from W3C response', () => {
            expect(getElementFromResponse({ 'element-6066-11e4-a52e-4f735466cecf': 'barfoo' })).toBe('barfoo')
        })

        it('should throw otherwise', () => {
            // @ts-ignore test invalid parameter
            expect(getElementFromResponse({ invalid: 'response ' })).toBe(null)
        })
    })

    describe('parseCSS', () => {
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
                value: '#0088cc',
                parsed: {}
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
        let scope: WebdriverIO.Element

        beforeEach(() => {
            scope = {
                findElementsFromElement: vi.fn(),
                findElementFromElement: vi.fn(),
                findElements: vi.fn(),
                findElement: vi.fn(),
                execute: vi.fn(),
                executeScript: vi.fn(),
                on: vi.fn(),
                removeAllListeners: vi.fn()
            } as unknown as WebdriverIO.Element
        })

        it('fetches element using a selector string with browser scope', async () => {
            await findElement.call(scope as any, '.elem')
            expect(scope.findElement).toBeCalledWith('css selector', '.elem')
            expect(scope.findElementFromElement).not.toBeCalled()
        })

        it('fetches element using a selector string with element scope', async () => {
            scope.elementId = 'foobar'
            await findElement.call(scope as any, '.elem')
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement)
                .toBeCalledWith('foobar', 'css selector', '.elem')
        })

        it('fetches element using a function with browser scope', async () => {
            vi.mocked(scope.execute).mockResolvedValue(elementResponse)
            const elem = await findElement.call(scope as any, () => { return global.document.body }) as Element
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem[ELEMENT_KEY]).toBe('foobar')
        })

        it('fetches element using a function with element scope', async () => {
            scope.elementId = 'foobar'
            vi.mocked(scope.executeScript).mockResolvedValue(elementResponse)
            const elem = await findElement.call(scope as any, () => { return global.document.body }) as Element
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.executeScript).toBeCalled()
            expect(elem[ELEMENT_KEY]).toBe('foobar')
            expect(vi.mocked(scope.executeScript).mock.calls[0][1]).toEqual([scope])
        })

        it('should return only one element if multiple are returned', async () => {
            vi.mocked(scope.execute).mockResolvedValue(elementsResponse)
            const elem = await findElement.call(
                scope as any,
                (() => { return global.document.body as unknown as ElementReference }) as any
            ) as Element
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem[ELEMENT_KEY]).toBe('foobar')
        })

        it('throws if element response is malformed', async () => {
            vi.mocked(scope.execute).mockResolvedValue(malformedElementResponse)
            const res = await findElement.call(scope as any, () => { return global.document.body }) as Error
            expect(res instanceof Error)
            expect(res.message).toMatch('did not return an HTMLElement')
        })

        it('throws if selector is neither string nor function', async () => {
            await expect(findElement.call(scope as any, null)).rejects.toEqual(
                new Error('selector needs to be typeof `string` or `function`, but found: `object`'))
            await expect(findElement.call(scope as any, 123)).rejects.toEqual(
                new Error('selector needs to be typeof `string` or `function`, but found: `number`'))
            await expect(findElement.call(scope as any, false)).rejects.toEqual(
                new Error('selector needs to be typeof `string` or `function`, but found: `boolean`'))
            await expect(findElement.call(scope as any)).rejects.toEqual(
                new Error('selector needs to be typeof `string` or `function`, but found: `undefined`'))
        })

        it('should use execute if shadow selector is used', async () => {
            vi.mocked(scope.execute).mockResolvedValue(elementResponse)
            const elem = await findElement.call(scope as any, '>>>.foobar') as Element
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalledWith(
                expect.any(Function),
                false,
                '.foobar',
                undefined
            )
            expect(elem[ELEMENT_KEY]).toBe('foobar')
        })

        it('should use execute if shadow selector is used with element scope', async () => {
            vi.mocked(scope.execute).mockResolvedValue(elementResponse)
            scope.elementId = 'foobar'
            const elem = await findElement.call(scope as any, '>>>.foobar') as Element
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalledWith(
                expect.any(Function),
                false,
                '.foobar',
                scope
            )
            expect(elem[ELEMENT_KEY]).toBe('foobar')
        })
    })

    describe('findElements', () => {
        const malformedElementResponse = { foo: 'bar' }
        const elementResponse = { [ELEMENT_KEY]: 'foobar' }
        const elementsResponse = [
            { [ELEMENT_KEY]: 'foobar' },
            { [ELEMENT_KEY]: 'barfoo' }
        ]
        let scope: WebdriverIO.Element

        beforeEach(() => {
            scope = {
                findElementsFromElement: vi.fn(),
                findElementFromElement: vi.fn(),
                findElements: vi.fn(),
                findElement: vi.fn(),
                execute: vi.fn(),
                executeScript: vi.fn()
            } as unknown as WebdriverIO.Element
        })

        it('fetches element using a selector string with browser scope', async () => {
            await findElements.call(scope as any, '.elem')
            expect(scope.findElements).toBeCalledWith('css selector', '.elem')
            expect(scope.findElementsFromElement).not.toBeCalled()
        })

        it('fetches element using a selector string with element scope', async () => {
            scope.elementId = 'foobar'
            await findElements.call(scope as any, '.elem')
            expect(scope.findElements).not.toBeCalled()
            expect(scope.findElementsFromElement)
                .toBeCalledWith('foobar', 'css selector', '.elem')
        })

        it('fetches element using a function with browser scope', async () => {
            vi.mocked(scope.execute).mockResolvedValue(elementResponse)
            const elem = await findElements.call(scope as any, () => { return global.document.body })
            expect(scope.findElements).not.toBeCalled()
            expect(scope.findElementsFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem).toHaveLength(1)
            expect(elem[0][ELEMENT_KEY]).toBe('foobar')
        })

        it('fetches element using a function with element scope', async () => {
            scope.elementId = 'foobar'
            vi.mocked(scope.executeScript).mockResolvedValue(elementResponse)
            const elem = await findElements.call(scope as any, () => { return global.document.body })
            expect(scope.findElements).not.toBeCalled()
            expect(scope.findElementsFromElement).not.toBeCalled()
            expect(scope.executeScript).toBeCalled()
            expect(elem).toHaveLength(1)
            expect(elem[0][ELEMENT_KEY]).toBe('foobar')
            expect(vi.mocked(scope.executeScript).mock.calls[0][1]).toEqual([scope])
        })

        it('should return multiple elements if multiple are returned', async () => {
            vi.mocked(scope.execute).mockResolvedValue(elementsResponse)
            const elem = await findElements.call(scope as any, () => { return global.document.body })
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem).toEqual(elementsResponse)
        })

        it('should filter out malformed responses', async () => {
            vi.mocked(scope.execute).mockResolvedValue([...elementsResponse, 'foobar'])
            const elem = await findElements.call(scope as any, () => { return global.document.body })
            expect(scope.findElement).not.toBeCalled()
            expect(scope.findElementFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalled()
            expect(elem).toEqual(elementsResponse)
        })

        it('throws if element response is malformed', async () => {
            vi.mocked(scope.execute).mockResolvedValue(malformedElementResponse)
            const res = await findElements.call(scope as any, () => { return global.document.body })
            expect(res).toHaveLength(0)
        })

        it('throws if selector is neither string nor function', async () => {
            await expect(findElements.call(scope, null)).rejects.toEqual(
                new Error('selector needs to be typeof `string` or `function`, but found: `object`'))
            await expect(findElements.call(scope, 123)).rejects.toEqual(
                new Error('selector needs to be typeof `string` or `function`, but found: `number`'))
            await expect(findElements.call(scope, false)).rejects.toEqual(
                new Error('selector needs to be typeof `string` or `function`, but found: `boolean`'))
            await expect(findElements.call(scope)).rejects.toEqual(
                new Error('selector needs to be typeof `string` or `function`, but found: `undefined`'))
        })

        it('fetches element using a function with browser scope', async () => {
            vi.mocked(scope.execute).mockResolvedValue(elementResponse)
            const elem = await findElements.call(scope as any, '>>>.foobar')
            expect(scope.findElements).not.toBeCalled()
            expect(scope.findElementsFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalledWith(
                expect.any(Function),
                true,
                '.foobar',
                undefined
            )
            expect(elem).toHaveLength(1)
            expect(elem[0][ELEMENT_KEY]).toBe('foobar')
        })

        it('fetches element using a function with element scope', async () => {
            vi.mocked(scope.execute).mockResolvedValue(elementResponse)
            scope.elementId = 'foobar'
            const elem = await findElements.call(scope as any, '>>>.foobar')
            expect(scope.findElements).not.toBeCalled()
            expect(scope.findElementsFromElement).not.toBeCalled()
            expect(scope.execute).toBeCalledWith(
                expect.any(Function),
                true,
                '.foobar',
                scope
            )
            expect(elem).toHaveLength(1)
            expect(elem[0][ELEMENT_KEY]).toBe('foobar')
        })
    })
    describe('verifyArgsAndStripIfElement', () => {
        class Element {
            elementId: string
            constructor({ elementId, ...otherProps }: any) {
                this.elementId = elementId
                Object.keys(otherProps).forEach((key) => this[key] = otherProps[key])
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
            // @ts-ignore test scenario
            const fakeObj = new Element({
                someProp: 123,
                anotherProp: 'abc',
                selector: 'div'
            })

            expect(() => verifyArgsAndStripIfElement(fakeObj)).toThrow('The element with selector "div" you are trying to pass into the execute method wasn\'t found')
        })
    })

    describe('getElementRect', () => {
        it('uses getBoundingClientRect if a key is missing', async () => {
            const fakeScope = {
                elementId: 123,
                getElementRect: vi.fn(() => Promise.resolve({ x: 10, width: 300, height: 400 })),
                execute: vi.fn(() => Promise.resolve({ x: 11, y: 22, width: 333, height: 444 }))
            } as unknown as WebdriverIO.Element
            expect(await getElementRect(fakeScope as any)).toEqual({ x: 10, y: 22, width: 300, height: 400 })
            expect(fakeScope.getElementRect).toHaveBeenCalled()
            expect(fakeScope.execute).toHaveBeenCalled()
        })

        it('does not use getBoundingClientRect if a value is 0', async () => {
            const fakeScope = {
                elementId: 123,
                getElementRect: vi.fn(() => Promise.resolve({ x: 10, y: 0, width: 300, height: 400 })),
                execute: vi.fn(() => Promise.reject(new Error('Method is not implemented')))
            } as unknown as WebdriverIO.Element
            expect(await getElementRect(fakeScope as any)).toEqual({ x: 10, y: 0, width: 300, height: 400 })
            expect(fakeScope.getElementRect).toHaveBeenCalled()
            expect(fakeScope.execute).not.toHaveBeenCalled()
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
})

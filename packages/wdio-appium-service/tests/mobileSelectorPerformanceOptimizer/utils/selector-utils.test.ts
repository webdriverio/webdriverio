import { describe, expect, test } from 'vitest'
import {
    isElementFindCommand,
    extractSelectorFromArgs,
    isXPathSelector,
    parseOptimizedSelector
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/selector-utils.js'

describe('selector-utils', () => {
    describe('isElementFindCommand', () => {
        test('should return true for $ command', () => {
            expect(isElementFindCommand('$')).toBe(true)
        })

        test('should return true for $$ command', () => {
            expect(isElementFindCommand('$$')).toBe(true)
        })

        test('should return true for findElement commands', () => {
            expect(isElementFindCommand('findElement')).toBe(true)
            expect(isElementFindCommand('findElements')).toBe(true)
        })

        test('should return true for custom commands', () => {
            expect(isElementFindCommand('custom$')).toBe(true)
            expect(isElementFindCommand('custom$$')).toBe(true)
        })

        test('should return true for shadow commands', () => {
            expect(isElementFindCommand('shadow$')).toBe(true)
            expect(isElementFindCommand('shadow$$')).toBe(true)
        })

        test('should return true for element traversal commands', () => {
            expect(isElementFindCommand('getElement')).toBe(true)
            expect(isElementFindCommand('getElements')).toBe(true)
            expect(isElementFindCommand('nextElement')).toBe(true)
            expect(isElementFindCommand('previousElement')).toBe(true)
            expect(isElementFindCommand('parentElement')).toBe(true)
        })

        test('should return false for non-find commands', () => {
            expect(isElementFindCommand('click')).toBe(false)
            expect(isElementFindCommand('getText')).toBe(false)
            expect(isElementFindCommand('setValue')).toBe(false)
        })
    })

    describe('extractSelectorFromArgs', () => {
        test('should extract string selector from first argument', () => {
            expect(extractSelectorFromArgs(['//button'])).toBe('//button')
        })

        test('should return null for empty args', () => {
            expect(extractSelectorFromArgs([])).toBeNull()
        })

        test('should return null for undefined args', () => {
            expect(extractSelectorFromArgs(undefined as unknown as unknown[])).toBeNull()
        })

        test('should stringify object selector', () => {
            const selector = { id: 'my-id', tag: 'button' }
            expect(extractSelectorFromArgs([selector])).toBe(JSON.stringify(selector))
        })

        test('should handle object that cannot be stringified', () => {
            const circular: { self?: unknown } = {}
            circular.self = circular
            expect(extractSelectorFromArgs([circular])).toBe('[object Object]')
        })

        test('should convert non-string primitives to string', () => {
            expect(extractSelectorFromArgs([123])).toBe('123')
            expect(extractSelectorFromArgs([true])).toBe('true')
            expect(extractSelectorFromArgs([null])).toBe('null')
        })
    })

    describe('isXPathSelector', () => {
        test('should return true for absolute XPath starting with /', () => {
            expect(isXPathSelector('/html')).toBe(true)
            expect(isXPathSelector('//div')).toBe(true)
            expect(isXPathSelector('//*[@id="test"]')).toBe(true)
        })

        test('should return true for relative XPath starting with ./', () => {
            expect(isXPathSelector('./div')).toBe(true)
            expect(isXPathSelector('.//button')).toBe(true)
        })

        test('should return true for parent XPath starting with ../', () => {
            expect(isXPathSelector('../parent')).toBe(true)
            expect(isXPathSelector('..//div')).toBe(true)
        })

        test('should return true for descendant any starting with */', () => {
            expect(isXPathSelector('*/child')).toBe(true)
        })

        test('should return true for grouped XPath expressions', () => {
            expect(isXPathSelector('(//div)[1]')).toBe(true)
            expect(isXPathSelector('(/html/body/div)')).toBe(true)
            expect(isXPathSelector('(//button[@id])')).toBe(true)
        })

        test('should return false for CSS pseudo-selectors starting with (:', () => {
            expect(isXPathSelector('(:has(div))')).toBe(false)
            expect(isXPathSelector('(:is(.class))')).toBe(false)
        })

        test('should return false for selector starting with ( but not containing / or @', () => {
            expect(isXPathSelector('(some text)')).toBe(false)
            expect(isXPathSelector('(button)')).toBe(false)
            expect(isXPathSelector('(div.class)')).toBe(false)
        })

        test('should return false for CSS selectors', () => {
            expect(isXPathSelector('.class')).toBe(false)
            expect(isXPathSelector('#id')).toBe(false)
            expect(isXPathSelector('button')).toBe(false)
            expect(isXPathSelector('[data-test]')).toBe(false)
        })

        test('should return false for non-string values', () => {
            expect(isXPathSelector(null)).toBe(false)
            expect(isXPathSelector(undefined)).toBe(false)
            expect(isXPathSelector(123 as unknown as string)).toBe(false)
            expect(isXPathSelector({} as unknown as string)).toBe(false)
        })

        test('should return false for empty string', () => {
            expect(isXPathSelector('')).toBe(false)
        })
    })

    describe('parseOptimizedSelector', () => {
        test('should parse accessibility ID selector', () => {
            const result = parseOptimizedSelector('~my-accessibility-id')
            expect(result).toEqual({
                using: 'accessibility id',
                value: 'my-accessibility-id'
            })
        })

        test('should parse iOS predicate string selector', () => {
            const result = parseOptimizedSelector('-ios predicate string:type == "XCUIElementTypeButton"')
            expect(result).toEqual({
                using: '-ios predicate string',
                value: 'type == "XCUIElementTypeButton"'
            })
        })

        test('should parse iOS class chain selector', () => {
            const result = parseOptimizedSelector('-ios class chain:**/XCUIElementTypeButton')
            expect(result).toEqual({
                using: '-ios class chain',
                value: '**/XCUIElementTypeButton'
            })
        })

        test('should return null for unknown selector type', () => {
            expect(parseOptimizedSelector('//xpath')).toBeNull()
            expect(parseOptimizedSelector('.class')).toBeNull()
            expect(parseOptimizedSelector('#id')).toBeNull()
        })

        test('should return null for empty string', () => {
            expect(parseOptimizedSelector('')).toBeNull()
        })

        test('should handle accessibility ID with tilde only', () => {
            const result = parseOptimizedSelector('~')
            expect(result).toEqual({
                using: 'accessibility id',
                value: ''
            })
        })
    })
})

import { describe, expect, test } from 'vitest'
import {
    detectUnmappableXPathFeatures,
    isComplexXPath,
    extractElementTypeFromXPath,
    isWildcardXPath
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-detection.js'

describe('xpath-detection', () => {
    describe('detectUnmappableXPathFeatures', () => {
        test('should return empty array for mappable XPath', () => {
            expect(detectUnmappableXPathFeatures('//XCUIElementTypeButton[@name="test"]')).toEqual([])
        })

        test('should detect ancestor axis', () => {
            expect(detectUnmappableXPathFeatures('//ancestor::div')).toContain('ancestor axis')
        })

        test('should detect ancestor-or-self axis', () => {
            expect(detectUnmappableXPathFeatures('//ancestor-or-self::div')).toContain('ancestor-or-self axis')
        })

        test('should detect following-sibling axis', () => {
            expect(detectUnmappableXPathFeatures('//following-sibling::div')).toContain('following-sibling axis')
        })

        test('should detect preceding-sibling axis', () => {
            expect(detectUnmappableXPathFeatures('//preceding-sibling::div')).toContain('preceding-sibling axis')
        })

        test('should detect following axis', () => {
            expect(detectUnmappableXPathFeatures('//following::div')).toContain('following axis')
        })

        test('should detect preceding axis', () => {
            expect(detectUnmappableXPathFeatures('//preceding::div')).toContain('preceding axis')
        })

        test('should detect parent axis', () => {
            expect(detectUnmappableXPathFeatures('//parent::div')).toContain('parent axis')
        })

        test('should detect normalize-space function', () => {
            expect(detectUnmappableXPathFeatures('//div[normalize-space(@name)="test"]')).toContain('normalize-space() function')
        })

        test('should detect position function', () => {
            expect(detectUnmappableXPathFeatures('//div[position()=1]')).toContain('position() function')
        })

        test('should detect count function', () => {
            expect(detectUnmappableXPathFeatures('//div[count(@class)>0]')).toContain('count() function')
        })

        test('should detect multiple unmappable features', () => {
            const result = detectUnmappableXPathFeatures('//ancestor::div[normalize-space(@name)="test"]')
            expect(result).toContain('ancestor axis')
            expect(result).toContain('normalize-space() function')
        })

        test('should detect complex substring not starting at position 1', () => {
            expect(detectUnmappableXPathFeatures('//div[substring(@name, 2, 5)="test"]'))
                .toContain('complex substring() function (not starting at position 1)')
        })

        test('should not detect substring starting at position 1', () => {
            expect(detectUnmappableXPathFeatures('//div[substring(@name, 1, 5)="test"]'))
                .not.toContain('complex substring() function (not starting at position 1)')
        })

        test('should not detect substring(text(), 1, n)', () => {
            expect(detectUnmappableXPathFeatures('//div[substring(text(), 1, 5)="test"]'))
                .not.toContain('complex substring() function (not starting at position 1)')
        })
    })

    describe('isComplexXPath', () => {
        test('should return false for simple XPath', () => {
            expect(isComplexXPath('//XCUIElementTypeButton[@name="test"]')).toBe(false)
        })

        test('should detect OR condition', () => {
            expect(isComplexXPath('//div[@name="test" or @name="other"]')).toBe(true)
        })

        test('should detect AND condition', () => {
            expect(isComplexXPath('//div[@name="test" and @id="test"]')).toBe(true)
        })

        test('should detect contains function', () => {
            expect(isComplexXPath('//div[contains(@name, "test")]')).toBe(true)
        })

        test('should detect starts-with function', () => {
            expect(isComplexXPath('//div[starts-with(@name, "test")]')).toBe(true)
        })

        test('should detect ends-with function', () => {
            expect(isComplexXPath('//div[ends-with(@name, "test")]')).toBe(true)
        })

        test('should detect text() function', () => {
            expect(isComplexXPath('//div[text()="test"]')).toBe(true)
        })

        test('should detect substring function', () => {
            expect(isComplexXPath('//div[substring(@name, 1, 5)="test"]')).toBe(true)
        })

        test('should detect nested brackets', () => {
            expect(isComplexXPath('//div[@name="test"][@id="test"]')).toBe(true)
        })
    })

    describe('extractElementTypeFromXPath', () => {
        test('should extract element type from XPath', () => {
            expect(extractElementTypeFromXPath('//XCUIElementTypeButton[@name="test"]')).toBe('XCUIElementTypeButton')
        })

        test('should extract different element types', () => {
            expect(extractElementTypeFromXPath('//XCUIElementTypeTextField[@name="test"]')).toBe('XCUIElementTypeTextField')
            expect(extractElementTypeFromXPath('//XCUIElementTypeStaticText[@name="test"]')).toBe('XCUIElementTypeStaticText')
        })

        test('should return null when no element type found', () => {
            expect(extractElementTypeFromXPath('//*[@name="test"]')).toBeNull()
            expect(extractElementTypeFromXPath('//div[@name="test"]')).toBeNull()
        })

        test('should return null for empty string', () => {
            expect(extractElementTypeFromXPath('')).toBeNull()
        })
    })

    describe('isWildcardXPath', () => {
        test('should return true for wildcard XPath', () => {
            expect(isWildcardXPath('//*[@name="test"]')).toBe(true)
            expect(isWildcardXPath('//*')).toBe(true)
        })

        test('should return false for non-wildcard XPath', () => {
            expect(isWildcardXPath('//XCUIElementTypeButton[@name="test"]')).toBe(false)
            expect(isWildcardXPath('//XCUIElementTypeButton')).toBe(false)
            expect(isWildcardXPath('//div[@name="test"]')).toBe(false)
        })

        test('should return false for empty string', () => {
            expect(isWildcardXPath('')).toBe(false)
        })
    })
})

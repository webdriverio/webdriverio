import { describe, expect, test } from 'vitest'
import { detectUnmappableXPathFeatures } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-detection.js'

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

        test('should detect a top-level union operator', () => {
            expect(detectUnmappableXPathFeatures('//XCUIElementTypeButton | //XCUIElementTypeCell'))
                .toContain('union operator (|)')
        })

        test('should ignore a pipe inside a quoted attribute', () => {
            expect(detectUnmappableXPathFeatures('//XCUIElementTypeButton[@name="a|b"]')).toEqual([])
        })
    })
})

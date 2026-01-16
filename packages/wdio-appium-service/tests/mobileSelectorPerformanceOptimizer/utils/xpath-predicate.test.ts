import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
    convertXPathToPredicateString,
    convertXPathToAccessibilityId
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-predicate.js'
import * as xpathConditions from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-conditions.js'
import * as xpathDetection from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-detection.js'

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-conditions.js', () => ({
    extractXPathConditions: vi.fn(),
    groupOrConditions: vi.fn()
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-detection.js', () => ({
    extractElementTypeFromXPath: vi.fn()
}))

describe('xpath-predicate', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })
    describe('convertXPathToPredicateString', () => {
        test('should return predicate string with element type and conditions', () => {
            vi.mocked(xpathDetection.extractElementTypeFromXPath).mockReturnValue('XCUIElementTypeButton')
            vi.mocked(xpathConditions.extractXPathConditions).mockReturnValue([
                { attribute: 'name', operator: '=', value: 'Submit' }
            ])
            vi.mocked(xpathConditions.groupOrConditions).mockReturnValue(["name == 'Submit'"])

            const result = convertXPathToPredicateString('//XCUIElementTypeButton[@name="Submit"]')

            expect(result).toEqual({
                selector: "-ios predicate string:type == 'XCUIElementTypeButton' AND name == 'Submit'"
            })
        })

        test('should return predicate string with only element type', () => {
            vi.mocked(xpathDetection.extractElementTypeFromXPath).mockReturnValue('XCUIElementTypeButton')
            vi.mocked(xpathConditions.extractXPathConditions).mockReturnValue([])
            vi.mocked(xpathConditions.groupOrConditions).mockReturnValue([])

            const result = convertXPathToPredicateString('//XCUIElementTypeButton')

            expect(result).toEqual({
                selector: "-ios predicate string:type == 'XCUIElementTypeButton'"
            })
        })

        test('should return predicate string with only conditions', () => {
            vi.mocked(xpathDetection.extractElementTypeFromXPath).mockReturnValue(null)
            vi.mocked(xpathConditions.extractXPathConditions).mockReturnValue([
                { attribute: 'name', operator: '=', value: 'Submit' }
            ])
            vi.mocked(xpathConditions.groupOrConditions).mockReturnValue(["name == 'Submit'"])

            const result = convertXPathToPredicateString('//*[@name="Submit"]')

            expect(result).toEqual({
                selector: "-ios predicate string:name == 'Submit'"
            })
        })

        test('should return null when no element type and no conditions', () => {
            vi.mocked(xpathDetection.extractElementTypeFromXPath).mockReturnValue(null)
            vi.mocked(xpathConditions.extractXPathConditions).mockReturnValue([])

            expect(convertXPathToPredicateString('//*')).toBeNull()
        })

        test('should return null when predicateParts length is 0 after grouping', () => {
            vi.mocked(xpathDetection.extractElementTypeFromXPath).mockReturnValue(null)
            vi.mocked(xpathConditions.extractXPathConditions).mockReturnValue([
                { attribute: 'name', operator: '=', value: 'Submit' }
            ])
            vi.mocked(xpathConditions.groupOrConditions).mockReturnValue([])

            expect(convertXPathToPredicateString('//*[@name="Submit"]')).toBeNull()
        })
    })

    describe('convertXPathToAccessibilityId', () => {
        test('should extract accessibility ID from @name attribute', () => {
            expect(convertXPathToAccessibilityId('//*[@name="Submit"]')).toBe('Submit')
        })

        test('should extract accessibility ID from @label attribute when @name not present', () => {
            expect(convertXPathToAccessibilityId('//*[@label="Submit"]')).toBe('Submit')
        })

        test('should return null when no @name or @label', () => {
            expect(convertXPathToAccessibilityId('//XCUIElementTypeButton[@id="test"]')).toBeNull()
        })
    })
})

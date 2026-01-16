import { describe, expect, test } from 'vitest'
import {
    extractXPathConditions,
    convertConditionToPredicate,
    groupOrConditions
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-conditions.js'

describe('xpath-conditions', () => {
    describe('extractXPathConditions', () => {
        test('should return empty array when no brackets', () => {
            expect(extractXPathConditions('//XCUIElementTypeButton')).toEqual([])
        })

        test('should extract simple attribute condition', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[@name="Submit"]')
            expect(result).toEqual([{ attribute: 'name', operator: '=', value: 'Submit' }])
        })

        test('should extract multiple attribute conditions', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[@name="Submit"][@enabled="true"]')
            expect(result).toHaveLength(2)
            expect(result).toContainEqual({ attribute: 'name', operator: '=', value: 'Submit' })
            expect(result).toContainEqual({ attribute: 'enabled', operator: '=', value: 'true' })
        })

        test('should extract OR conditions', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[@name="Allow" or @name="OK"]')
            expect(result).toHaveLength(2)
            expect(result).toContainEqual({ attribute: 'name', operator: '=', value: 'Allow', logicalOp: 'OR' })
            expect(result).toContainEqual({ attribute: 'name', operator: '=', value: 'OK', logicalOp: 'OR' })
        })

        test('should extract contains() function', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[contains(@name, "Submit")]')
            expect(result).toContainEqual({ attribute: 'name', operator: 'contains', value: 'Submit' })
        })

        test('should extract starts-with() function', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[starts-with(@name, "Submit")]')
            expect(result).toContainEqual({ attribute: 'name', operator: 'beginswith', value: 'Submit' })
        })

        test('should extract ends-with() function', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[ends-with(@name, "Submit")]')
            expect(result).toContainEqual({ attribute: 'name', operator: 'endswith', value: 'Submit' })
        })

        test('should extract text() = value', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[text()="Submit"]')
            expect(result).toContainEqual({ attribute: 'label', operator: '=', value: 'Submit' })
        })

        test('should extract contains(text(), value)', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[contains(text(), "Submit")]')
            expect(result).toContainEqual({ attribute: 'label', operator: 'contains', value: 'Submit' })
        })

        test('should extract substring(text(), 1, n) = value', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[substring(text(), 1, 5)="Submit"]')
            expect(result).toContainEqual({ attribute: 'label', operator: 'beginswith', value: 'Submit' })
        })

        test('should extract substring(@attr, 1, n) = value', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[substring(@name, 1, 5)="Submit"]')
            expect(result).toContainEqual({ attribute: 'name', operator: 'beginswith', value: 'Submit' })
        })

        test('should handle multiple OR conditions for same attribute', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[@name="A" or @name="B" or @name="C"]')
            const nameConditions = result.filter(c => c.attribute === 'name' && c.logicalOp === 'OR')
            expect(nameConditions.length).toBeGreaterThanOrEqual(2)
        })

        test('should deduplicate first value when same value appears in OR condition', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[@name="A" or @name="B"][@name="A" or @name="C"]')
            const nameConditions = result.filter(c => c.attribute === 'name' && c.logicalOp === 'OR')
            const aCount = nameConditions.filter(c => c.value === 'A').length
            expect(aCount).toBe(1)
        })

        test('should deduplicate second value when same value appears in OR condition', () => {
            const result = extractXPathConditions('//XCUIElementTypeButton[@name="A" or @name="B"][@name="C" or @name="B"]')
            const nameConditions = result.filter(c => c.attribute === 'name' && c.logicalOp === 'OR')
            const bCount = nameConditions.filter(c => c.value === 'B').length
            expect(bCount).toBe(1)
        })
    })

    describe('convertConditionToPredicate', () => {
        test('should convert equals operator with single quotes', () => {
            const result = convertConditionToPredicate({ attribute: 'name', operator: '=', value: 'Submit' }, 'single')
            expect(result).toBe("name == 'Submit'")
        })

        test('should convert equals operator with double quotes', () => {
            const result = convertConditionToPredicate({ attribute: 'name', operator: '=', value: 'Submit' }, 'double')
            expect(result).toBe('name == "Submit"')
        })

        test('should convert not equals operator', () => {
            const result = convertConditionToPredicate({ attribute: 'name', operator: '!=', value: 'Submit' })
            expect(result).toBe("name != 'Submit'")
        })

        test('should convert contains operator', () => {
            const result = convertConditionToPredicate({ attribute: 'name', operator: 'contains', value: 'Submit' })
            expect(result).toBe("name CONTAINS 'Submit'")
        })

        test('should convert beginswith operator', () => {
            const result = convertConditionToPredicate({ attribute: 'name', operator: 'beginswith', value: 'Submit' })
            expect(result).toBe("name BEGINSWITH 'Submit'")
        })

        test('should convert endswith operator', () => {
            const result = convertConditionToPredicate({ attribute: 'name', operator: 'endswith', value: 'Submit' })
            expect(result).toBe("name ENDSWITH 'Submit'")
        })

        test('should convert greater than operator', () => {
            const result = convertConditionToPredicate({ attribute: 'value', operator: '>', value: '10' })
            expect(result).toBe("value > '10'")
        })

        test('should convert less than operator', () => {
            const result = convertConditionToPredicate({ attribute: 'value', operator: '<', value: '10' })
            expect(result).toBe("value < '10'")
        })

        test('should convert greater than or equal operator', () => {
            const result = convertConditionToPredicate({ attribute: 'value', operator: '>=', value: '10' })
            expect(result).toBe("value >= '10'")
        })

        test('should convert less than or equal operator', () => {
            const result = convertConditionToPredicate({ attribute: 'value', operator: '<=', value: '10' })
            expect(result).toBe("value <= '10'")
        })

        test('should default to equals for unknown operator', () => {
            const result = convertConditionToPredicate({ attribute: 'name', operator: 'unknown', value: 'Submit' })
            expect(result).toBe("name == 'Submit'")
        })

        test('should handle <> as not equals', () => {
            const result = convertConditionToPredicate({ attribute: 'name', operator: '<>', value: 'Submit' })
            expect(result).toBe("name != 'Submit'")
        })
    })

    describe('groupOrConditions', () => {
        test('should group OR conditions together', () => {
            const conditions = [
                { attribute: 'name', operator: '=', value: 'Allow', logicalOp: 'OR' as const },
                { attribute: 'name', operator: '=', value: 'OK', logicalOp: 'OR' as const },
                { attribute: 'enabled', operator: '=', value: 'true' }
            ]
            const result = groupOrConditions(conditions)
            expect(result).toEqual(["(name == 'Allow' OR name == 'OK')", "enabled == 'true'"])
        })

        test('should handle single OR condition without grouping parentheses', () => {
            const conditions = [{ attribute: 'name', operator: '=', value: 'Allow', logicalOp: 'OR' as const }]
            const result = groupOrConditions(conditions)
            expect(result).toEqual(["name == 'Allow'"])
        })

        test('should handle regular conditions without OR', () => {
            const conditions = [
                { attribute: 'name', operator: '=', value: 'Submit' },
                { attribute: 'enabled', operator: '=', value: 'true' }
            ]
            const result = groupOrConditions(conditions)
            expect(result).toEqual(["name == 'Submit'", "enabled == 'true'"])
        })

        test('should use double quotes for class chain style', () => {
            const conditions = [{ attribute: 'name', operator: '=', value: 'Submit' }]
            const result = groupOrConditions(conditions, 'double')
            expect(result).toEqual(['name == "Submit"'])
        })

        test('should handle multiple OR groups for different attributes', () => {
            const conditions = [
                { attribute: 'name', operator: '=', value: 'A', logicalOp: 'OR' as const },
                { attribute: 'name', operator: '=', value: 'B', logicalOp: 'OR' as const },
                { attribute: 'type', operator: '=', value: 'C', logicalOp: 'OR' as const },
                { attribute: 'type', operator: '=', value: 'D', logicalOp: 'OR' as const }
            ]
            const result = groupOrConditions(conditions)
            expect(result).toContainEqual("(name == 'A' OR name == 'B')")
            expect(result).toContainEqual("(type == 'C' OR type == 'D')")
        })

        test('should return empty array for empty conditions', () => {
            expect(groupOrConditions([])).toEqual([])
        })
    })
})

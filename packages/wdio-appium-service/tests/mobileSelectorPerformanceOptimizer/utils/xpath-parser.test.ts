import { describe, expect, test } from 'vitest'
import { parseXPathToSegments } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-parser.js'

describe('xpath-parser', () => {
    describe('parseXPathToSegments', () => {
        test('should parse simple single-segment XPath with descendant axis', () => {
            const result = parseXPathToSegments('//XCUIElementTypeButton[@name="Submit"]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeButton',
                    conditions: [{ attribute: 'name', operator: '=', value: 'Submit' }],
                    index: undefined
                }
            ])
        })

        test('should parse wildcard element', () => {
            const result = parseXPathToSegments('//*[@name="test"]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: '*',
                    conditions: [{ attribute: 'name', operator: '=', value: 'test' }],
                    index: undefined
                }
            ])
        })

        test('should parse two-segment XPath with parent-child relationship', () => {
            const result = parseXPathToSegments('//*[@name="valueId"]/*[contains(@name, "valueName")]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: '*',
                    conditions: [{ attribute: 'name', operator: '=', value: 'valueId' }],
                    index: undefined
                },
                {
                    axis: '/',
                    element: '*',
                    conditions: [{ attribute: 'name', operator: 'contains', value: 'valueName' }],
                    index: undefined
                }
            ])
        })

        test('should parse two-segment XPath with descendant relationships', () => {
            const result = parseXPathToSegments('//XCUIElementTypeButton//*[@label="value"]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeButton',
                    conditions: [],
                    index: undefined
                },
                {
                    axis: '//',
                    element: '*',
                    conditions: [{ attribute: 'label', operator: '=', value: 'value' }],
                    index: undefined
                }
            ])
        })

        test('should parse XPath with positional index', () => {
            const result = parseXPathToSegments('(//XCUIElementTypeButton[@name="Pizza" or @name="Choose a pizza"])[1]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeButton',
                    conditions: [
                        { attribute: 'name', operator: '=', value: 'Pizza', logicalOp: 'OR' },
                        { attribute: 'name', operator: '=', value: 'Choose a pizza', logicalOp: 'OR' }
                    ],
                    index: 1
                }
            ])
        })

        test('should parse multi-segment XPath with element types', () => {
            const result = parseXPathToSegments('//XCUIElementTypeNavigationBar[@name="SELECT ADDRESS"]/XCUIElementTypeStaticText[@name="SELECT ADDRESS"]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeNavigationBar',
                    conditions: [{ attribute: 'name', operator: '=', value: 'SELECT ADDRESS' }],
                    index: undefined
                },
                {
                    axis: '/',
                    element: 'XCUIElementTypeStaticText',
                    conditions: [{ attribute: 'name', operator: '=', value: 'SELECT ADDRESS' }],
                    index: undefined
                }
            ])
        })

        test('should parse XPath with AND conditions', () => {
            const result = parseXPathToSegments('//XCUIElementTypeTextField[@name="value_text" and @label="Email address"]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeTextField',
                    conditions: [
                        { attribute: 'name', operator: '=', value: 'value_text' },
                        { attribute: 'label', operator: '=', value: 'Email address' }
                    ],
                    index: undefined
                }
            ])
        })

        test('should parse XPath with starts-with function', () => {
            const result = parseXPathToSegments('//XCUIElementTypeButton[starts-with(@label, "SHOW ")]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeButton',
                    conditions: [{ attribute: 'label', operator: 'beginswith', value: 'SHOW ' }],
                    index: undefined
                }
            ])
        })

        test('should parse XPath with contains function', () => {
            const result = parseXPathToSegments('//*[contains(@name, "test")]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: '*',
                    conditions: [{ attribute: 'name', operator: 'contains', value: 'test' }],
                    index: undefined
                }
            ])
        })

        test('should parse element without conditions', () => {
            const result = parseXPathToSegments('//XCUIElementTypeButton')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeButton',
                    conditions: [],
                    index: undefined
                }
            ])
        })

        test('should parse three-segment XPath', () => {
            const result = parseXPathToSegments('//XCUIElementTypeTable/XCUIElementTypeCell/*[@name="test"]')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeTable',
                    conditions: [],
                    index: undefined
                },
                {
                    axis: '/',
                    element: 'XCUIElementTypeCell',
                    conditions: [],
                    index: undefined
                },
                {
                    axis: '/',
                    element: '*',
                    conditions: [{ attribute: 'name', operator: '=', value: 'test' }],
                    index: undefined
                }
            ])
        })

        test('should parse XPath with index on intermediate segment', () => {
            const result = parseXPathToSegments('(//XCUIElementTypeSwitch[@name=" SMS"])[1]/XCUIElementTypeSwitch')
            expect(result).toEqual([
                {
                    axis: '//',
                    element: 'XCUIElementTypeSwitch',
                    conditions: [{ attribute: 'name', operator: '=', value: ' SMS' }],
                    index: 1
                },
                {
                    axis: '/',
                    element: 'XCUIElementTypeSwitch',
                    conditions: [],
                    index: undefined
                }
            ])
        })

        test('should return null for XPath with unmappable axes', () => {
            expect(parseXPathToSegments('//*[@name="test"]/following-sibling::*')).toBeNull()
            expect(parseXPathToSegments('//*[@name="test"]/preceding-sibling::*')).toBeNull()
            expect(parseXPathToSegments('//*[@name="test"]/..')).toBeNull()
            expect(parseXPathToSegments('//*[@name="test"]/ancestor::*')).toBeNull()
        })

        test('should return null for XPath with union operator', () => {
            expect(parseXPathToSegments('//XCUIElementTypeButton | //XCUIElementTypeCell')).toBeNull()
        })
    })
})

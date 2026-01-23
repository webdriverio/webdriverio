import { describe, expect, test } from 'vitest'
import { convertXPathToClassChain } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-class-chain.js'

describe('xpath-class-chain', () => {
    describe('convertXPathToClassChain', () => {
        test('should convert simple XPath with element type', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"]')).toMatchSnapshot()
        })

        test('should convert wildcard XPath', () => {
            expect(convertXPathToClassChain('//*[@name="Submit"]')).toMatchSnapshot()
        })

        test('should convert XPath with only element type', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton')).toMatchSnapshot()
        })

        test('should convert XPath with multiple attributes', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][@enabled="true"]')).toMatchSnapshot()
        })

        test('should handle position index', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][1]')).toMatchSnapshot()
        })

        test('should handle position index greater than 1', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][2]')).toMatchSnapshot()
        })

        test('should not include position index if 0', () => {
            const result = convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][0]')

            expect(result?.selector).not.toContain('[0]')
        })

        test('should handle last() function', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][last()]')).toMatchSnapshot()
        })

        test('should return null when no element type or wildcard', () => {
            expect(convertXPathToClassChain('//div[@name="test"]')).toBeNull()
        })

        test('should handle OR conditions', () => {
            const result = convertXPathToClassChain('//XCUIElementTypeButton[@name="Allow" or @name="OK"]')

            expect(result).toMatchSnapshot()
        })

        describe('multi-segment XPath conversion', () => {
            test('should convert two-segment XPath with parent-child relationship', () => {
                const result = convertXPathToClassChain('//*[@name="valueId"]/*[contains(@name, "valueName")]')

                expect(result).toMatchSnapshot()
            })

            test('should convert two-segment XPath with descendant relationships', () => {
                const result = convertXPathToClassChain('//XCUIElementTypeButton//*[@label="value"]')

                expect(result).toMatchSnapshot()
            })

            test('should convert multi-segment XPath with element types', () => {
                const result = convertXPathToClassChain('//XCUIElementTypeNavigationBar[@name="SELECT ADDRESS"]/XCUIElementTypeStaticText[@name="SELECT ADDRESS"]')

                expect(result).toMatchSnapshot()
            })

            test('should convert three-segment XPath', () => {
                const result = convertXPathToClassChain('//XCUIElementTypeTable/XCUIElementTypeCell/*[@name="test"]')

                expect(result).toMatchSnapshot()
            })

            test('should convert XPath with index on grouped expression', () => {
                const result = convertXPathToClassChain('(//XCUIElementTypeButton[@name="Pizza" or @name="Choose a pizza"])[1]')

                expect(result).toMatchSnapshot()
            })

            test('should convert XPath with index on intermediate segment followed by child', () => {
                const result = convertXPathToClassChain('(//XCUIElementTypeSwitch[@name=" SMS"])[1]/XCUIElementTypeSwitch')

                expect(result).toMatchSnapshot()
            })

            test('should handle segment without conditions followed by segment with conditions', () => {
                const result = convertXPathToClassChain('//XCUIElementTypeButton//*[@name="test"]')

                expect(result).toMatchSnapshot()
            })
        })
    })
})

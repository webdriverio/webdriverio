import { describe, expect, test } from 'vitest'
import { convertXPathToClassChain } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-class-chain.js'

describe('xpath-class-chain', () => {
    describe('convertXPathToClassChain', () => {
        test('should convert simple XPath with element type', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"]')).toEqual({
                selector: '-ios class chain:**/XCUIElementTypeButton[`name == "Submit"`]'
            })
        })

        test('should convert wildcard XPath', () => {
            expect(convertXPathToClassChain('//*[@name="Submit"]')).toEqual({
                selector: '-ios class chain:**/*[`name == "Submit"`]'
            })
        })

        test('should convert XPath with only element type', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton')).toEqual({
                selector: '-ios class chain:**/XCUIElementTypeButton'
            })
        })

        test('should convert XPath with multiple attributes', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][@enabled="true"]')).toEqual({
                selector: '-ios class chain:**/XCUIElementTypeButton[`name == "Submit" AND enabled == "true"`]'
            })
        })

        test('should handle position index', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][1]')).toEqual({
                selector: '-ios class chain:**/XCUIElementTypeButton[`name == "Submit"`][1]'
            })
        })

        test('should handle position index greater than 1', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][2]')).toEqual({
                selector: '-ios class chain:**/XCUIElementTypeButton[`name == "Submit"`][2]'
            })
        })

        test('should not include position index if 0', () => {
            const result = convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][0]')
            expect(result?.selector).not.toContain('[0]')
        })

        test('should handle last() function', () => {
            expect(convertXPathToClassChain('//XCUIElementTypeButton[@name="Submit"][last()]')).toEqual({
                selector: '-ios class chain:**/XCUIElementTypeButton[`name == "Submit"`][last()]'
            })
        })

        test('should return null when no element type or wildcard', () => {
            expect(convertXPathToClassChain('//div[@name="test"]')).toBeNull()
        })

        test('should handle OR conditions', () => {
            const result = convertXPathToClassChain('//XCUIElementTypeButton[@name="Allow" or @name="OK"]')
            expect(result?.selector).toContain('-ios class chain:**/XCUIElementTypeButton')
            expect(result?.selector).toContain('Allow')
            expect(result?.selector).toContain('OK')
        })

        describe('multi-segment XPath conversion', () => {
            test('should convert two-segment XPath with parent-child relationship', () => {
                const result = convertXPathToClassChain('//*[@name="valueId"]/*[contains(@name, "valueName")]')
                expect(result).toEqual({
                    selector: '-ios class chain:**/*[`name == "valueId"`]/*[`name CONTAINS "valueName"`]'
                })
            })

            test('should convert two-segment XPath with descendant relationships', () => {
                const result = convertXPathToClassChain('//XCUIElementTypeButton//*[@label="value"]')
                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton/**/*[`label == "value"`]'
                })
            })

            test('should convert multi-segment XPath with element types', () => {
                const result = convertXPathToClassChain('//XCUIElementTypeNavigationBar[@name="SELECT ADDRESS"]/XCUIElementTypeStaticText[@name="SELECT ADDRESS"]')
                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeNavigationBar[`name == "SELECT ADDRESS"`]/XCUIElementTypeStaticText[`name == "SELECT ADDRESS"`]'
                })
            })

            test('should convert three-segment XPath', () => {
                const result = convertXPathToClassChain('//XCUIElementTypeTable/XCUIElementTypeCell/*[@name="test"]')
                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeTable/XCUIElementTypeCell/*[`name == "test"`]'
                })
            })

            test('should convert XPath with index on grouped expression', () => {
                const result = convertXPathToClassChain('(//XCUIElementTypeButton[@name="Pizza" or @name="Choose a pizza"])[1]')
                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton[`(name == "Pizza" OR name == "Choose a pizza")`][1]'
                })
            })

            test('should convert XPath with index on intermediate segment followed by child', () => {
                const result = convertXPathToClassChain('(//XCUIElementTypeSwitch[@name=" SMS"])[1]/XCUIElementTypeSwitch')
                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeSwitch[`name == " SMS"`][1]/XCUIElementTypeSwitch'
                })
            })

            test('should handle segment without conditions followed by segment with conditions', () => {
                const result = convertXPathToClassChain('//XCUIElementTypeButton//*[@name="test"]')
                expect(result).toEqual({
                    selector: '-ios class chain:**/XCUIElementTypeButton/**/*[`name == "test"`]'
                })
            })
        })
    })
})

import { describe, expect, test, vi } from 'vitest'
import { convertXPathToClassChain } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-class-chain.js'
import { convertXPathToOptimizedSelector } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-converter.js'

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        debug: vi.fn()
    }))
}))

/**
 * Tests for community-provided iOS XPath selectors.
 * These represent real-world usage patterns from the WDIO/Appium community.
 */
describe('Community iOS XPath Selectors', () => {
    describe('Multi-segment hierarchical XPaths (now supported)', () => {
        test('1. //*[@name="valueId"]/*[contains(@name, "valueName")] - parent with child containing', () => {
            const xpath = '//*[@name="valueId"]/*[contains(@name, "valueName")]'
            const result = convertXPathToClassChain(xpath)

            expect(result).toMatchSnapshot()
        })

        test('4. //*[contains(@name, "value")]//XCUIElementTypeText[2] - descendant with index', () => {
            const xpath = '//*[contains(@name, "value")]//XCUIElementTypeText[2]'
            const result = convertXPathToClassChain(xpath)

            expect(result).toMatchSnapshot()
        })

        test('7. //XCUIElementTypeButton//*[@label="value"] - element type with descendant', () => {
            const xpath = '//XCUIElementTypeButton//*[@label="value"]'
            const result = convertXPathToClassChain(xpath)

            expect(result).toMatchSnapshot()
        })

        test('10. //XCUIElementTypeNavigationBar[@name="SELECT ADDRESS"]/XCUIElementTypeStaticText[@name="SELECT ADDRESS"] - two element types', () => {
            const xpath = '//XCUIElementTypeNavigationBar[@name="SELECT ADDRESS"]/XCUIElementTypeStaticText[@name="SELECT ADDRESS"]'
            const result = convertXPathToClassChain(xpath)

            expect(result).toMatchSnapshot()
        })

        test('13. (//XCUIElementTypeSwitch[@name=" SMS"])[1]/XCUIElementTypeSwitch - grouped with index then child', () => {
            const xpath = '(//XCUIElementTypeSwitch[@name=" SMS"])[1]/XCUIElementTypeSwitch'
            const result = convertXPathToClassChain(xpath)

            expect(result).toMatchSnapshot()
        })
    })

    describe('Single-segment XPaths (already supported)', () => {
        test('8. (//XCUIElementTypeButton[@name="Pizza" or @name="Choose a pizza"])[1] - OR conditions with index', () => {
            const xpath = '(//XCUIElementTypeButton[@name="Pizza" or @name="Choose a pizza"])[1]'
            const result = convertXPathToClassChain(xpath)

            expect(result?.selector).toContain('-ios class chain:**/XCUIElementTypeButton')
            expect(result?.selector).toContain('Pizza')
            expect(result?.selector).toContain('Choose a pizza')
            expect(result?.selector).toContain('[1]')
        })

        test('9. //XCUIElementTypeButton[@name="T&Cs"] - simple element with name', async () => {
            const xpath = '//XCUIElementTypeButton[@name="T&Cs"]'
            const mockBrowser = {
                getPageSource: vi.fn().mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
                    <XCUIElementTypeApplication>
                        <XCUIElementTypeButton name="T&amp;Cs" label="T&amp;Cs"></XCUIElementTypeButton>
                    </XCUIElementTypeApplication>`)
            } as any

            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBeDefined()
        })

        test('11. //XCUIElementTypeTextField[@name="value_text" and @label="Email address"] - AND conditions', async () => {
            const xpath = '//XCUIElementTypeTextField[@name="value_text" and @label="Email address"]'
            const mockBrowser = {
                getPageSource: vi.fn().mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
                    <XCUIElementTypeApplication>
                        <XCUIElementTypeTextField name="value_text" label="Email address"></XCUIElementTypeTextField>
                    </XCUIElementTypeApplication>`)
            } as any

            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBe('~value_text')
        })

        test('14. //XCUIElementTypeButton[starts-with(@label, "SHOW ")] - starts-with function', async () => {
            const xpath = '//XCUIElementTypeButton[starts-with(@label, "SHOW ")]'
            const mockBrowser = {
                getPageSource: vi.fn().mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
                    <XCUIElementTypeApplication>
                        <XCUIElementTypeButton name="ShowBtn" label="SHOW MORE"></XCUIElementTypeButton>
                    </XCUIElementTypeApplication>`)
            } as any

            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBe('~ShowBtn')
        })
    })

    describe('Unmappable XPaths (sibling/parent axes)', () => {
        const createMockBrowser = (pageSource: string) => ({
            getPageSource: vi.fn().mockResolvedValue(pageSource)
        } as any)

        test('2. //*[@name="value"]/following-sibling::*[1] - following-sibling axis', async () => {
            const xpath = '//*[@name="value"]/following-sibling::*[1]'
            const mockBrowser = createMockBrowser('<XCUIElementTypeApplication></XCUIElementTypeApplication>')
            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBeNull()
            expect(result?.warning).toContain('following-sibling axis')
        })

        test('3. //*[@name="value"]/following-sibling::*//XCUIElementTypeImage - following-sibling with descendant', async () => {
            const xpath = '//*[@name="value"]/following-sibling::*//XCUIElementTypeImage'
            const mockBrowser = createMockBrowser('<XCUIElementTypeApplication></XCUIElementTypeApplication>')
            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBeNull()
            expect(result?.warning).toContain('following-sibling axis')
        })

        test('5. //*[@name="value"]/preceding-sibling::* - preceding-sibling axis', async () => {
            const xpath = '//*[@name="value"]/preceding-sibling::*'
            const mockBrowser = createMockBrowser('<XCUIElementTypeApplication></XCUIElementTypeApplication>')
            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBeNull()
            expect(result?.warning).toContain('preceding-sibling axis')
        })

        test('6. //*[@name="value"]/preceding-sibling::*[1] - preceding-sibling with index', async () => {
            const xpath = '//*[@name="value"]/preceding-sibling::*[1]'
            const mockBrowser = createMockBrowser('<XCUIElementTypeApplication></XCUIElementTypeApplication>')
            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBeNull()
            expect(result?.warning).toContain('preceding-sibling axis')
        })

        test('12. (//XCUIElementTypeTextView/../..|//XCUIElementTypeStaticText/../..) - parent traversal and union', async () => {
            const xpath = '(//XCUIElementTypeTextView[@name="Driver instructions (optional)"]/../../..|//XCUIElementTypeStaticText[@name="Add driver instructions (Optional)"]/../..)'
            const mockBrowser = createMockBrowser('<XCUIElementTypeApplication></XCUIElementTypeApplication>')
            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBeNull()
            expect(result?.warning).toContain('parent axis')
        })

        test('15. //XCUIElementTypeStaticText[@name="DELIVERY"]/following-sibling::XCUIElementTypeStaticText[...][1] - following-sibling', async () => {
            const xpath = '//XCUIElementTypeStaticText[@name="DELIVERY"]/following-sibling::XCUIElementTypeStaticText[starts-with(@name,"£") or starts-with(@name,"€")][1]'
            const mockBrowser = createMockBrowser('<XCUIElementTypeApplication></XCUIElementTypeApplication>')
            const result = await convertXPathToOptimizedSelector(xpath, { browser: mockBrowser })

            expect(result?.selector).toBeNull()
            expect(result?.warning).toContain('following-sibling axis')
        })
    })
})

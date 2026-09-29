import { describe, expect, test, vi } from 'vitest'
import { convertXPathToOptimizedSelector } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-converter.js'

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        debug: vi.fn()
    }))
}))

/**
 * Community iOS XPath selectors exercised through page-source conversion,
 * which is the path the optimizer calls.
 */
describe('Community iOS XPath Selectors', () => {
    describe('Single-segment XPaths', () => {
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

import { describe, expect, test, vi, beforeEach } from 'vitest'
import { convertXPathToOptimizedSelector } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-converter.js'
import * as xpathDetection from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-detection.js'
import * as xpathPredicate from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-predicate.js'
import * as xpathClassChain from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-class-chain.js'
import * as xpathPageSource from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source.js'
import * as xpathSelectorBuilder from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-selector-builder.js'
import * as xpathPageSourceExecutor from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source-executor.js'

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        debug: vi.fn()
    }))
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-detection.js', () => ({
    detectUnmappableXPathFeatures: vi.fn(),
    isComplexXPath: vi.fn()
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-predicate.js', () => ({
    convertXPathToAccessibilityId: vi.fn(),
    convertXPathToPredicateString: vi.fn()
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-class-chain.js', () => ({
    convertXPathToClassChain: vi.fn()
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source.js', () => ({
    parseElementFromPageSource: vi.fn()
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-selector-builder.js', () => ({
    buildSelectorFromElementData: vi.fn()
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source-executor.js', () => ({
    findElementByXPathWithFallback: vi.fn()
}))

describe('xpath-converter', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('convertXPathToOptimizedSelector', () => {
        test('should return null for empty xpath', () => {
            expect(convertXPathToOptimizedSelector('')).toBeNull()
        })

        test('should return null for non-string xpath', () => {
            expect(convertXPathToOptimizedSelector(null as any)).toBeNull()
            expect(convertXPathToOptimizedSelector(undefined as any)).toBeNull()
        })

        test('should return warning when unmappable features detected', () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['ancestor axis'])

            const result = convertXPathToOptimizedSelector('//ancestor::div')

            expect(result).toEqual({
                selector: null,
                warning: 'XPath contains unmappable features: ancestor axis. Cannot convert to optimized selector.'
            })
        })

        test('should return accessibility ID for simple XPath', () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
            vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
            vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')

            const result = convertXPathToOptimizedSelector('//*[@name="Submit"]')

            expect(result).toEqual({ selector: '~Submit' })
        })

        test('should return predicate string when accessibility ID not available', () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
            vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(true)
            vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue(null)
            vi.mocked(xpathPredicate.convertXPathToPredicateString).mockReturnValue({
                selector: "-ios predicate string:type == 'XCUIElementTypeButton'"
            })

            const result = convertXPathToOptimizedSelector('//XCUIElementTypeButton[@name="Submit"]')

            expect(result).toEqual({
                selector: "-ios predicate string:type == 'XCUIElementTypeButton'"
            })
        })

        test('should return class chain when predicate string not available', () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
            vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(true)
            vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue(null)
            vi.mocked(xpathPredicate.convertXPathToPredicateString).mockReturnValue(null)
            vi.mocked(xpathClassChain.convertXPathToClassChain).mockReturnValue({
                selector: '-ios class chain:**/XCUIElementTypeButton'
            })

            const result = convertXPathToOptimizedSelector('//XCUIElementTypeButton')

            expect(result).toEqual({
                selector: '-ios class chain:**/XCUIElementTypeButton'
            })
        })

        test('should return warning when no conversion possible', () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
            vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(true)
            vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue(null)
            vi.mocked(xpathPredicate.convertXPathToPredicateString).mockReturnValue(null)
            vi.mocked(xpathClassChain.convertXPathToClassChain).mockReturnValue(null)

            const result = convertXPathToOptimizedSelector('//unknown')

            expect(result).toEqual({
                selector: null,
                warning: 'XPath could not be converted to an optimized selector. Consider using accessibility identifiers or simpler XPath patterns.'
            })
        })

        describe('with page source analysis', () => {
            const mockBrowser = {
                getPageSource: vi.fn().mockResolvedValue('<XCUIElementTypeButton name="Submit"></XCUIElementTypeButton>')
            } as any

            test('should use dynamic analysis when usePageSource is true', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')
                vi.mocked(xpathPageSource.parseElementFromPageSource).mockReturnValue({
                    type: 'XCUIElementTypeButton',
                    attributes: { name: 'Submit' }
                })
                vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                    selector: '~Submit'
                })

                const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: true,
                    browser: mockBrowser
                })

                expect(mockBrowser.getPageSource).toHaveBeenCalled()
                expect(xpathPageSource.parseElementFromPageSource).toHaveBeenCalled()
                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should fallback to static result when page source is empty', async () => {
                mockBrowser.getPageSource.mockResolvedValueOnce('')
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')

                const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: true,
                    browser: mockBrowser
                })

                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should fallback to static result when page source is not string', async () => {
                mockBrowser.getPageSource.mockResolvedValueOnce(null)
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')

                const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: true,
                    browser: mockBrowser
                })

                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should fallback to static result when element not found in page source', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')
                vi.mocked(xpathPageSource.parseElementFromPageSource).mockReturnValue(null)

                const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: true,
                    browser: mockBrowser
                })

                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should fallback to static result when dynamic result has no selector', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')
                vi.mocked(xpathPageSource.parseElementFromPageSource).mockReturnValue({
                    type: 'XCUIElementTypeButton',
                    attributes: { name: 'Submit' }
                })
                vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                    selector: null,
                    warning: 'Could not generate unique selector'
                })

                const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: true,
                    browser: mockBrowser
                })

                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should handle errors in dynamic analysis gracefully', async () => {
                mockBrowser.getPageSource.mockRejectedValueOnce(new Error('Network error'))
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')

                const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: true,
                    browser: mockBrowser
                })

                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should handle non-Error exceptions in dynamic analysis', async () => {
                mockBrowser.getPageSource.mockRejectedValueOnce('String error')
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')

                const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: true,
                    browser: mockBrowser
                })

                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should not use page source when usePageSource is false', () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')

                const result = convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: false,
                    browser: mockBrowser
                })

                expect(mockBrowser.getPageSource).not.toHaveBeenCalled()
                expect(result).toEqual({ selector: '~Submit' })
            })

            test('should not use page source when browser is not provided', () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
                vi.mocked(xpathDetection.isComplexXPath).mockReturnValue(false)
                vi.mocked(xpathPredicate.convertXPathToAccessibilityId).mockReturnValue('Submit')

                const result = convertXPathToOptimizedSelector('//*[@name="Submit"]', {
                    usePageSource: true
                })

                expect(result).toEqual({ selector: '~Submit' })
            })
        })

        describe('unmappable XPath fallback with page source', () => {
            const mockBrowser = {
                getPageSource: vi.fn().mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
<XCUIElementTypeApplication>
  <XCUIElementTypeStaticText name="Label1"></XCUIElementTypeStaticText>
  <XCUIElementTypeButton name="Button1" label="Click Me"></XCUIElementTypeButton>
</XCUIElementTypeApplication>`)
            } as any

            test('should try page source fallback for unmappable XPath when usePageSource is enabled', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['following-sibling axis'])
                vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                    element: {
                        type: 'XCUIElementTypeButton',
                        attributes: { name: 'Button1', label: 'Click Me' }
                    },
                    matchCount: 1
                })
                vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                    selector: '~Button1'
                })

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeStaticText[@name="Label1"]/following-sibling::XCUIElementTypeButton',
                    { usePageSource: true, browser: mockBrowser }
                )

                expect(mockBrowser.getPageSource).toHaveBeenCalled()
                expect(xpathPageSourceExecutor.findElementByXPathWithFallback).toHaveBeenCalled()
                expect(result).toEqual({ selector: '~Button1' })
            })

            test('should return warning with suggestion when element found but not unique', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['following-sibling axis'])
                vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                    element: {
                        type: 'XCUIElementTypeButton',
                        attributes: { name: 'Button1', label: 'Click Me' }
                    },
                    matchCount: 2
                })
                vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                    selector: '~Button1',
                    warning: 'Selector may match multiple elements.'
                })

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeStaticText[@name="Label1"]/following-sibling::XCUIElementTypeButton',
                    { usePageSource: true, browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: expect.stringContaining('XPath matched 2 elements'),
                    suggestion: '~Button1'
                })
            })

            test('should return warning when no element found via page source execution', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['parent axis'])
                vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue(null)

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeButton[@name="Test"]/parent::XCUIElementTypeCell',
                    { usePageSource: true, browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: expect.stringContaining('XPath contains unmappable features: parent axis')
                })
            })

            test('should return standard warning for unmappable XPath when usePageSource is false', () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['following-sibling axis'])

                const result = convertXPathToOptimizedSelector(
                    '//XCUIElementTypeStaticText[@name="Label1"]/following-sibling::XCUIElementTypeButton',
                    { usePageSource: false, browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'XPath contains unmappable features: following-sibling axis. Cannot convert to optimized selector.'
                })
            })

            test('should return standard warning for unmappable XPath when browser not provided', () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['following-sibling axis'])

                const result = convertXPathToOptimizedSelector(
                    '//XCUIElementTypeStaticText[@name="Label1"]/following-sibling::XCUIElementTypeButton',
                    { usePageSource: true }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'XPath contains unmappable features: following-sibling axis. Cannot convert to optimized selector.'
                })
            })

            test('should handle page source execution errors gracefully', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['following-sibling axis'])
                mockBrowser.getPageSource.mockRejectedValueOnce(new Error('Network error'))

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeStaticText[@name="Label1"]/following-sibling::XCUIElementTypeButton',
                    { usePageSource: true, browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'XPath contains unmappable features: following-sibling axis. Cannot convert to optimized selector.'
                })
            })

            test('should return unique selector when match count is 1', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['preceding-sibling axis'])
                vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                    element: {
                        type: 'XCUIElementTypeStaticText',
                        attributes: { name: 'Label1', value: 'First Label' }
                    },
                    matchCount: 1
                })
                vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                    selector: '~Label1'
                })

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeButton[@name="Button1"]/preceding-sibling::XCUIElementTypeStaticText',
                    { usePageSource: true, browser: mockBrowser }
                )

                expect(result).toEqual({ selector: '~Label1' })
            })
        })
    })
})

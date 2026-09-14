import { describe, expect, test, vi, beforeEach } from 'vitest'
import { convertXPathToOptimizedSelector } from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-converter.js'
import * as xpathDetection from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-detection.js'
import * as xpathSelectorBuilder from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-selector-builder.js'
import * as xpathPageSourceExecutor from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source-executor.js'

vi.mock('@wdio/logger', () => ({
    default: vi.fn(() => ({
        debug: vi.fn()
    }))
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-detection.js', () => ({
    detectUnmappableXPathFeatures: vi.fn()
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-selector-builder.js', () => ({
    buildSelectorFromElementData: vi.fn()
}))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-page-source-executor.js', () => ({
    findElementByXPathWithFallback: vi.fn()
}))

describe('xpath-converter', () => {
    const mockBrowser = {
        getPageSource: vi.fn().mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
<XCUIElementTypeApplication>
    <XCUIElementTypeButton name="Submit" label="Submit"></XCUIElementTypeButton>
</XCUIElementTypeApplication>`)
    } as any

    beforeEach(() => {
        vi.clearAllMocks()
        mockBrowser.getPageSource.mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
<XCUIElementTypeApplication>
    <XCUIElementTypeButton name="Submit" label="Submit"></XCUIElementTypeButton>
</XCUIElementTypeApplication>`)
    })

    describe('convertXPathToOptimizedSelector', () => {
        test('should return null for empty xpath', async () => {
            const result = await convertXPathToOptimizedSelector('', { browser: mockBrowser })
            expect(result).toBeNull()
        })

        test('should return null for non-string xpath', async () => {
            expect(await convertXPathToOptimizedSelector(null as any, { browser: mockBrowser })).toBeNull()
            expect(await convertXPathToOptimizedSelector(undefined as any, { browser: mockBrowser })).toBeNull()
        })

        test('should execute XPath and build selector when element found', async () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
            vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                element: {
                    type: 'XCUIElementTypeButton',
                    attributes: { name: 'Submit' }
                },
                matchCount: 1
            })
            vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                selector: '~Submit'
            })

            const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', { browser: mockBrowser })

            expect(mockBrowser.getPageSource).toHaveBeenCalled()
            expect(xpathPageSourceExecutor.findElementByXPathWithFallback).toHaveBeenCalled()
            expect(xpathSelectorBuilder.buildSelectorFromElementData).toHaveBeenCalled()
            expect(result).toEqual({ selector: '~Submit' })
        })

        test('should return warning when page source is empty', async () => {
            mockBrowser.getPageSource.mockResolvedValueOnce('')
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])

            const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', { browser: mockBrowser })

            expect(result).toEqual({
                selector: null,
                warning: 'Page source unavailable.'
            })
        })

        test('should return warning when page source is null', async () => {
            mockBrowser.getPageSource.mockResolvedValueOnce(null)
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])

            const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', { browser: mockBrowser })

            expect(result).toEqual({
                selector: null,
                warning: 'Page source unavailable.'
            })
        })

        test('should return warning when element not found in page source', async () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
            vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue(null)

            const result = await convertXPathToOptimizedSelector('//*[@name="NotFound"]', { browser: mockBrowser })

            expect(result).toEqual({
                selector: null,
                warning: 'Element not found in page source.'
            })
        })

        test('should return warning when selector cannot be built', async () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
            vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                element: {
                    type: 'XCUIElementTypeButton',
                    attributes: {}
                },
                matchCount: 1
            })
            vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                selector: null,
                warning: 'Could not generate unique selector'
            })

            const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', { browser: mockBrowser })

            expect(result).toEqual({
                selector: null,
                warning: 'Could not build selector from element attributes.'
            })
        })

        test('should return warning with suggestion when multiple elements match', async () => {
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])
            vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                element: {
                    type: 'XCUIElementTypeButton',
                    attributes: { name: 'Submit' }
                },
                matchCount: 3
            })
            vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                selector: '~Submit'
            })

            const result = await convertXPathToOptimizedSelector('//XCUIElementTypeButton', { browser: mockBrowser })

            expect(result).toEqual({
                selector: null,
                warning: expect.stringContaining('XPath matched 3 elements'),
                suggestion: '~Submit'
            })
        })

        test('should handle errors in page source analysis gracefully', async () => {
            mockBrowser.getPageSource.mockRejectedValueOnce(new Error('Network error'))
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])

            const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', { browser: mockBrowser })

            expect(result).toEqual({
                selector: null,
                warning: 'Page source analysis failed.'
            })
        })

        test('should handle non-Error exceptions gracefully', async () => {
            mockBrowser.getPageSource.mockRejectedValueOnce('String error')
            vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue([])

            const result = await convertXPathToOptimizedSelector('//*[@name="Submit"]', { browser: mockBrowser })

            expect(result).toEqual({
                selector: null,
                warning: 'Page source analysis failed.'
            })
        })

        describe('unmappable XPath features', () => {
            test('should include unmappable feature warning when page source unavailable', async () => {
                mockBrowser.getPageSource.mockResolvedValueOnce('')
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['following-sibling axis'])

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeLabel/following-sibling::XCUIElementTypeButton',
                    { browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'XPath contains unmappable features: following-sibling axis. Page source unavailable.'
                })
            })

            test('should include unmappable feature warning when element not found', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['parent axis'])
                vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue(null)

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeButton/parent::XCUIElementTypeCell',
                    { browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'XPath contains unmappable features: parent axis. Element not found in page source.'
                })
            })

            test('should include unmappable feature warning when selector cannot be built', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['ancestor axis'])
                vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                    element: {
                        type: 'XCUIElementTypeCell',
                        attributes: {}
                    },
                    matchCount: 1
                })
                vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue(null)

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeButton/ancestor::XCUIElementTypeCell',
                    { browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'XPath contains unmappable features: ancestor axis. Could not build selector from element attributes.'
                })
            })

            test('should handle page source errors with unmappable features', async () => {
                mockBrowser.getPageSource.mockRejectedValueOnce(new Error('Network error'))
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['preceding-sibling axis'])

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeButton/preceding-sibling::XCUIElementTypeLabel',
                    { browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'XPath contains unmappable features: preceding-sibling axis. Page source analysis failed.'
                })
            })

            test('should return unique selector for unmappable XPath when element found', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['following-sibling axis'])
                vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                    element: {
                        type: 'XCUIElementTypeButton',
                        attributes: { name: 'SubmitButton', label: 'Submit' }
                    },
                    matchCount: 1
                })
                vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                    selector: '~SubmitButton'
                })

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeLabel[@name="Title"]/following-sibling::XCUIElementTypeButton',
                    { browser: mockBrowser }
                )

                expect(result).toEqual({ selector: '~SubmitButton' })
            })

            test('should return warning with suggestion for non-unique unmappable XPath matches', async () => {
                vi.mocked(xpathDetection.detectUnmappableXPathFeatures).mockReturnValue(['following-sibling axis'])
                vi.mocked(xpathPageSourceExecutor.findElementByXPathWithFallback).mockReturnValue({
                    element: {
                        type: 'XCUIElementTypeButton',
                        attributes: { name: 'Button' }
                    },
                    matchCount: 2
                })
                vi.mocked(xpathSelectorBuilder.buildSelectorFromElementData).mockReturnValue({
                    selector: '~Button'
                })

                const result = await convertXPathToOptimizedSelector(
                    '//XCUIElementTypeLabel/following-sibling::XCUIElementTypeButton',
                    { browser: mockBrowser }
                )

                expect(result).toEqual({
                    selector: null,
                    warning: 'XPath matched 2 elements. The suggested selector may not be unique. You can use this selector but be aware it may match multiple elements.',
                    suggestion: '~Button'
                })
            })
        })
    })
})

import { describe, expect, test, vi, beforeEach } from 'vitest'
import { findOptimizedSelector } from '../../../src/mobileSelectorPerformanceOptimizer/utils/optimization.js'
import * as xpathUtils from '../../../src/mobileSelectorPerformanceOptimizer/xpath-utils.js'

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/xpath-utils.js', () => ({
    convertXPathToOptimizedSelector: vi.fn()
}))

describe('optimization utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('findOptimizedSelector', () => {
        const mockBrowser = {} as any

        test('should use static analysis when usePageSource is false', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathUtils.convertXPathToOptimizedSelector).mockReturnValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: false,
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
            expect(xpathUtils.convertXPathToOptimizedSelector).toHaveBeenCalledWith(xpath, {
                usePageSource: false
            })
        })

        test('should use page source analysis when usePageSource is true', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathUtils.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: true,
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
            expect(xpathUtils.convertXPathToOptimizedSelector).toHaveBeenCalledWith(xpath, {
                browser: mockBrowser,
                usePageSource: true
            })
        })

        test('should log page source collection by default', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathUtils.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            await findOptimizedSelector(xpath, {
                usePageSource: true,
                browser: mockBrowser
            })

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Collecting page source')
            )
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Page source collected')
            )

            consoleLogSpy.mockRestore()
        })

        test('should not log page source when logPageSource is false', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathUtils.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            await findOptimizedSelector(xpath, {
                usePageSource: true,
                browser: mockBrowser,
                logPageSource: false
            })

            expect(consoleLogSpy).not.toHaveBeenCalled()

            consoleLogSpy.mockRestore()
        })

        test('should handle synchronous result from convertXPathToOptimizedSelector', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathUtils.convertXPathToOptimizedSelector).mockReturnValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: false,
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
        })

        test('should handle async result from convertXPathToOptimizedSelector', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathUtils.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: false,
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
        })

        test('should return null when convertXPathToOptimizedSelector returns null', async () => {
            const xpath = '//button[@invalid]'

            vi.mocked(xpathUtils.convertXPathToOptimizedSelector).mockReturnValue(null as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: false,
                browser: mockBrowser
            })

            expect(result).toBeNull()
        })
    })
})

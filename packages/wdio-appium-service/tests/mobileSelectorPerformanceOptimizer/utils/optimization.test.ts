import path from 'node:path'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { findOptimizedSelector } from '../../../src/mobileSelectorPerformanceOptimizer/utils/optimization.js'
import * as xpathConverter from '../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-converter.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('../../../src/mobileSelectorPerformanceOptimizer/utils/xpath-converter.js', () => ({
    convertXPathToOptimizedSelector: vi.fn()
}))

const log = logger('@wdio/appium-service:selector-optimizer')

describe('optimization utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('findOptimizedSelector', () => {
        const mockBrowser = {} as any

        test('should use static analysis when usePageSource is false', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockReturnValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: false,
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
            expect(xpathConverter.convertXPathToOptimizedSelector).toHaveBeenCalledWith(xpath, {
                usePageSource: false
            })
        })

        test('should use page source analysis when usePageSource is true', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: true,
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
            expect(xpathConverter.convertXPathToOptimizedSelector).toHaveBeenCalledWith(xpath, {
                browser: mockBrowser,
                usePageSource: true
            })
        })

        test('should log page source collection when usePageSource is true', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            await findOptimizedSelector(xpath, {
                usePageSource: true,
                browser: mockBrowser
            })

            expect(log.info).toHaveBeenCalledWith(
                expect.stringContaining('Collecting page source')
            )
            expect(log.info).toHaveBeenCalledWith(
                expect.stringContaining('Page source collected')
            )
        })

        test('should handle synchronous result from convertXPathToOptimizedSelector', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockReturnValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: false,
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
        })

        test('should handle async result from convertXPathToOptimizedSelector', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: false,
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
        })

        test('should return null when convertXPathToOptimizedSelector returns null', async () => {
            const xpath = '//button[@invalid]'

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockReturnValue(null as any)

            const result = await findOptimizedSelector(xpath, {
                usePageSource: false,
                browser: mockBrowser
            })

            expect(result).toBeNull()
        })
    })
})

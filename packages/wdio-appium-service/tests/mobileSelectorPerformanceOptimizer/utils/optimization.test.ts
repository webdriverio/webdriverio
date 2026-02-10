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

        test('should call convertXPathToOptimizedSelector with browser', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
            expect(xpathConverter.convertXPathToOptimizedSelector).toHaveBeenCalledWith(xpath, {
                browser: mockBrowser
            })
        })

        test('should log page source collection timing', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: '~test', strategy: 'accessibility id' }

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            await findOptimizedSelector(xpath, {
                browser: mockBrowser
            })

            expect(log.info).toHaveBeenCalledWith(
                expect.stringContaining('Collecting page source')
            )
            expect(log.info).toHaveBeenCalledWith(
                expect.stringContaining('Page source collected')
            )
        })

        test('should return null when convertXPathToOptimizedSelector returns null', async () => {
            const xpath = '//button[@invalid]'

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockResolvedValue(null)

            const result = await findOptimizedSelector(xpath, {
                browser: mockBrowser
            })

            expect(result).toBeNull()
        })

        test('should return warning result when conversion fails', async () => {
            const xpath = '//button[@id="test"]'
            const mockResult = { selector: null, warning: 'Could not convert' }

            vi.mocked(xpathConverter.convertXPathToOptimizedSelector).mockResolvedValue(mockResult as any)

            const result = await findOptimizedSelector(xpath, {
                browser: mockBrowser
            })

            expect(result).toEqual(mockResult)
        })
    })
})

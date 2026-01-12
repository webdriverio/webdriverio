import { describe, expect, test, vi, beforeEach } from 'vitest'
import { testOptimizedSelector } from '../../../src/mobileSelectorPerformanceOptimizer/utils/selector-testing.js'

describe('selector-testing utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('testOptimizedSelector', () => {
        test('should find single element successfully', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ ELEMENT: 'element-123' })
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false)

            expect(result).toBeDefined()
            expect(result?.elementRefs).toHaveLength(1)
            expect(result?.elementRefs[0]).toEqual({ ELEMENT: 'element-123' })
            expect(result?.duration).toBeGreaterThanOrEqual(0)
            expect(mockBrowser.findElement).toHaveBeenCalledWith('accessibility id', 'test')
        })

        test('should find multiple elements successfully', async () => {
            const mockBrowser = {
                findElements: vi.fn().mockResolvedValue([
                    { ELEMENT: 'element-1' },
                    { ELEMENT: 'element-2' }
                ])
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', true)

            expect(result).toBeDefined()
            expect(result?.elementRefs).toHaveLength(2)
            expect(result?.duration).toBeGreaterThanOrEqual(0)
            expect(mockBrowser.findElements).toHaveBeenCalledWith('accessibility id', 'test')
        })

        test('should handle element not found', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' })
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'nonexistent', false)

            expect(result).toBeDefined()
            expect(result?.elementRefs).toEqual([])
            expect(result?.duration).toBeGreaterThanOrEqual(0)
        })

        test('should handle empty elements array', async () => {
            const mockBrowser = {
                findElements: vi.fn().mockResolvedValue([])
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', true)

            expect(result).toBeDefined()
            expect(result?.elementRefs).toEqual([])
            expect(result?.duration).toBeGreaterThanOrEqual(0)
        })

        test('should handle findElement error', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockRejectedValue(new Error('Connection error'))
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false)

            expect(result).toBeNull()
        })

        test('should handle findElements error', async () => {
            const mockBrowser = {
                findElements: vi.fn().mockRejectedValue(new Error('Connection error'))
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', true)

            expect(result).toBeNull()
        })

        test('should handle element-6066-11e4-a52e-4f735466cecf format', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ 'element-6066-11e4-a52e-4f735466cecf': 'element-456' })
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false)

            expect(result).toBeDefined()
            expect(result?.elementRefs).toHaveLength(1)
            expect(result?.elementRefs[0]).toEqual({ 'element-6066-11e4-a52e-4f735466cecf': 'element-456' })
        })

        test('should log debug info when debug is true', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ ELEMENT: 'element-123' })
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Debug'))
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Preparing to call findElement'))
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Element found successfully'))

            consoleLogSpy.mockRestore()
        })

        test('should log debug info for multiple elements when debug is true', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElements: vi.fn().mockResolvedValue([{ ELEMENT: 'element-1' }])
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', true, true)

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Preparing to call findElements'))
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 element(s)'))

            consoleLogSpy.mockRestore()
        })

        test('should log debug info when element not found', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element', message: 'Element not found' }),
                getPageSource: vi.fn().mockResolvedValue('<root></root>')
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Element NOT found'))
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Verification failed'))

            consoleLogSpy.mockRestore()
        })

        test('should log error details when findElement throws', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn().mockRejectedValue(new Error('Connection timeout'))
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('threw an error'))
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Connection timeout'))

            consoleLogSpy.mockRestore()
        })

        test('should handle non-array result from findElements', async () => {
            const mockBrowser = {
                findElements: vi.fn().mockResolvedValue(null as any)
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', true)

            expect(result).toBeDefined()
            expect(result?.elementRefs).toEqual([])
        })

        test('should retry finding element when page source shows matching elements', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn()
                    .mockResolvedValueOnce({ error: 'no such element' })
                    .mockResolvedValueOnce({ ELEMENT: 'element-found' }),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton name="test" label="Test Button"></XCUIElementTypeButton>'
                )
            } as any

            const result = await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                "type == 'XCUIElementTypeButton' AND name == 'test'",
                false,
                true
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Retry successful'))
            expect(result?.elementRefs).toHaveLength(1)

            consoleLogSpy.mockRestore()
        })

        test('should handle retry when no matching elements in page source', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockResolvedValue('<root></root>')
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('No matching elements found in fresh page source')
            )

            consoleLogSpy.mockRestore()
        })

        test('should handle iOS class chain selectors in page source', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn()
                    .mockResolvedValueOnce({ error: 'no such element' })
                    .mockResolvedValueOnce({ ELEMENT: 'element-found' }),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton name="test"></XCUIElementTypeButton>'
                )
            } as any

            await testOptimizedSelector(
                mockBrowser,
                '-ios class chain',
                '**/XCUIElementTypeButton[`name == "test"`]',
                false,
                true
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Found'))

            consoleLogSpy.mockRestore()
        })

        test('should handle retry failure for single element', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton name="test"></XCUIElementTypeButton>'
                )
            } as any

            const result = await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                "type == 'XCUIElementTypeButton' AND name == 'test'",
                false,
                true
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Retry failed'))
            expect(result?.elementRefs).toEqual([])

            consoleLogSpy.mockRestore()
        })

        test('should handle retry for multiple elements', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElements: vi.fn()
                    .mockResolvedValueOnce([])
                    .mockResolvedValueOnce([{ ELEMENT: 'element-1' }]),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton name="test"></XCUIElementTypeButton>'
                )
            } as any

            const result = await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                "type == 'XCUIElementTypeButton' AND name == 'test'",
                true,
                true
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Retry successful'))
            expect(result?.elementRefs).toHaveLength(1)

            consoleLogSpy.mockRestore()
        })

        test('should handle retry error during retry attempt', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn()
                    .mockResolvedValueOnce({ error: 'no such element' })
                    .mockRejectedValueOnce(new Error('Connection lost')),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton name="test"></XCUIElementTypeButton>'
                )
            } as any

            await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                "type == 'XCUIElementTypeButton' AND name == 'test'",
                false,
                true
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Retry threw error'))
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Connection lost'))

            consoleLogSpy.mockRestore()
        })

        test('should handle getPageSource error gracefully', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockRejectedValue(new Error('Failed to get page source'))
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(result?.elementRefs).toEqual([])

            consoleLogSpy.mockRestore()
        })

        test('should handle invalid page source format', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockResolvedValue(null as any)
            } as any

            await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                "type == 'XCUIElementTypeButton'",
                false,
                true
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('No matching elements found')
            )

            consoleLogSpy.mockRestore()
        })

        test('should log when element not found (not error response) with debug', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ someOtherKey: 'value' }),
                getPageSource: vi.fn().mockResolvedValue('<root></root>')
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('No element found - selector may not match any element')
            )

            consoleLogSpy.mockRestore()
        })

        test('should handle retry failure for multiple elements', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElements: vi.fn().mockResolvedValue([]),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton name="test"></XCUIElementTypeButton>'
                )
            } as any

            await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                "type == 'XCUIElementTypeButton' AND name == 'test'",
                true,
                true
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Retry failed - still no elements found')
            )

            consoleLogSpy.mockRestore()
        })

        test('should log retry failure with error message for single element', async () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const mockBrowser = {
                findElement: vi.fn()
                    .mockResolvedValueOnce({ someOtherKey: 'value' })
                    .mockResolvedValueOnce({ someOtherKey: 'value' }),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton name="test"></XCUIElementTypeButton>'
                )
            } as any

            await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                "type == 'XCUIElementTypeButton' AND name == 'test'",
                false,
                true
            )

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Retry failed - No element found')
            )

            consoleLogSpy.mockRestore()
        })
    })
})

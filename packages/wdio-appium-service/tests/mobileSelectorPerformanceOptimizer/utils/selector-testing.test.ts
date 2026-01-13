import path from 'node:path'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import logger from '@wdio/logger'
import { testOptimizedSelector } from '../../../src/mobileSelectorPerformanceOptimizer/utils/selector-testing.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const log = logger('@wdio/appium-service')

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

        test('should handle element not found scenarios', async () => {
            const testCases = [
                {
                    isMultiple: false,
                    mockBrowser: { findElement: vi.fn().mockResolvedValue({ error: 'no such element' }) },
                    description: 'error response'
                },
                {
                    isMultiple: true,
                    mockBrowser: { findElements: vi.fn().mockResolvedValue([]) },
                    description: 'empty array'
                }
            ]

            for (const testCase of testCases) {
                const result = await testOptimizedSelector(
                    testCase.mockBrowser as any,
                    'accessibility id',
                    'test',
                    testCase.isMultiple
                )

                expect(result).toBeDefined()
                expect(result?.elementRefs).toEqual([])
                expect(result?.duration).toBeGreaterThanOrEqual(0)
            }
        })

        test('should handle findElement/findElements errors', async () => {
            const testCases = [
                { isMultiple: false, method: 'findElement' },
                { isMultiple: true, method: 'findElements' }
            ]

            for (const testCase of testCases) {
                const mockBrowser = {
                    [testCase.method]: vi.fn().mockRejectedValue(new Error('Connection error'))
                } as any

                const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', testCase.isMultiple)

                expect(result).toBeNull()
            }
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
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ ELEMENT: 'element-123' })
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Debug'))
            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Preparing to call findElement'))
            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Element found successfully'))
        })

        test('should log debug info for multiple elements when debug is true', async () => {
            const mockBrowser = {
                findElements: vi.fn().mockResolvedValue([{ ELEMENT: 'element-1' }])
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', true, true)

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Preparing to call findElements'))
            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Found 1 element(s)'))
        })

        test('should log debug info when element not found', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element', message: 'Element not found' }),
                getPageSource: vi.fn().mockResolvedValue('<root></root>')
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Element NOT found'))
            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Verification failed'))
        })

        test('should log error details when findElement throws', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockRejectedValue(new Error('Connection timeout'))
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('threw an error'))
            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Connection timeout'))
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

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Retry successful'))
            expect(result?.elementRefs).toHaveLength(1)
        })

        test('should handle retry when no matching elements in page source', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockResolvedValue('<root></root>')
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('No matching elements found in fresh page source')
            )
        })

        test('should handle iOS class chain selectors in page source', async () => {
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

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Found'))
        })

        test('should handle retry failure for single element', async () => {
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

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Retry failed'))
            expect(result?.elementRefs).toEqual([])
        })

        test('should handle retry for multiple elements', async () => {
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

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Retry successful'))
            expect(result?.elementRefs).toHaveLength(1)
        })

        test('should handle retry error during retry attempt', async () => {
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

            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Retry threw error'))
            expect(log.debug).toHaveBeenCalledWith(expect.stringContaining('Connection lost'))
        })

        test('should handle getPageSource error gracefully', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockRejectedValue(new Error('Failed to get page source'))
            } as any

            const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(result?.elementRefs).toEqual([])
        })

        test('should handle invalid page source format', async () => {
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

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('No matching elements found')
            )
        })

        test('should log when element not found (not error response) with debug', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ someOtherKey: 'value' }),
                getPageSource: vi.fn().mockResolvedValue('<root></root>')
            } as any

            await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('No element found - selector may not match any element')
            )
        })

        test('should handle retry failure for multiple elements', async () => {
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

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('Retry failed - still no elements found')
            )
        })

        test('should log retry failure with error message for single element', async () => {
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

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('Retry failed - No element found')
            )
        })

        test('should return empty array when elementType is null for predicate string', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockResolvedValue('<root></root>')
            } as any

            const result = await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                'invalid predicate without type',
                false,
                true
            )

            expect(result?.elementRefs).toEqual([])
        })

        test('should handle attribute mismatches and missing attributes in page source', async () => {
            const testCases = [
                {
                    using: '-ios predicate string',
                    value: "type == 'XCUIElementTypeButton' AND name == 'test'",
                    pageSource: '<XCUIElementTypeButton name="different"></XCUIElementTypeButton>',
                    description: 'attribute mismatch in predicate string'
                },
                {
                    using: '-ios class chain',
                    value: '**/XCUIElementTypeButton[`name == "test"`]',
                    pageSource: '<XCUIElementTypeButton name="different"></XCUIElementTypeButton>',
                    description: 'attribute mismatch in class chain'
                },
                {
                    using: '-ios predicate string',
                    value: "type == 'XCUIElementTypeButton' AND name == 'test'",
                    pageSource: '<XCUIElementTypeButton></XCUIElementTypeButton>',
                    description: 'missing attribute in predicate string'
                }
            ]

            for (const testCase of testCases) {
                const mockBrowser = {
                    findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                    getPageSource: vi.fn().mockResolvedValue(testCase.pageSource)
                } as any

                const result = await testOptimizedSelector(
                    mockBrowser,
                    testCase.using,
                    testCase.value,
                    false,
                    true
                )

                expect(result?.elementRefs).toEqual([])
            }
        })

        test('should handle class chain without type match', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockResolvedValue('<root></root>')
            } as any

            const result = await testOptimizedSelector(
                mockBrowser,
                '-ios class chain',
                'invalid-class-chain',
                false,
                true
            )

            expect(result?.elementRefs).toEqual([])
        })

        test('should handle class chain without predicate', async () => {
            const mockBrowser = {
                findElement: vi.fn()
                    .mockResolvedValueOnce({ error: 'no such element' })
                    .mockResolvedValueOnce({ ELEMENT: 'element-found' }),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton></XCUIElementTypeButton>'
                )
            } as any

            const result = await testOptimizedSelector(
                mockBrowser,
                '-ios class chain',
                '**/XCUIElementTypeButton',
                false,
                true
            )

            expect(result?.elementRefs).toHaveLength(1)
        })

        test('should handle class chain with empty attributes', async () => {
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockResolvedValue(
                    '<XCUIElementTypeButton></XCUIElementTypeButton>'
                )
            } as any

            const result = await testOptimizedSelector(
                mockBrowser,
                '-ios class chain',
                '**/XCUIElementTypeButton[`name == "test"`]',
                false,
                true
            )

            expect(result?.elementRefs).toEqual([])
        })

        test('should handle error messages with different formats', async () => {
            const testCases = [
                {
                    error: { error: 'no such element', message: 'Custom error message' },
                    expectedMessage: 'Custom error message',
                    description: 'error with message property'
                },
                {
                    error: { error: 'Element not found' },
                    expectedMessage: 'Element not found',
                    description: 'error with only error property'
                }
            ]

            for (const testCase of testCases) {
                vi.clearAllMocks()
                const mockBrowser = {
                    findElement: vi.fn().mockResolvedValue(testCase.error),
                    getPageSource: vi.fn().mockResolvedValue('<root></root>')
                } as any

                await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

                expect(log.debug).toHaveBeenCalledWith(
                    expect.stringContaining(testCase.expectedMessage)
                )
            }
        })

        test('should handle long element strings in page source (truncation)', async () => {
            const longElement = '<XCUIElementTypeButton' + ' name="test"'.repeat(50) + '></XCUIElementTypeButton>'
            const mockBrowser = {
                findElement: vi.fn().mockResolvedValue({ error: 'no such element' }),
                getPageSource: vi.fn().mockResolvedValue(longElement)
            } as any

            await testOptimizedSelector(
                mockBrowser,
                '-ios predicate string',
                "type == 'XCUIElementTypeButton' AND name == 'test'",
                false,
                true
            )

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('...')
            )
        })

        test('should handle non-array retry result for findElements', async () => {
            const mockBrowser = {
                findElements: vi.fn()
                    .mockResolvedValueOnce([])
                    .mockResolvedValueOnce(null as any),
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

            expect(result?.elementRefs).toEqual([])
        })

        test('should handle retry error with message property', async () => {
            const mockBrowser = {
                findElement: vi.fn()
                    .mockResolvedValueOnce({ error: 'no such element' })
                    .mockResolvedValueOnce({ error: 'Timeout', message: 'Connection timeout' }),
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

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('Connection timeout')
            )
        })

        test('should handle retry error with only error property', async () => {
            const mockBrowser = {
                findElement: vi.fn()
                    .mockResolvedValueOnce({ error: 'no such element' })
                    .mockResolvedValueOnce({ error: 'Element not found' }),
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

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('Element not found')
            )
        })

        test('should handle retry error that is not an Error instance', async () => {
            const mockBrowser = {
                findElement: vi.fn()
                    .mockResolvedValueOnce({ error: 'no such element' })
                    .mockRejectedValueOnce('String error'),
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

            expect(log.debug).toHaveBeenCalledWith(
                expect.stringContaining('String error')
            )
        })

        test('should handle catch block errors with different types', async () => {
            const testCases = [
                {
                    error: new Error('Network error'),
                    expectedMessage: 'Network error',
                    description: 'Error instance'
                },
                {
                    error: 'String error',
                    expectedMessage: 'String error',
                    description: 'non-Error instance'
                }
            ]

            for (const testCase of testCases) {
                vi.clearAllMocks()
                const mockBrowser = {
                    findElement: vi.fn().mockRejectedValue(testCase.error)
                } as any

                const result = await testOptimizedSelector(mockBrowser, 'accessibility id', 'test', false, true)

                expect(result).toBeNull()
                expect(log.debug).toHaveBeenCalledWith(
                    expect.stringContaining('threw an error')
                )
                expect(log.debug).toHaveBeenCalledWith(
                    expect.stringContaining(testCase.expectedMessage)
                )
            }
        })
    })
})

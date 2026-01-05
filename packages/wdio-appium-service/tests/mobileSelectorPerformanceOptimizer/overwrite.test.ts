import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest'

import { overwriteUserCommands } from '../../src/mobileSelectorPerformanceOptimizer/overwrite.js'
import * as utils from '../../src/mobileSelectorPerformanceOptimizer/utils.js'
import * as optimizer from '../../src/mobileSelectorPerformanceOptimizer/optimizer.js'

vi.mock('../../src/mobileSelectorPerformanceOptimizer/utils.js', async () => {
    const actual = await vi.importActual('../../src/mobileSelectorPerformanceOptimizer/utils.js')
    return {
        ...actual,
        isXPathSelector: vi.fn(),
        isNativeContext: vi.fn()
    }
})

vi.mock('../../src/mobileSelectorPerformanceOptimizer/optimizer.js', () => ({
    optimizeSingleSelector: vi.fn(),
    optimizeMultipleSelectors: vi.fn()
}))

describe('overwriteUserCommands', () => {
    let mockBrowser: WebdriverIO.Browser
    let mockOptions: {
        usePageSource: boolean
        browser?: WebdriverIO.Browser
        isReplacingSelector: { value: boolean }
        isSilentLogLevel?: boolean
    }
    let mockOverwriteCommand: ReturnType<typeof vi.fn>

    beforeEach(() => {
        vi.clearAllMocks()

        mockOverwriteCommand = vi.fn()

        mockBrowser = {
            overwriteCommand: mockOverwriteCommand
        } as unknown as WebdriverIO.Browser

        mockOptions = {
            usePageSource: true,
            browser: mockBrowser,
            isReplacingSelector: { value: false },
            isSilentLogLevel: false
        }

        vi.mocked(utils.isNativeContext).mockReturnValue(true)
        vi.mocked(utils.isXPathSelector).mockReturnValue(true)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('browser without overwriteCommand', () => {
        test('should return early when browser does not have overwriteCommand', () => {
            const browserWithoutOverwrite = {} as WebdriverIO.Browser

            overwriteUserCommands(browserWithoutOverwrite, mockOptions)

            expect(mockOverwriteCommand).not.toHaveBeenCalled()
        })

        test('should return early when overwriteCommand is not a function', () => {
            const browserWithInvalidOverwrite = {
                overwriteCommand: 'not a function'
            } as unknown as WebdriverIO.Browser

            overwriteUserCommands(browserWithInvalidOverwrite, mockOptions)

            expect(mockOverwriteCommand).not.toHaveBeenCalled()
        })
    })

    describe('browser with overwriteCommand', () => {
        test('should overwrite all element commands', () => {
            overwriteUserCommands(mockBrowser, mockOptions)

            expect(mockOverwriteCommand).toHaveBeenCalledTimes(4) // 2 single + 2 multiple
            expect(mockOverwriteCommand).toHaveBeenCalledWith('$', expect.any(Function))
            expect(mockOverwriteCommand).toHaveBeenCalledWith('custom$', expect.any(Function))

            expect(mockOverwriteCommand).toHaveBeenCalledWith('$$', expect.any(Function))
            expect(mockOverwriteCommand).toHaveBeenCalledWith('custom$$', expect.any(Function))
        })
    })

    describe('overwritten single element command behavior', () => {
        test('should call original function when already replacing', async () => {
            mockOptions.isReplacingSelector.value = true
            const originalFunc = vi.fn().mockResolvedValue({} as WebdriverIO.Element)
            const selector = '//xpath'

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === '$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            await overwrittenFunc!(originalFunc, selector)

            expect(originalFunc).toHaveBeenCalledWith(selector)
            expect(vi.mocked(optimizer.optimizeSingleSelector)).not.toHaveBeenCalled()
        })

        test('should call original function when not in native context', async () => {
            vi.mocked(utils.isNativeContext).mockReturnValue(false)
            const originalFunc = vi.fn().mockResolvedValue({} as WebdriverIO.Element)
            const selector = '//xpath'

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === '$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            await overwrittenFunc!(originalFunc, selector)

            expect(originalFunc).toHaveBeenCalledWith(selector)
            expect(vi.mocked(optimizer.optimizeSingleSelector)).not.toHaveBeenCalled()
        })

        test('should call original function when selector is not XPath', async () => {
            vi.mocked(utils.isXPathSelector).mockReturnValue(false)
            const originalFunc = vi.fn().mockResolvedValue({} as WebdriverIO.Element)
            const selector = 'accessibility id'

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === '$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            await overwrittenFunc!(originalFunc, selector)

            expect(originalFunc).toHaveBeenCalledWith(selector)
            expect(vi.mocked(optimizer.optimizeSingleSelector)).not.toHaveBeenCalled()
        })

        test('should call optimizeSingleSelector when all conditions pass', async () => {
            const originalFunc = vi.fn().mockResolvedValue({} as WebdriverIO.Element)
            const selector = '//xpath'
            const mockElement = {} as WebdriverIO.Element
            vi.mocked(optimizer.optimizeSingleSelector).mockResolvedValue(mockElement)

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === '$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            const result = await overwrittenFunc!(originalFunc, selector)

            expect(vi.mocked(utils.isNativeContext)).toHaveBeenCalledWith(mockBrowser)
            expect(vi.mocked(utils.isXPathSelector)).toHaveBeenCalledWith(selector)
            expect(vi.mocked(optimizer.optimizeSingleSelector)).toHaveBeenCalledWith(
                '$',
                selector,
                originalFunc,
                mockBrowser,
                mockOptions
            )
            expect(result).toBe(mockElement)
        })

        test('should work with custom$ command', async () => {
            const originalFunc = vi.fn().mockResolvedValue({} as WebdriverIO.Element)
            const selector = '//xpath'
            const mockElement = {} as WebdriverIO.Element
            vi.mocked(optimizer.optimizeSingleSelector).mockResolvedValue(mockElement)

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === 'custom$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            await overwrittenFunc!(originalFunc, selector)

            expect(vi.mocked(optimizer.optimizeSingleSelector)).toHaveBeenCalledWith(
                'custom$',
                selector,
                originalFunc,
                mockBrowser,
                mockOptions
            )
        })
    })

    describe('overwritten multiple element command behavior', () => {
        test('should call original function when already replacing', async () => {
            mockOptions.isReplacingSelector.value = true
            const originalFunc = vi.fn().mockResolvedValue([{}] as WebdriverIO.Element[])
            const selector = '//xpath'

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === '$$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            await overwrittenFunc!(originalFunc, selector)

            expect(originalFunc).toHaveBeenCalledWith(selector)
            expect(vi.mocked(optimizer.optimizeMultipleSelectors)).not.toHaveBeenCalled()
        })

        test('should call original function when not in native context', async () => {
            vi.mocked(utils.isNativeContext).mockReturnValue(false)
            const originalFunc = vi.fn().mockResolvedValue([{}] as WebdriverIO.Element[])
            const selector = '//xpath'

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === '$$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            await overwrittenFunc!(originalFunc, selector)

            expect(originalFunc).toHaveBeenCalledWith(selector)
            expect(vi.mocked(optimizer.optimizeMultipleSelectors)).not.toHaveBeenCalled()
        })

        test('should call original function when selector is not XPath', async () => {
            vi.mocked(utils.isXPathSelector).mockReturnValue(false)
            const originalFunc = vi.fn().mockResolvedValue([{}] as WebdriverIO.Element[])
            const selector = 'accessibility id'

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === '$$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            await overwrittenFunc!(originalFunc, selector)

            expect(originalFunc).toHaveBeenCalledWith(selector)
            expect(vi.mocked(optimizer.optimizeMultipleSelectors)).not.toHaveBeenCalled()
        })

        test('should call optimizeMultipleSelectors when all conditions pass', async () => {
            const originalFunc = vi.fn().mockResolvedValue([{}] as WebdriverIO.Element[])
            const selector = '//xpath'
            const mockElements = [{}] as WebdriverIO.Element[]
            vi.mocked(optimizer.optimizeMultipleSelectors).mockResolvedValue(mockElements)

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === '$$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            const result = await overwrittenFunc!(originalFunc, selector)

            expect(vi.mocked(utils.isNativeContext)).toHaveBeenCalledWith(mockBrowser)
            expect(vi.mocked(utils.isXPathSelector)).toHaveBeenCalledWith(selector)
            expect(vi.mocked(optimizer.optimizeMultipleSelectors)).toHaveBeenCalledWith(
                '$$',
                selector,
                originalFunc,
                mockBrowser,
                mockOptions
            )
            expect(result).toBe(mockElements)
        })

        test('should work with custom$$ command', async () => {
            const originalFunc = vi.fn().mockResolvedValue([{}] as WebdriverIO.Element[])
            const selector = '//xpath'
            const mockElements = [{}] as WebdriverIO.Element[]
            vi.mocked(optimizer.optimizeMultipleSelectors).mockResolvedValue(mockElements)

            overwriteUserCommands(mockBrowser, mockOptions)

            const overwrittenFunc = mockOverwriteCommand.mock.calls.find(
                call => call[0] === 'custom$$'
            )?.[1]

            expect(overwrittenFunc).toBeDefined()
            await overwrittenFunc!(originalFunc, selector)

            expect(vi.mocked(optimizer.optimizeMultipleSelectors)).toHaveBeenCalledWith(
                'custom$$',
                selector,
                originalFunc,
                mockBrowser,
                mockOptions
            )
        })
    })
})


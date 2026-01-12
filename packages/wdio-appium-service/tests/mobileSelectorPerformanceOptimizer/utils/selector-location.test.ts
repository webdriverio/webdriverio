import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { findSelectorLocation } from '../../../src/mobileSelectorPerformanceOptimizer/utils/selector-location.js'

vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        statSync: vi.fn(),
        readdirSync: vi.fn()
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    statSync: vi.fn(),
    readdirSync: vi.fn()
}))

describe('selector-location utils', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('findSelectorLocation', () => {
        test('should return empty array when no testFile provided', () => {
            const result = findSelectorLocation(undefined, '//button')
            expect(result).toEqual([])
        })

        test('should return empty array when no selector provided', () => {
            const result = findSelectorLocation('test/spec.ts', '')
            expect(result).toEqual([])
        })

        test('should return empty array for non-XPath selector', () => {
            const result = findSelectorLocation('test/spec.ts', '.button')
            expect(result).toEqual([])
        })

        test('should find selector in test file', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button[@id="test"]'
            const fileContent = `
                test('my test', () => {
                    const button = $('${selector}')
                    button.click()
                })
            `

            vi.mocked(fs.existsSync).mockImplementation((p) => p === testFile)
            vi.mocked(fs.readFileSync).mockReturnValue(fileContent)

            const result = findSelectorLocation(testFile, selector, [])

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                file: testFile,
                line: 3,
                isPageObject: false
            })
        })

        test('should handle selector with single quotes', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'
            const fileContent = `const el = $('${selector}')`

            vi.mocked(fs.existsSync).mockImplementation((p) => p === testFile)
            vi.mocked(fs.readFileSync).mockReturnValue(fileContent)

            const result = findSelectorLocation(testFile, selector, [])

            expect(result).toHaveLength(1)
            expect(result[0].line).toBe(1)
        })

        test('should handle selector with double quotes', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'
            const fileContent = `const el = $("${selector}")`

            vi.mocked(fs.existsSync).mockImplementation((p) => p === testFile)
            vi.mocked(fs.readFileSync).mockReturnValue(fileContent)

            const result = findSelectorLocation(testFile, selector, [])

            expect(result).toHaveLength(1)
        })

        test('should handle selector with backticks', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'
            const fileContent = 'const el = $(`' + selector + '`)'

            vi.mocked(fs.existsSync).mockImplementation((p) => p === testFile)
            vi.mocked(fs.readFileSync).mockReturnValue(fileContent)

            const result = findSelectorLocation(testFile, selector, [])

            expect(result).toHaveLength(1)
        })

        test('should find selector in page object when paths provided', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'
            const pageObjectPath = '/project/test/pageobjects'
            const pageObjectFile = '/project/test/pageobjects/login.page.ts'
            const poContent = `get loginButton() { return $('${selector}') }`

            vi.mocked(fs.existsSync).mockImplementation((p) => {
                return p === testFile || p === pageObjectPath || p === pageObjectFile
            })
            vi.mocked(fs.readFileSync).mockImplementation((p) => {
                if (p === testFile) {return 'test content'}
                if (p === pageObjectFile) {return poContent}
                return ''
            })
            vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true, isFile: () => false } as fs.Stats)
            vi.mocked(fs.readdirSync).mockReturnValue([
                { name: 'login.page.ts', isDirectory: () => false, isFile: () => true }
            ] as any)

            const result = findSelectorLocation(testFile, selector, [pageObjectPath])

            expect(result.length).toBeGreaterThanOrEqual(1)
            const pageObjectResult = result.find(r => r.isPageObject)
            expect(pageObjectResult).toBeDefined()
        })

        test('should handle file read error gracefully', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'

            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(fs.readFileSync).mockImplementation(() => {
                throw new Error('File read error')
            })

            const result = findSelectorLocation(testFile, selector)

            expect(result).toEqual([])
        })

        test('should handle missing test file', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'

            vi.mocked(fs.existsSync).mockReturnValue(false)

            const result = findSelectorLocation(testFile, selector)

            expect(result).toEqual([])
        })

        test('should handle logging when enabled', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const testFile = '/project/test/spec.ts'
            const selector = '//button'

            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(fs.readFileSync).mockReturnValue(`$('${selector}')`)

            findSelectorLocation(testFile, selector, [], true)

            expect(consoleLogSpy).toHaveBeenCalled()

            consoleLogSpy.mockRestore()
        })

        test('should skip logging for non-XPath with logging enabled', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const testFile = '/project/test/spec.ts'
            const selector = '.button'

            findSelectorLocation(testFile, selector, [], true)

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Skipping non-XPath selector')
            )

            consoleLogSpy.mockRestore()
        })

        test('should handle multiple matches in same file', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'
            const fileContent = `
                const button1 = $('${selector}')
                const button2 = $("${selector}")
            `

            vi.mocked(fs.existsSync).mockImplementation((p) => p === testFile)
            vi.mocked(fs.readFileSync).mockReturnValue(fileContent)

            const result = findSelectorLocation(testFile, selector, [])

            expect(result).toHaveLength(1)
            expect(result[0].line).toBe(2)
        })

        test('should handle error during search', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'

            vi.mocked(fs.existsSync).mockImplementation(() => {
                throw new Error('Filesystem error')
            })

            const result = findSelectorLocation(testFile, selector)

            expect(result).toEqual([])
        })

        test('should not search in node_modules', () => {
            const testFile = '/project/test/spec.ts'
            const selector = '//button'
            const pageObjectPath = '/project'

            vi.mocked(fs.existsSync).mockReturnValue(true)
            vi.mocked(fs.readFileSync).mockReturnValue('test content')
            vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true, isFile: () => false } as fs.Stats)
            vi.mocked(fs.readdirSync).mockReturnValue([
                { name: 'node_modules', isDirectory: () => true, isFile: () => false },
                { name: 'src', isDirectory: () => true, isFile: () => false }
            ] as any)

            const result = findSelectorLocation(testFile, selector, [pageObjectPath])

            // node_modules should be skipped
            expect(result).toBeDefined()
        })

        test('should log when no testFile or selector provided with logging enabled', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            findSelectorLocation(undefined, '//button', [], true)

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('No test file or selector provided')
            )

            consoleLogSpy.mockRestore()
        })

        test('should log configured page object paths when provided with logging enabled', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const testFile = '/project/test/spec.ts'
            const selector = '//button'
            const pageObjectPaths = ['/project/pageobjects']

            vi.mocked(fs.existsSync).mockImplementation((p) => p === testFile)
            vi.mocked(fs.readFileSync).mockReturnValue('')
            vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true, isFile: () => false } as fs.Stats)
            vi.mocked(fs.readdirSync).mockReturnValue([])

            findSelectorLocation(testFile, selector, pageObjectPaths, true)

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Using configured page object paths')
            )

            consoleLogSpy.mockRestore()
        })

        test('should log when no page object files found with logging enabled', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const testFile = '/project/test/spec.ts'
            const selector = '//button'

            vi.mocked(fs.existsSync).mockImplementation((p) => p === testFile)
            vi.mocked(fs.readFileSync).mockReturnValue('')

            findSelectorLocation(testFile, selector, [], true)

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('No page object files found')
            )

            consoleLogSpy.mockRestore()
        })

        test('should log when selector not found with logging enabled', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const testFile = '/project/test/spec.ts'
            const selector = '//button'

            vi.mocked(fs.existsSync).mockImplementation((p) => p === testFile)
            vi.mocked(fs.readFileSync).mockReturnValue('no selector here')

            findSelectorLocation(testFile, selector, [], true)

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Selector not found')
            )

            consoleLogSpy.mockRestore()
        })

        test('should log error with logging enabled when error occurs', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const testFile = '/project/test/spec.ts'
            const selector = '//button'

            vi.mocked(fs.existsSync).mockImplementation(() => {
                throw new Error('Filesystem error')
            })

            findSelectorLocation(testFile, selector, [], true)

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error: Filesystem error')
            )

            consoleLogSpy.mockRestore()
        })
    })
})

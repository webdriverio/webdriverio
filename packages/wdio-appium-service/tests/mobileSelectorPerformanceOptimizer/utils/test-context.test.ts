import { describe, expect, test } from 'vitest'
import type { Frameworks } from '@wdio/types'
import {
    extractTestFile,
    extractSuiteName,
    extractTestName,
    buildTestContext
} from '../../../src/mobileSelectorPerformanceOptimizer/utils/test-context.js'

describe('test-context utils', () => {
    describe('extractTestFile', () => {
        test('should extract file from suite', () => {
            const suite = { file: 'test/spec.ts' } as Frameworks.Suite
            expect(extractTestFile(undefined, suite)).toBe('test/spec.ts')
        })

        test('should extract file from test', () => {
            const test = { file: 'test/another.ts' } as Frameworks.Test & { file: string }
            expect(extractTestFile(test)).toBe('test/another.ts')
        })

        test('should extract file from test parent', () => {
            const test = {
                parent: { file: 'test/parent.ts' }
            } as unknown as Frameworks.Test
            expect(extractTestFile(test)).toBe('test/parent.ts')
        })

        test('should prioritize suite file over test file', () => {
            const test = { file: 'test/test.ts' } as Frameworks.Test & { file: string }
            const suite = { file: 'test/suite.ts' } as Frameworks.Suite
            expect(extractTestFile(test, suite)).toBe('test/suite.ts')
        })

        test('should return undefined when no file found', () => {
            expect(extractTestFile()).toBeUndefined()
            expect(extractTestFile({} as Frameworks.Test)).toBeUndefined()
        })

        test('should return undefined when file is not a string', () => {
            const suite = { file: 123 } as unknown as Frameworks.Suite
            expect(extractTestFile(undefined, suite)).toBeUndefined()
        })
    })

    describe('extractSuiteName', () => {
        test('should extract suite name from test parent title', () => {
            const test = {
                parent: { title: 'Test Suite' }
            } as unknown as Frameworks.Test
            expect(extractSuiteName(test)).toBe('Test Suite')
        })

        test('should extract suite name from fullName when no parent', () => {
            const test = {
                title: 'My Test',
                fullName: 'Test Suite My Test'
            } as unknown as Frameworks.Test
            expect(extractSuiteName(test)).toBe('Test Suite')
        })

        test('should return unknown when no test provided', () => {
            expect(extractSuiteName()).toBe('unknown')
        })

        test('should return unknown when no title or fullName', () => {
            const test = {} as Frameworks.Test
            expect(extractSuiteName(test)).toBe('unknown')
        })

        test('should handle empty title in fullName', () => {
            const test = {
                title: '',
                fullName: 'Suite Name'
            } as unknown as Frameworks.Test
            expect(extractSuiteName(test)).toBe('Suite Name')
        })

        test('should handle parent with non-string title', () => {
            const test = {
                parent: { title: null }
            } as unknown as Frameworks.Test
            expect(extractSuiteName(test)).toBe('unknown')
        })
    })

    describe('extractTestName', () => {
        test('should extract test name from title', () => {
            const test = { title: 'My Test' } as unknown as Frameworks.Test
            expect(extractTestName(test)).toBe('My Test')
        })

        test('should extract test name from description', () => {
            const test = { description: 'Test Description' } as unknown as Frameworks.Test
            expect(extractTestName(test)).toBe('Test Description')
        })

        test('should prioritize title over description', () => {
            const test = {
                title: 'Test Title',
                description: 'Test Description'
            } as unknown as Frameworks.Test
            expect(extractTestName(test)).toBe('Test Title')
        })

        test('should return unknown when no test provided', () => {
            expect(extractTestName()).toBe('unknown')
        })

        test('should return unknown when no title or description', () => {
            const test = {} as unknown as Frameworks.Test
            expect(extractTestName(test)).toBe('unknown')
        })
    })

    describe('buildTestContext', () => {
        test('should build complete test context from test and file', () => {
            const test = {
                title: 'My Test',
                parent: { title: 'Test Suite' },
                file: 'test/spec.ts'
            } as unknown as Frameworks.Test & { file: string }

            const context = buildTestContext(test, 'test/override.ts')

            expect(context).toEqual({
                testFile: 'test/override.ts',
                suiteName: 'Test Suite',
                testName: 'My Test',
                lineNumber: undefined
            })
        })

        test('should use extracted test file when testFile param not provided', () => {
            const test = {
                title: 'My Test',
                parent: { title: 'Test Suite' },
                file: 'test/spec.ts'
            } as unknown as Frameworks.Test & { file: string }

            const context = buildTestContext(test)

            expect(context.testFile).toBe('test/spec.ts')
        })

        test('should handle undefined test', () => {
            const context = buildTestContext()

            expect(context).toEqual({
                testFile: undefined,
                suiteName: 'unknown',
                testName: 'unknown',
                lineNumber: undefined
            })
        })

        test('should never include lineNumber in context', () => {
            const test = {
                title: 'My Test',
                parent: { title: 'Test Suite' }
            } as unknown as Frameworks.Test

            const context = buildTestContext(test, 'test/spec.ts')

            expect(context.lineNumber).toBeUndefined()
        })
    })
})

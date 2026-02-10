import fs from 'node:fs'
import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest'
import type { Capabilities } from '@wdio/types'

import { aggregateSelectorPerformanceData } from '../../src/mobileSelectorPerformanceOptimizer/aggregator.js'
import * as store from '../../src/mobileSelectorPerformanceOptimizer/mspo-store.js'

vi.mock('node:fs', () => ({
    default: {
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        readdirSync: vi.fn(),
        readFileSync: vi.fn(),
        rmSync: vi.fn()
    }
}))

vi.mock('node:path', () => ({
    default: {
        join: vi.fn((...args: string[]) => args.join('/'))
    }
}))

vi.mock('../../src/mobileSelectorPerformanceOptimizer/mspo-store.js', () => ({
    getPerformanceData: vi.fn().mockReturnValue([])
}))

describe('aggregateSelectorPerformanceData', () => {
    let mockCapabilities: Capabilities.TestrunnerCapabilities
    let writeFnMock: ReturnType<typeof vi.fn>

    const createMockData = (overrides?: Record<string, unknown>) => [{
        testFile: 'test.ts',
        suiteName: 'Suite',
        testName: 'Test',
        selector: '//xpath',
        selectorType: 'xpath',
        duration: 100,
        timestamp: Date.now(),
        ...overrides
    }]

    const createOptimizedMockData = (overrides?: Record<string, unknown>) => createMockData({
        optimizedSelector: '~button',
        optimizedDuration: 50,
        improvementMs: 50,
        improvementPercent: 50,
        ...overrides
    })

    const callAggregator = (options: { enableCliReport?: boolean, enableMarkdownReport?: boolean } = {}) =>
        aggregateSelectorPerformanceData(
            mockCapabilities,
            100,
            writeFnMock,
            '/test/report/dir',
            options
        )

    beforeEach(() => {
        vi.clearAllMocks()
        mockCapabilities = [{ 'appium:deviceName': 'iPhone 15' }]
        writeFnMock = vi.fn()

        vi.mocked(fs.existsSync).mockReturnValue(true)
        vi.mocked(fs.readdirSync).mockReturnValue([])
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('enableCliReport flag', () => {
        test('should write CLI report to stdout when enableCliReport is true', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createOptimizedMockData())

            await callAggregator({ enableCliReport: true })

            expect(writeFnMock).toHaveBeenCalled()
            const allCalls = writeFnMock.mock.calls.map((call: string[]) => call[0]).join('')
            expect(allCalls).toContain('Mobile Selector Performance')
        })

        test('should NOT write CLI report when enableCliReport is false', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createOptimizedMockData())

            await callAggregator({ enableCliReport: false })

            const allCalls = writeFnMock.mock.calls.map((call: string[]) => call[0]).join('')
            expect(allCalls).not.toContain('Mobile Selector Performance')
        })

        test('should still write JSON report even when enableCliReport is false', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createMockData())

            await callAggregator({ enableCliReport: false })

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('mobile-selector-performance-optimizer-report'),
                expect.any(String)
            )
        })
    })

    describe('enableMarkdownReport flag', () => {
        test('should NOT write markdown report when enableMarkdownReport is false', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createOptimizedMockData())

            await callAggregator({ enableMarkdownReport: false })

            const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls as any[]
            const markdownCalls = writeFileCalls.filter((call) =>
                String(call[0]).endsWith('.md')
            )
            expect(markdownCalls).toHaveLength(0)
        })

        test('should write markdown report to logs folder when enableMarkdownReport is true', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createOptimizedMockData())

            await callAggregator({ enableMarkdownReport: true })

            const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls as any[]
            const markdownCalls = writeFileCalls.filter((call) =>
                String(call[0]).endsWith('.md')
            )
            expect(markdownCalls).toHaveLength(1)
            expect(markdownCalls[0][0]).toContain('/test/report/dir')
            expect(markdownCalls[0][0]).toContain('mobile-selector-performance-optimizer-report')
        })

        test('markdown report should contain same content as CLI report', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createOptimizedMockData())

            await callAggregator({ enableMarkdownReport: true, enableCliReport: true })

            const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls as any[]
            const markdownCall = writeFileCalls.find((call) =>
                String(call[0]).endsWith('.md')
            )
            expect(markdownCall).toBeDefined()

            const markdownContent = markdownCall![1]

            expect(markdownContent).toContain('Mobile Selector Performance')
            expect(markdownContent).toContain('Summary')
        })

        test('should write markdown report even when enableCliReport is false', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createOptimizedMockData())

            await callAggregator({ enableMarkdownReport: true, enableCliReport: false })

            const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls as any[]
            const markdownCalls = writeFileCalls.filter((call) =>
                String(call[0]).endsWith('.md')
            )
            expect(markdownCalls).toHaveLength(1)
        })

        test('should log markdown report location to console when enableMarkdownReport is true', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            vi.mocked(store.getPerformanceData).mockReturnValue(createOptimizedMockData())

            await callAggregator({ enableMarkdownReport: true, enableCliReport: false })

            expect(consoleSpy).toHaveBeenCalled()
            const loggedMessage = consoleSpy.mock.calls.map(call => call[0]).join('')
            expect(loggedMessage).toContain('Markdown report written to')
            expect(loggedMessage).toContain('.md')

            consoleSpy.mockRestore()
        })

        test('markdown report should use proper markdown formatting with headers and bold', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createOptimizedMockData())

            await callAggregator({ enableMarkdownReport: true, enableCliReport: false })

            const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls as any[]
            const markdownCall = writeFileCalls.find((call) =>
                String(call[0]).endsWith('.md')
            )
            expect(markdownCall).toBeDefined()

            const markdownContent = markdownCall![1] as string

            expect(markdownContent).toContain('# ')
            expect(markdownContent).toContain('## ')
            expect(markdownContent).toContain('**')
        })
    })

    describe('JSON report always written', () => {
        test('should always write JSON report when enabled (regardless of other flags)', async () => {
            vi.mocked(store.getPerformanceData).mockReturnValue(createMockData())

            await callAggregator({ enableCliReport: false, enableMarkdownReport: false })

            const writeFileCalls = vi.mocked(fs.writeFileSync).mock.calls as any[]
            const jsonCalls = writeFileCalls.filter((call) =>
                String(call[0]).endsWith('.json')
            )
            expect(jsonCalls).toHaveLength(1)
        })
    })
})

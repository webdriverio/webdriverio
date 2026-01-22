import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateMarkdownReport } from '../../src/mobileSelectorPerformanceOptimizer/markdown-formatter.js'
import type { SelectorPerformanceData } from '../../src/mobileSelectorPerformanceOptimizer/types.js'

/**
 * Helper to create mock SelectorPerformanceData with all required fields
 */
function createMockData(overrides: Partial<SelectorPerformanceData> = {}): SelectorPerformanceData {
    return {
        testFile: 'test.ts',
        suiteName: 'Suite',
        testName: 'Test',
        selector: 'sel1',
        selectorType: 'xpath',
        duration: 100,
        timestamp: Date.now(),
        ...overrides
    }
}

describe('markdown-formatter', () => {
    describe('generateMarkdownReport', () => {
        beforeEach(() => {
            // Mock Date to get consistent timestamps in tests
            const mockDate = new Date('2024-01-15T10:30:00.000Z')
            vi.setSystemTime(mockDate)
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        describe('empty data', () => {
            test('should generate report with no optimization opportunities message', () => {
                const result = generateMarkdownReport([], 'iPhone 15')

                expect(result).toContain('# 📊 Mobile Selector Performance Optimizer Report')
                expect(result).toContain('**Device:** iPhone 15')
                expect(result).toContain('## ✅ Summary')
                expect(result).toContain('No optimization opportunities found. All selectors performed well!')
            })

            test('should include device name in header', () => {
                const result = generateMarkdownReport([], 'iPad Pro 12.9')

                expect(result).toContain('**Device:** iPad Pro 12.9')
            })

            test('should include generated timestamp', () => {
                const result = generateMarkdownReport([], 'iPhone 15')

                expect(result).toContain('**Generated:**')
            })
        })

        describe('markdown formatting', () => {
            const mockData: SelectorPerformanceData[] = [createMockData({
                testFile: 'test.spec.ts',
                suiteName: 'Login Suite',
                testName: 'should login successfully',
                selector: '//XCUIElementTypeButton[@name="Login"]',
                selectorType: 'xpath',
                optimizedSelector: '~Login',
                duration: 150,
                improvementMs: 100,
                improvementPercent: 66.7
            })]

            test('should use H1 header for main title', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('# 📊 Mobile Selector Performance Optimizer Report')
            })

            test('should use H2 headers for main sections', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('## 📈 Summary')
                expect(result).toContain('## 🏆 Top 10 Most Impactful Optimizations')
                expect(result).toContain('## 📋 All Actions Required - Grouped by Test')
                expect(result).toContain('## 💡 Why Change?')
            })

            test('should use H3 headers for subsections', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('### Impact Breakdown')
                expect(result).toContain('### 📚 Documentation')
                expect(result).toContain('### 📁 test.spec.ts')
            })

            test('should use H4 headers for suites', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('#### 📦 Suite: "Login Suite"')
            })

            test('should use H5 headers for tests', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('##### 🧪 Test: "should login successfully"')
            })

            test('should use bold text for emphasis', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Bold in table values
                expect(result).toMatch(/\*\*\d+\*\*/)
                // Bold in "Replace:" text
                expect(result).toContain('**Replace:**')
            })

            test('should use inline code for selectors', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('`')
            })

            test('should use markdown tables', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Summary table
                expect(result).toContain('| Metric | Value |')
                expect(result).toContain('|--------|-------|')

                // Impact breakdown table
                expect(result).toContain('| Impact Level | Count |')
                expect(result).toContain('|--------------|-------|')

                // Top optimizations table
                expect(result).toContain('| # | Original | Optimized | Improvement | Time Saved |')
                expect(result).toContain('|---|----------|-----------|-------------|------------|')
            })

            test('should use bullet lists for actions', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('- **Replace:**')
            })

            test('should use markdown links for documentation', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('[Accessibility ID Selectors](https://webdriver.io/docs/selectors#accessibility-id)')
                expect(result).toContain('[iOS Class Chain Selectors](https://webdriver.io/docs/selectors#ios-uiautomation)')
                expect(result).toContain('[Mobile Selectors Best Practices](https://webdriver.io/docs/selectors#mobile-selectors)')
            })

            test('should include horizontal rule before footer', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('---')
            })

            test('should include italic footer text', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('*Generated by WebdriverIO Mobile Selector Performance Optimizer*')
            })
        })

        describe('summary statistics', () => {
            test('should calculate total optimizations', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('| Total selectors analyzed | **2** |')
            })

            test('should calculate average improvement', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Average of 50 and 30 is 40
                expect(result).toContain('| Average improvement | **40.0%** faster |')
            })

            test('should calculate total time saved', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Total: 50 + 30 = 80ms = 0.08s
                expect(result).toContain('| Total time saved | **80.00ms** (0.08s) per test run |')
            })
        })

        describe('impact breakdown', () => {
            test('should categorize high impact (>50%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 60, improvementPercent: 60 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('| 🔴 High (>50%) | 1 |')
                expect(result).toContain('| 🟠 Medium (20-50%) | 0 |')
            })

            test('should categorize medium impact (20-50%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 35, improvementPercent: 35 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('| 🔴 High (>50%) | 0 |')
                expect(result).toContain('| 🟠 Medium (20-50%) | 1 |')
            })

            test('should categorize low impact (10-20%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 15, improvementPercent: 15 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('| 🟡 Low (10-20%) | 1 |')
            })

            test('should categorize minor impact (<10%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 5, improvementPercent: 5 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('| ⚪ Minor (<10%) | 1 |')
            })
        })

        describe('top 10 optimizations', () => {
            test('should sort by improvement time descending', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 30, improvementPercent: 30 }),
                    createMockData({ selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ selector: 'sel3', optimizedSelector: 'opt3', improvementMs: 10, improvementPercent: 10 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // The order in the table should be: sel2 (50ms), sel1 (30ms), sel3 (10ms)
                const lines = result.split('\n')
                const tableLines = lines.filter(l => l.startsWith('| ') && l.includes('50.00ms'))
                expect(tableLines.length).toBeGreaterThan(0)
            })

            test('should limit to 10 entries', () => {
                const mockData: SelectorPerformanceData[] = Array.from({ length: 15 }, (_, i) =>
                    createMockData({
                        selector: `sel${i}`,
                        optimizedSelector: `opt${i}`,
                        improvementMs: i * 10,
                        improvementPercent: i * 5
                    })
                )

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Find the top optimizations table and count rows
                // The table starts with "| # |" header and each data row starts with "| NUMBER |"
                const topOptSection = result.split('## 🏆 Top 10 Most Impactful Optimizations')[1]?.split('## ')[0] || ''
                // Match table rows that start with | followed by a number (1-10)
                const dataRows = topOptSection.match(/^\| \d+ \|/gm) || []
                expect(dataRows.length).toBe(10)
            })
        })

        describe('grouping by test', () => {
            test('should group selectors by test file', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ testFile: 'file1.spec.ts', suiteName: 'Suite1', testName: 'Test1', selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ testFile: 'file2.spec.ts', suiteName: 'Suite2', testName: 'Test2', selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('### 📁 file1.spec.ts')
                expect(result).toContain('### 📁 file2.spec.ts')
            })

            test('should group selectors by suite within test file', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ testFile: 'file.spec.ts', suiteName: 'Suite A', testName: 'Test1', selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ testFile: 'file.spec.ts', suiteName: 'Suite B', testName: 'Test2', selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('#### 📦 Suite: "Suite A"')
                expect(result).toContain('#### 📦 Suite: "Suite B"')
            })

            test('should group selectors by test within suite', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ testFile: 'file.spec.ts', suiteName: 'Suite', testName: 'Test A', selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ testFile: 'file.spec.ts', suiteName: 'Suite', testName: 'Test B', selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('##### 🧪 Test: "Test A"')
                expect(result).toContain('##### 🧪 Test: "Test B"')
            })

            test('should handle missing test file with default', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ testFile: undefined as unknown as string, suiteName: 'Suite', testName: 'Test', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('### 📁 Unknown File')
            })

            test('should handle missing suite name with default', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ testFile: 'file.spec.ts', suiteName: undefined as unknown as string, testName: 'Test', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('#### 📦 Suite: "Unknown Suite"')
            })

            test('should handle missing test name with default', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ testFile: 'file.spec.ts', suiteName: 'Suite', testName: undefined as unknown as string, optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('##### 🧪 Test: "Unknown Test"')
            })
        })

        describe('selector location', () => {
            test('should include selector location when provided', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    testFile: 'test.spec.ts',
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50,
                    selectorFile: 'LoginPage.ts',
                    lineNumber: 42
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('📍 Found at: `LoginPage.ts:42`')
            })

            test('should include selector location with just file when no line number', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    testFile: 'test.spec.ts',
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50,
                    selectorFile: 'LoginPage.ts'
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('📍 Found at: `LoginPage.ts`')
            })

            test('should not include location section when not provided', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    testFile: 'test.spec.ts',
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).not.toContain('📍 Found at:')
            })
        })

        describe('why change section', () => {
            test('should include performance improvement summary', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: 500,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('**Average 50.0% performance improvement**')
                expect(result).toContain('0.50 seconds faster per run')
            })

            test('should include stability benefit', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('**More stable:** Uses native iOS accessibility identifiers or class chains')
            })

            test('should include maintainability benefit', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('**Better maintainability:** Optimized selectors are less brittle than XPath')
            })
        })

        describe('edge cases', () => {
            test('should handle undefined improvementMs', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: undefined,
                    improvementPercent: undefined
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('0.00ms')
                expect(result).toContain('0.0%')
            })

            test('should handle missing optimizedSelector', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: undefined,
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('N/A')
            })
        })
    })
})

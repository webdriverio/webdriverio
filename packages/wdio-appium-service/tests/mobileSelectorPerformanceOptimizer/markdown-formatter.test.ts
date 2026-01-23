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
                expect(result).toContain('No optimization opportunities found. All selectors are already optimized!')
            })

            test('should include device name in header', () => {
                const result = generateMarkdownReport([], 'iPad Pro 12.9')

                expect(result).toContain('**Device:** iPad Pro 12.9')
            })

            test('should include generated date', () => {
                const result = generateMarkdownReport([], 'iPhone 15')

                expect(result).toContain('**Generated:** 2024-01-15')
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
                improvementPercent: 66.7,
                selectorFile: 'LoginPage.ts',
                lineNumber: 10
            })]

            test('should use H1 header for main title', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('# 📊 Mobile Selector Performance Optimizer Report')
            })

            test('should use H2 headers for main sections', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('## 📈 Summary')
                expect(result).toContain('## 🎯 File-Based Fixes')
                expect(result).toContain('## 💡 Implementation Guide')
            })

            test('should use H3 headers for file groups with clickable links', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // File header should be a clickable markdown link
                expect(result).toContain('### 📁 [`LoginPage.ts`](LoginPage.ts)')
            })

            test('should use bold text for emphasis in header stats', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Bold in header stats
                expect(result).toContain('**Total Potential Savings:**')
                expect(result).toContain('**Average Improvement per Selector:**')
            })

            test('should use inline code for selectors', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('`')
            })

            test('should use markdown tables for executive summary', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('| Impact Level | Count | Action |')
                expect(result).toContain('|:-------------|------:|:-------|')
            })

            test('should use markdown tables for file-based fixes', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('| Location | Original | Optimized | Per Use | Uses | Total Saved |')
                expect(result).toContain('|:---------|:---------|:----------|--------:|-----:|-----------:|')
            })

            test('should use markdown links for documentation', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('[WebdriverIO Mobile Selectors](https://webdriver.io/docs/selectors#mobile-selectors)')
                expect(result).toContain('[iOS Predicate String](https://webdriver.io/docs/selectors#ios-predicate-string)')
                expect(result).toContain('[iOS Class Chain](https://webdriver.io/docs/selectors#ios-class-chain)')
            })

            test('should include horizontal rule before footer', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('---')
            })

            test('should include italic footer text', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('*Generated by WebdriverIO Mobile Selector Performance Optimizer')
            })
        })

        describe('header statistics', () => {
            test('should show analyzed selectors count', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('**Analyzed:** 2 unique selectors')
            })

            test('should calculate average improvement', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Average of 50 and 30 is 40
                expect(result).toContain('**Average Improvement per Selector:** **40.0%**')
            })

            test('should calculate total savings', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Total: 50×1 + 30×1 = 80ms (each selector used once)
                expect(result).toContain('**Total Potential Savings:** **80ms**')
            })
        })

        describe('executive summary impact breakdown', () => {
            test('should categorize high impact (>50%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 60, improvementPercent: 60 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('🔴 **High** (>50% gain) | 1 | Fix immediately')
            })

            test('should categorize medium impact (20-50%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 35, improvementPercent: 35 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('🟠 **Medium** (20-50% gain) | 1 | Recommended')
            })

            test('should categorize low impact (10-20%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 15, improvementPercent: 15 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('🟡 **Low** (10-20% gain) | 1 | Minor optimization')
            })

            test('should categorize minor impact (<10%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 5, improvementPercent: 5 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('⚪ **Minor** (<10% gain) | 1 | Optional')
            })

            test('should not show categories with zero count', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 60, improvementPercent: 60 })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Should have high impact but not others with 0
                expect(result).toContain('🔴 **High**')
                expect(result).not.toContain('🟠 **Medium**')
                expect(result).not.toContain('🟡 **Low**')
                expect(result).not.toContain('⚪ **Minor**')
            })
        })

        describe('file-based fixes', () => {
            test('should group selectors by source file', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50,
                        selectorFile: 'LoginPage.ts',
                        lineNumber: 10
                    }),
                    createMockData({
                        selector: 'sel2',
                        optimizedSelector: 'opt2',
                        improvementMs: 30,
                        improvementPercent: 30,
                        selectorFile: 'HomePage.ts',
                        lineNumber: 20
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // File headers should be clickable markdown links
                expect(result).toContain('### 📁 [`LoginPage.ts`](LoginPage.ts)')
                expect(result).toContain('### 📁 [`HomePage.ts`](HomePage.ts)')
            })

            test('should show line numbers as clickable links in table', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50,
                        selectorFile: 'LoginPage.ts',
                        lineNumber: 42
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Line number should be a clickable markdown link with #L anchor
                expect(result).toContain('[L42:](LoginPage.ts#L42)')
            })

            test('should show file total savings', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50,
                        selectorFile: 'LoginPage.ts',
                        lineNumber: 10
                    }),
                    createMockData({
                        selector: 'sel2',
                        optimizedSelector: 'opt2',
                        improvementMs: 30,
                        improvementPercent: 30,
                        selectorFile: 'LoginPage.ts',
                        lineNumber: 20
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // 50×1 + 30×1 = 80ms (each selector used once)
                expect(result).toContain('**File total:** 80ms saved (2 selectors)')
            })

            test('should show usage count', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50,
                        selectorFile: 'LoginPage.ts',
                        lineNumber: 10
                    }),
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 45,
                        improvementPercent: 45,
                        selectorFile: 'LoginPage.ts',
                        lineNumber: 10
                    }),
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 48,
                        improvementPercent: 48,
                        selectorFile: 'LoginPage.ts',
                        lineNumber: 10
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Selector appears 3 times so should show 3×
                expect(result).toContain('3×')
            })
        })

        describe('workspace-wide optimizations', () => {
            test('should show selectors without known location in workspace-wide section', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50
                        // No selectorFile or lineNumber
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('## 🔍 Workspace-Wide Optimizations')
                expect(result).toContain('Source file location unknown')
            })

            test('should not show workspace-wide section when all selectors have locations', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50,
                        selectorFile: 'LoginPage.ts',
                        lineNumber: 10
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).not.toContain('## 🔍 Workspace-Wide Optimizations')
            })
        })

        describe('performance warnings (negative optimizations)', () => {
            test('should show performance warnings for negative optimizations', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        duration: 10,
                        optimizedDuration: 100,
                        improvementMs: -90,
                        improvementPercent: -900
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('## ⚠️ Performance Warnings')
                expect(result).toContain('slower')
            })

            test('should show original vs optimized times in warnings', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        duration: 10,
                        optimizedDuration: 100,
                        improvementMs: -90,
                        improvementPercent: -900
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('10ms')
                expect(result).toContain('100ms')
            })

            test('should show slower in testing count in header', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50
                    }),
                    createMockData({
                        selector: 'sel2',
                        optimizedSelector: 'opt2',
                        improvementMs: -10,
                        improvementPercent: -50
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('1 optimizable, 1 not recommended')
            })

            test('should not show warnings section when no negative optimizations', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).not.toContain('## ⚠️ Performance Warnings')
            })
        })

        describe('implementation guide', () => {
            test('should include why make these changes section', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('### Why make these changes?')
            })

            test('should include speed benefit', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('**Speed:**')
            })

            test('should include stability benefit', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('**Stability:**')
            })

            test('should include selector priority list', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toContain('### Selector Priority (fastest to slowest)')
                expect(result).toContain('**Accessibility ID**')
                expect(result).toContain('**iOS Predicate String**')
                expect(result).toContain('**iOS Class Chain**')
                expect(result).toContain('**XPath**')
            })
        })

        describe('deduplication', () => {
            test('should deduplicate selectors keeping highest improvement', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 30,
                        improvementPercent: 30,
                        selectorFile: 'Page.ts',
                        lineNumber: 10
                    }),
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 50,
                        improvementPercent: 50,
                        selectorFile: 'Page.ts',
                        lineNumber: 10
                    }),
                    createMockData({
                        selector: 'sel1',
                        optimizedSelector: 'opt1',
                        improvementMs: 20,
                        improvementPercent: 20,
                        selectorFile: 'Page.ts',
                        lineNumber: 10
                    })
                ]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Should only show one entry with the highest improvement (50ms)
                expect(result).toContain('50.0ms')
                // File total should be 50ms×3 uses = 150ms (deduplicated with usage count)
                expect(result).toContain('**File total:** 150ms saved (1 selector)')
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

                // Should still generate a report without errors
                expect(result).toContain('# 📊 Mobile Selector Performance Optimizer Report')
            })

            test('should handle missing optimizedSelector', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: undefined,
                    improvementMs: 50,
                    improvementPercent: 50
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Should generate empty sections report
                expect(result).toContain('# 📊 Mobile Selector Performance Optimizer Report')
            })

            test('should escape pipe characters in selectors for tables', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    selector: 'sel|with|pipes',
                    optimizedSelector: 'opt|with|pipes',
                    improvementMs: 50,
                    improvementPercent: 50,
                    selectorFile: 'Page.ts',
                    lineNumber: 10
                })]

                const result = generateMarkdownReport(mockData, 'iPhone 15')

                // Pipes should be escaped
                expect(result).toContain('\\|')
            })
        })
    })
})

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

                expect(result).toMatchSnapshot()
            })

            test('should include device name in header', () => {
                const result = generateMarkdownReport([], 'iPad Pro 12.9')

                expect(result).toMatchSnapshot()
            })

            test('should include generated date', () => {
                const result = generateMarkdownReport([], 'iPhone 15')

                expect(result).toMatchSnapshot()
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

            test('should generate complete markdown report with proper formatting', () => {
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
            })
        })

        describe('header statistics', () => {
            test('should show analyzed selectors count and calculate statistics', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ selector: 'sel1', optimizedSelector: 'opt1', improvementMs: 50, improvementPercent: 50 }),
                    createMockData({ selector: 'sel2', optimizedSelector: 'opt2', improvementMs: 30, improvementPercent: 30 })
                ]
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
            })
        })

        describe('executive summary impact breakdown', () => {
            test('should categorize high impact (>50%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 60, improvementPercent: 60 })
                ]
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
            })

            test('should categorize medium impact (20-50%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 35, improvementPercent: 35 })
                ]
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
            })

            test('should categorize low impact (10-20%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 15, improvementPercent: 15 })
                ]
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
            })

            test('should categorize minor impact (<10%)', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 5, improvementPercent: 5 })
                ]
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
            })

            test('should not show categories with zero count', () => {
                const mockData: SelectorPerformanceData[] = [
                    createMockData({ optimizedSelector: 'opt1', improvementMs: 60, improvementPercent: 60 })
                ]
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
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
            test('should include implementation guide with all sections', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: 'opt1',
                    improvementMs: 50,
                    improvementPercent: 50
                })]
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
            })

            test('should handle missing optimizedSelector', () => {
                const mockData: SelectorPerformanceData[] = [createMockData({
                    optimizedSelector: undefined,
                    improvementMs: 50,
                    improvementPercent: 50
                })]
                const result = generateMarkdownReport(mockData, 'iPhone 15')

                expect(result).toMatchSnapshot()
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

                expect(result).toMatchSnapshot()
            })
        })
    })
})

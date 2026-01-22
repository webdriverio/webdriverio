import type { SelectorPerformanceData } from './types.js'
import { formatSelectorForDisplay } from './utils/index.js'

/**
 * Groups optimized selectors by test file, suite, and test for the markdown report
 */
function groupByTestFile(data: SelectorPerformanceData[]): Map<string, Map<string, Map<string, SelectorPerformanceData[]>>> {
    const grouped = new Map<string, Map<string, Map<string, SelectorPerformanceData[]>>>()

    for (const entry of data) {
        const testFile = entry.testFile || 'Unknown File'
        const suiteName = entry.suiteName || 'Unknown Suite'
        const testName = entry.testName || 'Unknown Test'

        if (!grouped.has(testFile)) {
            grouped.set(testFile, new Map())
        }
        const fileMap = grouped.get(testFile)!

        if (!fileMap.has(suiteName)) {
            fileMap.set(suiteName, new Map())
        }
        const suiteMap = fileMap.get(suiteName)!

        if (!suiteMap.has(testName)) {
            suiteMap.set(testName, [])
        }
        suiteMap.get(testName)!.push(entry)
    }

    return grouped
}

/**
 * Generates a properly formatted markdown report for the selector performance data
 */
export function generateMarkdownReport(
    optimizedSelectors: SelectorPerformanceData[],
    deviceName: string
): string {
    const lines: string[] = []

    // Header
    lines.push('# 📊 Mobile Selector Performance Optimizer Report')
    lines.push('')
    lines.push(`**Device:** ${deviceName}`)
    lines.push(`**Generated:** ${new Date().toISOString()}`)
    lines.push('')

    if (optimizedSelectors.length === 0) {
        lines.push('## ✅ Summary')
        lines.push('')
        lines.push('No optimization opportunities found. All selectors performed well!')
        lines.push('')
        return lines.join('\n')
    }

    // Calculate statistics
    const totalOptimizations = optimizedSelectors.length
    const totalTimeSaved = optimizedSelectors.reduce((sum, d) => sum + (d.improvementMs || 0), 0)
    const avgImprovement = optimizedSelectors.reduce((sum, d) => sum + (d.improvementPercent || 0), 0) / totalOptimizations

    // Impact breakdown
    const highImpact = optimizedSelectors.filter(d => (d.improvementPercent || 0) >= 50).length
    const mediumImpact = optimizedSelectors.filter(d => (d.improvementPercent || 0) >= 20 && (d.improvementPercent || 0) < 50).length
    const lowImpact = optimizedSelectors.filter(d => (d.improvementPercent || 0) >= 10 && (d.improvementPercent || 0) < 20).length
    const minorImpact = optimizedSelectors.filter(d => (d.improvementPercent || 0) < 10).length

    // Summary section
    lines.push('## 📈 Summary')
    lines.push('')
    lines.push('| Metric | Value |')
    lines.push('|--------|-------|')
    lines.push(`| Total selectors analyzed | **${totalOptimizations}** |`)
    lines.push(`| Positive optimizations found | **${totalOptimizations}** |`)
    lines.push(`| Average improvement | **${avgImprovement.toFixed(1)}%** faster |`)
    lines.push(`| Total time saved | **${totalTimeSaved.toFixed(2)}ms** (${(totalTimeSaved / 1000).toFixed(2)}s) per test run |`)
    lines.push('')

    // Impact breakdown
    lines.push('### Impact Breakdown')
    lines.push('')
    lines.push('| Impact Level | Count |')
    lines.push('|--------------|-------|')
    lines.push(`| 🔴 High (>50%) | ${highImpact} |`)
    lines.push(`| 🟠 Medium (20-50%) | ${mediumImpact} |`)
    lines.push(`| 🟡 Low (10-20%) | ${lowImpact} |`)
    lines.push(`| ⚪ Minor (<10%) | ${minorImpact} |`)
    lines.push('')

    // Top 10 Most Impactful Optimizations
    lines.push('## 🏆 Top 10 Most Impactful Optimizations')
    lines.push('')

    const sortedByImpact = [...optimizedSelectors]
        .sort((a, b) => (b.improvementMs || 0) - (a.improvementMs || 0))
        .slice(0, 10)

    lines.push('| # | Original | Optimized | Improvement | Time Saved |')
    lines.push('|---|----------|-----------|-------------|------------|')

    sortedByImpact.forEach((entry, index) => {
        const original = formatSelectorForDisplay(entry.selector, Infinity)
        const optimized = entry.optimizedSelector ? formatSelectorForDisplay(entry.optimizedSelector, Infinity) : 'N/A'
        const improvement = `${(entry.improvementPercent || 0).toFixed(1)}%`
        const timeSaved = `${(entry.improvementMs || 0).toFixed(2)}ms`
        lines.push(`| ${index + 1} | \`${original}\` | \`${optimized}\` | ${improvement} | ${timeSaved} |`)
    })

    lines.push('')

    // All Actions Required - Grouped by Test
    lines.push('## 📋 All Actions Required - Grouped by Test')
    lines.push('')

    const grouped = groupByTestFile(optimizedSelectors)

    for (const [testFile, suiteMap] of grouped) {
        lines.push(`### 📁 ${testFile}`)
        lines.push('')

        for (const [suiteName, testMap] of suiteMap) {
            lines.push(`#### 📦 Suite: "${suiteName}"`)
            lines.push('')

            for (const [testName, entries] of testMap) {
                lines.push(`##### 🧪 Test: "${testName}"`)
                lines.push('')

                for (const entry of entries) {
                    const original = formatSelectorForDisplay(entry.selector, Infinity)
                    const optimized = entry.optimizedSelector ? formatSelectorForDisplay(entry.optimizedSelector, Infinity) : 'N/A'
                    const improvement = `${(entry.improvementPercent || 0).toFixed(1)}%`

                    lines.push(`- **Replace:** \`${original}\` → \`${optimized}\` *(${improvement} faster)*`)

                    // Show selector location if available
                    const selectorLocation = entry.selectorFile
                        ? (entry.lineNumber ? `${entry.selectorFile}:${entry.lineNumber}` : entry.selectorFile)
                        : null
                    if (selectorLocation) {
                        lines.push(`  - 📍 Found at: \`${selectorLocation}\``)
                    }
                }
                lines.push('')
            }
        }
    }

    // Why Change section
    lines.push('## 💡 Why Change?')
    lines.push('')
    lines.push(`- **Average ${avgImprovement.toFixed(1)}% performance improvement** (total of ${(totalTimeSaved / 1000).toFixed(2)} seconds faster per run)`)
    lines.push('- **More stable:** Uses native iOS accessibility identifiers or class chains')
    lines.push('- **Better maintainability:** Optimized selectors are less brittle than XPath')
    lines.push('')

    // Documentation links
    lines.push('### 📚 Documentation')
    lines.push('')
    lines.push('- [Accessibility ID Selectors](https://webdriver.io/docs/selectors#accessibility-id)')
    lines.push('- [iOS Class Chain Selectors](https://webdriver.io/docs/selectors#ios-uiautomation)')
    lines.push('- [Mobile Selectors Best Practices](https://webdriver.io/docs/selectors#mobile-selectors)')
    lines.push('')

    // Footer
    lines.push('---')
    lines.push('')
    lines.push('*Generated by WebdriverIO Mobile Selector Performance Optimizer*')
    lines.push('')

    return lines.join('\n')
}

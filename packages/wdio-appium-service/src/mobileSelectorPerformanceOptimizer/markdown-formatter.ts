import path from 'node:path'

import type { SelectorPerformanceData } from './types.js'
import { formatSelectorForDisplay } from './utils/index.js'

/**
 * Timing information for the test run
 */
export interface RunTimingInfo {
    startTime: number
    endTime: number
    totalRunDurationMs: number
}

/**
 * Grouped optimization data for reporting
 */
interface GroupedOptimization {
    selector: string
    optimizedSelector: string
    improvementMs: number
    improvementPercent: number
    lineNumber?: number
    selectorFile?: string
    testFile: string
    usageCount: number
}

/**
 * File-based grouping with subtotals
 */
interface FileGroup {
    filePath: string
    optimizations: GroupedOptimization[]
    totalSavingsMs: number  // Per-use savings sum (for display)
    totalSavingsWithUsage: number  // True total = sum(improvementMs × usageCount)
}

/**
 * Count selector usage across all data entries
 */
function countSelectorUsage(data: SelectorPerformanceData[]): Map<string, number> {
    const counts = new Map<string, number>()
    for (const entry of data) {
        const count = counts.get(entry.selector) || 0
        counts.set(entry.selector, count + 1)
    }
    return counts
}

/**
 * Deduplicate selectors, keeping the one with highest improvement
 */
function deduplicateSelectors(
    data: SelectorPerformanceData[],
    usageCounts: Map<string, number>
): GroupedOptimization[] {
    const selectorMap = new Map<string, GroupedOptimization>()

    for (const entry of data) {
        if (!entry.optimizedSelector || entry.improvementMs === undefined) {
            continue
        }

        const existing = selectorMap.get(entry.selector)
        const current: GroupedOptimization = {
            selector: entry.selector,
            optimizedSelector: entry.optimizedSelector,
            improvementMs: entry.improvementMs,
            improvementPercent: entry.improvementPercent || 0,
            lineNumber: entry.lineNumber,
            selectorFile: entry.selectorFile,
            testFile: entry.testFile,
            usageCount: usageCounts.get(entry.selector) || 1
        }

        // Keep entry with highest absolute improvement (for both positive and negative)
        if (!existing || Math.abs(current.improvementMs) > Math.abs(existing.improvementMs)) {
            // Prefer entries with known location
            if (existing && !current.selectorFile && existing.selectorFile) {
                current.selectorFile = existing.selectorFile
                current.lineNumber = existing.lineNumber
            }
            selectorMap.set(entry.selector, current)
        } else if (!existing.selectorFile && current.selectorFile) {
            // Update location if we found one
            existing.selectorFile = current.selectorFile
            existing.lineNumber = current.lineNumber
        }
    }

    return Array.from(selectorMap.values())
}

/**
 * Group optimizations by source file
 */
function groupByFile(optimizations: GroupedOptimization[]): {
    fileGroups: FileGroup[]
    workspaceWide: GroupedOptimization[]
} {
    const fileMap = new Map<string, GroupedOptimization[]>()
    const workspaceWide: GroupedOptimization[] = []

    for (const opt of optimizations) {
        const filePath = opt.selectorFile
        if (filePath && opt.lineNumber) {
            if (!fileMap.has(filePath)) {
                fileMap.set(filePath, [])
            }
            fileMap.get(filePath)!.push(opt)
        } else {
            workspaceWide.push(opt)
        }
    }

    const fileGroups: FileGroup[] = []
    for (const [filePath, opts] of fileMap.entries()) {
        // Sort by line number within file
        opts.sort((a, b) => (a.lineNumber || 0) - (b.lineNumber || 0))
        const totalSavingsMs = opts.reduce((sum, o) => sum + o.improvementMs, 0)
        const totalSavingsWithUsage = opts.reduce((sum, o) => sum + (o.improvementMs * o.usageCount), 0)
        fileGroups.push({ filePath, optimizations: opts, totalSavingsMs, totalSavingsWithUsage })
    }

    // Sort files by total savings with usage (highest first)
    fileGroups.sort((a, b) => b.totalSavingsWithUsage - a.totalSavingsWithUsage)

    // Sort workspace-wide by total savings (improvementMs × usageCount)
    workspaceWide.sort((a, b) => (b.improvementMs * b.usageCount) - (a.improvementMs * a.usageCount))

    return { fileGroups, workspaceWide }
}

/**
 * Escape pipe characters for markdown tables
 */
function escapeForTable(str: string): string {
    return str.replace(/\|/g, '\\|')
}

/**
 * Determine the appropriate quote style for a selector
 * - XPath and class chain use single quotes (class chain uses backticks/double quotes internally)
 * - Predicate strings and other native selectors use double quotes (they use single quotes internally)
 */
function getQuoteStyle(selector: string): "'" | '"' {
    // XPath always uses single quotes (no internal quotes typically)
    if (selector.startsWith('//') || selector.startsWith('/')) {
        return "'"
    }
    // Class chain uses single quotes (internal predicates use backticks or double quotes)
    if (selector.startsWith('-ios class chain:')) {
        return "'"
    }
    // Predicate strings and accessibility IDs use double quotes
    // (predicate strings often contain single quotes like type == 'XCUIElementTypeButton')
    return '"'
}

/**
 * Format selector for markdown display as $('...') or $("...") with appropriate quotes
 */
function formatSelector(selector: string): string {
    const truncated = formatSelectorForDisplay(selector, 60)
    const quote = getQuoteStyle(selector)
    return `\`$(${quote}${escapeForTable(truncated)}${quote})\``
}

/**
 * Convert absolute file path to relative path from project root
 */
function toRelativePath(filePath: string, projectRoot?: string): string {
    if (!projectRoot) {
        return filePath
    }
    // If already relative, return as-is
    if (!path.isAbsolute(filePath)) {
        return filePath
    }
    return path.relative(projectRoot, filePath)
}

/**
 * Get just the filename from a path
 */
function getFileName(filePath: string): string {
    return path.basename(filePath)
}

/**
 * Format a file path as a clickable markdown link with line number
 */
function formatFileLink(filePath: string, lineNumber: number | undefined, projectRoot?: string): string {
    const relativePath = toRelativePath(filePath, projectRoot)
    const fileName = getFileName(filePath)

    if (lineNumber) {
        // [filename.ts:42](relative/path/filename.ts#L42)
        return `[\`${fileName}:${lineNumber}\`](${relativePath}#L${lineNumber})`
    }
    // [filename.ts](relative/path/filename.ts)
    return `[\`${fileName}\`](${relativePath})`
}

/**
 * Format a line number as a clickable markdown link
 */
function formatLineLink(filePath: string, lineNumber: number | undefined, projectRoot?: string): string {
    if (!lineNumber) {
        return 'L?:'
    }
    const relativePath = toRelativePath(filePath, projectRoot)
    return `[L${lineNumber}:](${relativePath}#L${lineNumber})`
}

/**
 * Format time in a human-readable way
 */
function formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/**
 * Format duration in a human-readable way
 */
function formatDuration(ms: number): string {
    if (ms < 1000) {
        return `${ms.toFixed(0)}ms`
    }
    const seconds = ms / 1000
    if (seconds < 60) {
        return `${seconds.toFixed(2)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
}

/**
 * Generates a properly formatted markdown report for the selector performance data
 * @param optimizedSelectors - The performance data for optimized selectors
 * @param deviceName - The device name for the report header
 * @param timingInfo - Optional timing information for the test run
 * @param projectRoot - Optional project root path for creating relative file links
 */
export function generateMarkdownReport(
    optimizedSelectors: SelectorPerformanceData[],
    deviceName: string,
    timingInfo?: RunTimingInfo,
    projectRoot?: string
): string {
    const lines: string[] = []

    // Header
    lines.push('# 📊 Mobile Selector Performance Optimizer Report')
    lines.push('')

    if (optimizedSelectors.length === 0) {
        lines.push(`**Device:** ${deviceName}`)
        lines.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`)
        lines.push('')
        lines.push('## ✅ Summary')
        lines.push('')
        lines.push('No optimization opportunities found. All selectors are already optimized!')
        lines.push('')
        return lines.join('\n')
    }

    // Count usage and deduplicate
    const usageCounts = countSelectorUsage(optimizedSelectors)
    const deduplicated = deduplicateSelectors(optimizedSelectors, usageCounts)

    // Separate positive and negative optimizations
    // Positive: optimized selector is faster (improvementMs > 0 means XPath took longer than native)
    // Negative: optimized selector is slower (improvementMs < 0 means native took longer than XPath)
    const positiveOptimizations = deduplicated.filter(o => o.improvementMs > 0)
    const negativeOptimizations = deduplicated.filter(o => o.improvementMs < 0)

    // Calculate true total savings (improvementMs × usageCount)
    const totalSavingsMs = positiveOptimizations.reduce((sum, o) => sum + (o.improvementMs * o.usageCount), 0)
    const avgImprovement = positiveOptimizations.length > 0
        ? positiveOptimizations.reduce((sum, o) => sum + o.improvementPercent, 0) / positiveOptimizations.length
        : 0

    // Impact categorization
    const highImpact = positiveOptimizations.filter(o => o.improvementPercent >= 50)
    const mediumImpact = positiveOptimizations.filter(o => o.improvementPercent >= 20 && o.improvementPercent < 50)
    const lowImpact = positiveOptimizations.filter(o => o.improvementPercent >= 10 && o.improvementPercent < 20)
    const minorImpact = positiveOptimizations.filter(o => o.improvementPercent > 0 && o.improvementPercent < 10)

    // Header stats
    lines.push(`**Device:** ${deviceName}`)

    // Timing information
    if (timingInfo) {
        lines.push(`**Run Time:** ${formatTime(timingInfo.startTime)} → ${formatTime(timingInfo.endTime)} (${formatDuration(timingInfo.totalRunDurationMs)})`)
    }

    lines.push(`**Analyzed:** ${deduplicated.length} unique selectors (${positiveOptimizations.length} optimizable${negativeOptimizations.length > 0 ? `, ${negativeOptimizations.length} not recommended` : ''})`)
    lines.push('')

    // Total savings with potential improvement percentage
    const savingsLine = `**Total Potential Savings:** **${formatDuration(totalSavingsMs)}** per test run`
    if (timingInfo && timingInfo.totalRunDurationMs > 0) {
        const improvementPercent = (totalSavingsMs / timingInfo.totalRunDurationMs) * 100
        lines.push(`${savingsLine} (**${improvementPercent.toFixed(1)}%** of total run time)`)
    } else {
        lines.push(savingsLine)
    }
    lines.push(`**Average Improvement per Selector:** **${avgImprovement.toFixed(1)}%** faster`)
    lines.push('')
    lines.push('---')
    lines.push('')

    // Summary
    lines.push('## 📈 Summary')
    lines.push('')
    lines.push('| Impact Level | Count | Action |')
    lines.push('|:-------------|------:|:-------|')
    if (highImpact.length > 0) {
        lines.push(`| 🔴 **High** (>50% gain) | ${highImpact.length} | Fix immediately |`)
    }
    if (mediumImpact.length > 0) {
        lines.push(`| 🟠 **Medium** (20-50% gain) | ${mediumImpact.length} | Recommended |`)
    }
    if (lowImpact.length > 0) {
        lines.push(`| 🟡 **Low** (10-20% gain) | ${lowImpact.length} | Minor optimization |`)
    }
    if (minorImpact.length > 0) {
        lines.push(`| ⚪ **Minor** (<10% gain) | ${minorImpact.length} | Optional |`)
    }
    if (negativeOptimizations.length > 0) {
        lines.push(`| ⚠️ **Slower in Testing** | ${negativeOptimizations.length} | See warnings below |`)
    }
    lines.push('')
    lines.push('---')
    lines.push('')

    // Group by file
    const { fileGroups, workspaceWide } = groupByFile(positiveOptimizations)

    // File-Based Fixes
    if (fileGroups.length > 0) {
        lines.push('## 🎯 File-Based Fixes')
        lines.push('')
        lines.push('*Update these specific lines in your Page Objects or Test files for immediate impact.*')
        lines.push('')

        for (const group of fileGroups) {
            const fileLink = formatFileLink(group.filePath, undefined, projectRoot)
            lines.push(`### 📁 ${fileLink}`)
            lines.push('')
            lines.push('| Location | Original | Optimized | Per Use | Uses | Total Saved |')
            lines.push('|:---------|:---------|:----------|--------:|-----:|-----------:|')

            for (const opt of group.optimizations) {
                const original = formatSelector(opt.selector)
                const optimized = formatSelector(opt.optimizedSelector)
                const perUse = `${opt.improvementMs.toFixed(1)}ms`
                const uses = `${opt.usageCount}×`
                const totalSaved = `${(opt.improvementMs * opt.usageCount).toFixed(1)}ms`
                const location = formatLineLink(group.filePath, opt.lineNumber, projectRoot)
                lines.push(`| ${location} | ${original} | ${optimized} | ${perUse} | ${uses} | ${totalSaved} |`)
            }

            lines.push('')
            lines.push(`> **File total:** ${formatDuration(group.totalSavingsWithUsage)} saved (${group.optimizations.length} selector${group.optimizations.length > 1 ? 's' : ''})`)
            lines.push('')
        }

        lines.push('---')
        lines.push('')
    }

    // Workspace-Wide Optimizations
    if (workspaceWide.length > 0) {
        lines.push('## 🔍 Workspace-Wide Optimizations')
        lines.push('')
        lines.push('*Source file location unknown. Search your IDE (Cmd+Shift+F / Ctrl+Shift+F) for these selectors.*')
        lines.push('')
        lines.push('| Original | Optimized | Per Use | Uses | Total Saved |')
        lines.push('|:---------|:----------|--------:|-----:|-----------:|')

        for (const opt of workspaceWide) {
            const original = formatSelector(opt.selector)
            const optimized = formatSelector(opt.optimizedSelector)
            const perUse = `${opt.improvementMs.toFixed(1)}ms`
            const uses = `${opt.usageCount}×`
            const totalSaved = `${(opt.improvementMs * opt.usageCount).toFixed(1)}ms`
            lines.push(`| ${original} | ${optimized} | ${perUse} | ${uses} | ${totalSaved} |`)
        }

        lines.push('')
        lines.push('---')
        lines.push('')
    }

    // Performance Warnings
    if (negativeOptimizations.length > 0) {
        lines.push('## ⚠️ Performance Warnings')
        lines.push('')
        lines.push('*In these cases, the suggested native selector was **slower** than XPath in your test environment. This can happen due to:*')
        lines.push('')
        lines.push('- **App-specific optimizations** - Some apps have optimized XPath handling')
        lines.push('- **Element hierarchy** - Deep nesting can sometimes favor XPath\'s tree traversal')
        lines.push('- **Caching effects** - First lookups may differ from subsequent ones')
        lines.push('- **Appium/driver version** - Native selector support varies by version')
        lines.push('')
        lines.push('*Recommendation: Keep using XPath for these selectors, or test both approaches in your CI pipeline.*')
        lines.push('')
        lines.push('| Location | XPath (Current) | Suggested Native | XPath Time | Native Time | Result |')
        lines.push('|:---------|:----------------|:-----------------|:-----------|:------------|:-------|')

        for (const opt of negativeOptimizations) {
            const xpathSelector = formatSelector(opt.selector)
            const nativeSelector = formatSelector(opt.optimizedSelector)
            const originalEntry = optimizedSelectors.find(e => e.selector === opt.selector)
            if (originalEntry) {
                // improvementMs = xpathDuration - nativeDuration
                // If improvementMs < 0, then nativeDuration > xpathDuration (native is slower)
                const xpathTime = `${originalEntry.duration.toFixed(0)}ms`
                const nativeTime = originalEntry.optimizedDuration
                    ? `${originalEntry.optimizedDuration.toFixed(0)}ms`
                    : `${(originalEntry.duration - opt.improvementMs).toFixed(0)}ms`
                const slowdownMs = Math.abs(opt.improvementMs)
                const slowdownPercent = Math.abs(opt.improvementPercent)
                const result = `Native ${slowdownMs.toFixed(0)}ms slower (${slowdownPercent.toFixed(0)}%)`
                const location = opt.selectorFile
                    ? formatFileLink(opt.selectorFile, opt.lineNumber, projectRoot)
                    : '*unknown*'
                lines.push(`| ${location} | ${xpathSelector} | ${nativeSelector} | ${xpathTime} | ${nativeTime} | ${result} |`)
            }
        }

        lines.push('')
        lines.push('---')
        lines.push('')
    }

    // Implementation Guide
    lines.push('## 💡 Implementation Guide')
    lines.push('')
    lines.push('### Why make these changes?')
    lines.push('')
    lines.push('- **Speed:** Native selectors (`~` Accessibility IDs, `-ios predicate string`, `-ios class chain`) bypass expensive XML tree traversal required by XPath')
    lines.push('- **Stability:** Native selectors are less affected by UI hierarchy changes that often break XPath queries')
    lines.push('- **Maintainability:** Shorter, more readable selectors are easier to debug and update')
    lines.push('')
    lines.push('### Selector Priority (fastest to slowest)')
    lines.push('')
    lines.push('1. **Accessibility ID** (`~elementId`) - Direct lookup, fastest')
    lines.push('2. **iOS Predicate String** (`-ios predicate string:...`) - Native predicate evaluation')
    lines.push('3. **iOS Class Chain** (`-ios class chain:...`) - Native hierarchy traversal')
    lines.push('4. **XPath** (`//...`) - Full XML serialization + parsing, slowest')
    lines.push('')
    lines.push('### Resources')
    lines.push('')
    lines.push('- [WebdriverIO Mobile Selectors](https://webdriver.io/docs/selectors#mobile-selectors)')
    lines.push('- [iOS Predicate String](https://webdriver.io/docs/selectors#ios-predicate-string)')
    lines.push('- [iOS Class Chain](https://webdriver.io/docs/selectors#ios-class-chain)')
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push(`*Generated by WebdriverIO Mobile Selector Performance Optimizer • ${new Date().toISOString().split('T')[0]}*`)
    lines.push('')

    return lines.join('\n')
}

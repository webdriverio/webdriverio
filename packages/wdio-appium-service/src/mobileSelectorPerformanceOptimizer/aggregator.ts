import fs from 'node:fs'
import path from 'node:path'
import { SevereServiceError } from 'webdriverio'
import type { Capabilities } from '@wdio/types'
import type { SelectorPerformanceData } from './types.js'
import type { ReportOptions, GroupedOptimization, FileGroup, RunTimingInfo } from './reporting-types.js'
import { getPerformanceData } from './mspo-store.js'
import { generateMarkdownReport } from './markdown-formatter.js'
import {
    formatSelectorForDisplay,
    REPORT_INDENT_SUMMARY,
    REPORT_INDENT_FILE,
    REPORT_INDENT_SUITE,
    REPORT_INDENT_SELECTOR
} from './utils/index.js'

/**
 * Inference maps for resolving unknown test context fields.
 * Built from data entries that have known values.
 */
interface InferenceMaps {
    /** Maps "suiteName::testName" to testFile */
    testFileInference: Map<string, string>
    /** Maps "testFile::testName" to suiteName */
    suiteNameInference: Map<string, string>
}

/**
 * Builds inference maps from performance data entries that have known context values.
 * These maps allow resolving unknown testFile or suiteName fields later.
 *
 * @param data - Array of selector performance data
 * @returns Inference maps for testFile and suiteName resolution
 */
function buildInferenceMaps(data: SelectorPerformanceData[]): InferenceMaps {
    const testFileInference = new Map<string, string>()
    const suiteNameInference = new Map<string, string>()

    for (const entry of data) {
        if (entry.testFile && entry.testFile !== 'unknown' &&
            entry.suiteName && entry.suiteName !== 'unknown' &&
            entry.testName) {
            // Map suiteName+testName -> testFile
            const key1 = `${entry.suiteName}::${entry.testName}`
            if (!testFileInference.has(key1)) {
                testFileInference.set(key1, entry.testFile)
            }
            // Map testFile+testName -> suiteName
            const key2 = `${entry.testFile}::${entry.testName}`
            if (!suiteNameInference.has(key2)) {
                suiteNameInference.set(key2, entry.suiteName)
            }
        }
    }

    return { testFileInference, suiteNameInference }
}

/**
 * Applies inference maps to resolve unknown testFile or suiteName fields.
 *
 * @param testFile - Original test file (may be 'unknown')
 * @param suiteName - Original suite name (may be 'unknown')
 * @param testName - Test name
 * @param inferenceMaps - Maps for resolving unknown fields
 * @returns Tuple of [resolvedTestFile, resolvedSuiteName]
 */
function applyInference(
    testFile: string,
    suiteName: string,
    testName: string,
    inferenceMaps: InferenceMaps
): [string, string] {
    let resolvedTestFile = testFile
    let resolvedSuiteName = suiteName

    // Infer testFile from suiteName + testName
    if (resolvedTestFile === 'unknown' && resolvedSuiteName !== 'unknown' && testName !== 'unknown') {
        const key = `${resolvedSuiteName}::${testName}`
        const inferred = inferenceMaps.testFileInference.get(key)
        if (inferred) {
            resolvedTestFile = inferred
        }
    }

    // Infer suiteName from testFile + testName
    if (resolvedSuiteName === 'unknown' && resolvedTestFile !== 'unknown' && testName !== 'unknown') {
        const key = `${resolvedTestFile}::${testName}`
        const inferred = inferenceMaps.suiteNameInference.get(key)
        if (inferred) {
            resolvedSuiteName = inferred
        }
    }

    return [resolvedTestFile, resolvedSuiteName]
}

/**
 * Groups performance data by device name.
 * Falls back to capabilities-based device name if data doesn't contain device info.
 *
 * @param data - Array of selector performance data
 * @param capabilities - Capabilities to fall back to for device name extraction
 * @returns Map of device name to performance data for that device
 */
function groupDataByDevice(
    data: SelectorPerformanceData[],
    capabilities: Capabilities.TestrunnerCapabilities | Capabilities.ResolvedTestrunnerCapabilities
): Map<string, SelectorPerformanceData[]> {
    const deviceMap = new Map<string, SelectorPerformanceData[]>()

    for (const entry of data) {
        const deviceName = entry.deviceName || 'unknown'
        if (!deviceMap.has(deviceName)) {
            deviceMap.set(deviceName, [])
        }
        deviceMap.get(deviceName)!.push(entry)
    }

    if (deviceMap.size === 1 && deviceMap.has('unknown')) {
        const fallbackDeviceName = getDeviceName(capabilities)
        if (fallbackDeviceName !== 'unknown') {
            const unknownData = deviceMap.get('unknown')!
            deviceMap.delete('unknown')
            deviceMap.set(fallbackDeviceName, unknownData)
        }
    }

    return deviceMap
}

/**
 * Aggregates selector performance data from all worker files and generates a report
 * @param capabilities - The capabilities for this runner instance
 * @param maxLineLength - Maximum line length for report output
 * @param writeFn - Optional function to write output (uses console.log if not provided)
 * @param reportDirectory - Report directory path (determined and validated in service constructor)
 * @param options - Report options for controlling output formats
 */
export async function aggregateSelectorPerformanceData(
    capabilities: Capabilities.TestrunnerCapabilities | Capabilities.ResolvedTestrunnerCapabilities,
    maxLineLength: number,
    writeFn?: (message: string) => void,
    reportDirectory?: string,
    options?: ReportOptions
): Promise<void> {
    const enableCliReport = options?.enableCliReport === true
    const enableMarkdownReport = options?.enableMarkdownReport === true
    const markdownLines: string[] = []
    const cliWrite = writeFn || ((message: string) => process.stdout.write(message))
    const write = (message: string) => {
        if (enableCliReport) {
            cliWrite(message)
        }
        if (enableMarkdownReport) {
            markdownLines.push(message)
        }
    }
    const writeError = writeFn || console.error

    if (!reportDirectory) {
        throw new SevereServiceError(
            'Mobile Selector Performance Optimizer: Report directory was not determined. ' +
            'This should have been validated during service initialization.'
        )
    }

    if (!fs.existsSync(reportDirectory)) {
        fs.mkdirSync(reportDirectory, { recursive: true })
    }

    const workersDataDir = path.join(reportDirectory, 'selector-performance-worker-data')
    const timestamp = Date.now()

    try {
        let allData: SelectorPerformanceData[] = []

        if (fs.existsSync(workersDataDir)) {
            const files = fs.readdirSync(workersDataDir)
            const workerDataFiles = files.filter(file => file.startsWith('worker-data-') && file.endsWith('.json'))

            if (workerDataFiles.length > 0) {
                workerDataFiles.forEach((file) => {
                    const filePath = path.join(workersDataDir, file)
                    try {
                        const content = fs.readFileSync(filePath, 'utf8')
                        const workerData = JSON.parse(content)
                        if (Array.isArray(workerData)) {
                            allData.push(...workerData)
                        }
                    } catch (err) {
                        writeError(`Failed to read worker data file ${file}:`, err)
                    }
                })

                try {
                    fs.rmSync(workersDataDir, { recursive: true, force: true })
                } catch {
                    // Ignore error
                }
            }
        }

        if (allData.length === 0) {
            allData = getPerformanceData()
        }

        if (allData.length === 0) {
            return
        }

        const dataByDevice = groupDataByDevice(allData, capabilities)

        for (const [deviceName, deviceData] of dataByDevice.entries()) {
            const sanitizedDeviceName = deviceName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase() || 'unknown'
            const finalJsonPath = path.join(reportDirectory, `mobile-selector-performance-optimizer-report-${sanitizedDeviceName}-${timestamp}.json`)

            const groupedData = groupDataBySpecFile(deviceData)
            fs.writeFileSync(finalJsonPath, JSON.stringify(groupedData, null, 2))

            const totalSelectors = deviceData.length
            const avgDuration = totalSelectors > 0 ? deviceData.reduce((sum: number, d: SelectorPerformanceData) => sum + d.duration, 0) / totalSelectors : 0
            const optimizedSelectors = deviceData.filter((d: SelectorPerformanceData) => d.optimizedSelector && d.improvementMs !== undefined)

            let timingInfo: RunTimingInfo | undefined
            if (deviceData.length > 0) {
                const timestamps = deviceData.map((d: SelectorPerformanceData) => d.timestamp).filter((t: number) => t > 0)
                if (timestamps.length > 0) {
                    const startTime = Math.min(...timestamps)
                    const endTime = Math.max(...timestamps)
                    const totalRunDurationMs = endTime - startTime
                    timingInfo = { startTime, endTime, totalRunDurationMs }
                }
            }

            if (totalSelectors === 0) {
                write('\n📊 Selector Performance Summary:\n')
                write(`${REPORT_INDENT_SUMMARY}No element-finding commands were tracked.\n`)
                write(`${REPORT_INDENT_SUMMARY}💡 JSON file written to: ${finalJsonPath}\n`)
            } else {
                if (optimizedSelectors.length > 0) {
                    generateGroupedSummaryReport(optimizedSelectors, deviceName, write, maxLineLength, timingInfo)
                } else {
                    write('\n📊 Selector Performance Summary:\n')
                    write(`${REPORT_INDENT_SUMMARY}Total element finds: ${totalSelectors}\n`)
                    write(`${REPORT_INDENT_SUMMARY}Average duration: ${avgDuration.toFixed(2)}ms\n`)
                }

                if (optimizedSelectors.length === 0) {
                    write(`\n${REPORT_INDENT_SUMMARY}✅ All selectors performed well\n`)
                    write(`${REPORT_INDENT_SUMMARY}💡 JSON file written to: ${finalJsonPath}\n`)
                }
            }

            if (enableMarkdownReport) {
                const markdownPath = path.join(reportDirectory, `mobile-selector-performance-optimizer-report-${sanitizedDeviceName}-${timestamp}.md`)
                const projectRoot = process.cwd()
                const markdownContent = generateMarkdownReport(optimizedSelectors, deviceName, timingInfo, projectRoot)
                fs.writeFileSync(markdownPath, markdownContent)

                // Log markdown report location
                const message = `
───────────────────────────────────────────────────────────────────────────────
📝 Mobile Selector Performance Optimizer - Markdown Report
───────────────────────────────────────────────────────────────────────────────
   📁 Markdown report written to: ${markdownPath}
───────────────────────────────────────────────────────────────────────────────
`
                console.log(message)
            }

            if (!enableCliReport && !enableMarkdownReport) {
                const message = `
───────────────────────────────────────────────────────────────────────────────
📊 Mobile Selector Performance Optimizer
───────────────────────────────────────────────────────────────────────────────
   📁 JSON report written to: ${finalJsonPath}

   💡 To get actionable optimization advice in your terminal or as a file,
      enable one of these options in your config:

      trackSelectorPerformance: {
          enabled: true,
          enableCliReport: true,      // Show report in terminal
          enableMarkdownReport: true  // Save report as markdown file
      }
───────────────────────────────────────────────────────────────────────────────
`
                console.log(message)
            }
        }
    } catch (err) {
        writeError('Failed to aggregate selector performance data:', err)
        if (err instanceof Error) {
            writeError('Error details:', err.message)
        }
    }
}

/**
 * Groups performance data by spec file → suite name → test → selectors for JSON output
 * Matches the structure of the terminal report
 */
function groupDataBySpecFile(allData: SelectorPerformanceData[]): Record<string, Record<string, Record<string, SelectorPerformanceData[]>>> {
    const inferenceMaps = buildInferenceMaps(allData)

    const processedData = allData.map(data => {
        const testName = data.testName || 'unknown'
        const [testFile, suiteName] = applyInference(
            data.testFile || 'unknown',
            data.suiteName || 'unknown',
            testName,
            inferenceMaps
        )
        return { ...data, testFile, suiteName }
    })

    const grouped: Record<string, Record<string, Record<string, SelectorPerformanceData[]>>> = {}

    for (const data of processedData) {
        const specFile = data.testFile || 'unknown'
        let suiteName = data.suiteName || 'unknown'
        const testName = data.testName || 'unknown'

        // If we have an "unknown" suite but there's a known suite for this test file + test name, use that
        if (suiteName === 'unknown' && specFile !== 'unknown' && testName !== 'unknown') {
            const key = `${specFile}::${testName}`
            const inferred = inferenceMaps.suiteNameInference.get(key)
            if (inferred) {
                suiteName = inferred
            }
        }

        if (!grouped[specFile]) {
            grouped[specFile] = {}
        }
        if (!grouped[specFile][suiteName]) {
            grouped[specFile][suiteName] = {}
        }
        if (!grouped[specFile][suiteName][testName]) {
            grouped[specFile][suiteName][testName] = []
        }

        const existing = grouped[specFile][suiteName][testName].find(d => d.selector === data.selector)

        if (!existing) {
            grouped[specFile][suiteName][testName].push(data)
        }
    }

    for (const specFile of Object.keys(grouped)) {
        const suites = grouped[specFile]
        const suiteNames = Object.keys(suites)

        for (const suiteName of suiteNames) {
            if (suiteName === 'unknown') {
                const unknownSuite = suites[suiteName]
                const testNames = Object.keys(unknownSuite)

                for (const testName of testNames) {
                    const key = `${specFile}::${testName}`
                    const knownSuiteName = inferenceMaps.suiteNameInference.get(key)

                    if (knownSuiteName && suites[knownSuiteName]) {
                        if (!suites[knownSuiteName][testName]) {
                            suites[knownSuiteName][testName] = []
                        }

                        for (const data of unknownSuite[testName]) {
                            const existing = suites[knownSuiteName][testName].find(d => d.selector === data.selector)
                            if (!existing) {
                                data.suiteName = knownSuiteName
                                suites[knownSuiteName][testName].push(data)
                            }
                        }

                        delete unknownSuite[testName]
                    }
                }

                if (Object.keys(unknownSuite).length === 0) {
                    delete suites[suiteName]
                }
            }
        }
    }

    for (const specFile of Object.keys(grouped)) {
        const suites = grouped[specFile]
        const sortedSuiteNames = Object.keys(suites).sort((suiteA, suiteB) => {
            const allTimestampsA: number[] = []
            const suiteATests = suites[suiteA]
            for (const testName of Object.keys(suiteATests)) {
                const testData = suiteATests[testName]
                allTimestampsA.push(...testData.map((d: SelectorPerformanceData) => d.timestamp))
            }
            const allTimestampsB: number[] = []
            const suiteBTests = suites[suiteB]
            for (const testName of Object.keys(suiteBTests)) {
                const testData = suiteBTests[testName]
                allTimestampsB.push(...testData.map((d: SelectorPerformanceData) => d.timestamp))
            }
            const firstA = allTimestampsA.length > 0 ? Math.min(...allTimestampsA) : 0
            const firstB = allTimestampsB.length > 0 ? Math.min(...allTimestampsB) : 0
            return firstA - firstB
        })

        const sortedSuites: Record<string, Record<string, SelectorPerformanceData[]>> = {}
        for (const suiteName of sortedSuiteNames) {
            const tests = suites[suiteName]
            const sortedTestNames = Object.keys(tests).sort((testA, testB) => {
                const firstA = tests[testA].length > 0 ? Math.min(...tests[testA].map((d: SelectorPerformanceData) => d.timestamp)) : 0
                const firstB = tests[testB].length > 0 ? Math.min(...tests[testB].map((d: SelectorPerformanceData) => d.timestamp)) : 0
                return firstA - firstB
            })

            const sortedTests: Record<string, SelectorPerformanceData[]> = {}
            for (const testName of sortedTestNames) {
                sortedTests[testName] = tests[testName]
            }
            sortedSuites[suiteName] = sortedTests
        }
        grouped[specFile] = sortedSuites
    }

    return grouped
}

/**
 * Extract device name from capabilities
 */
export function getDeviceName(capabilities: Capabilities.TestrunnerCapabilities | Capabilities.ResolvedTestrunnerCapabilities): string {
    if (!capabilities) {
        return 'unknown'
    }

    const extractDeviceName = (caps: WebdriverIO.Capabilities | Capabilities.W3CCapabilities): string | undefined => {
        if (!caps || typeof caps !== 'object') {
            return undefined
        }

        const capsRecord = caps as Record<string, unknown>
        const appiumDeviceName = capsRecord['appium:deviceName']

        if (appiumDeviceName && typeof appiumDeviceName === 'string') {
            return appiumDeviceName
        }

        const w3cCap = (caps as Capabilities.W3CCapabilities).alwaysMatch || caps

        if (w3cCap && typeof w3cCap === 'object') {
            const w3cRecord = w3cCap as Record<string, unknown>
            const w3cAppiumDeviceName = w3cRecord['appium:deviceName']
            if (w3cAppiumDeviceName && typeof w3cAppiumDeviceName === 'string') {
                return w3cAppiumDeviceName
            }
        }

        return undefined
    }

    if (!Array.isArray(capabilities) && typeof capabilities === 'object') {
        const entries = Object.entries(capabilities)
        if (entries.length > 0) {
            const [, firstCap] = entries[0]
            if (firstCap && typeof firstCap === 'object') {
                if ('capabilities' in firstCap) {
                    const nestedCaps = (firstCap as { capabilities: Capabilities.W3CCapabilities }).capabilities
                    const deviceName = extractDeviceName(nestedCaps)
                    if (deviceName) {
                        return deviceName
                    }
                }
                const deviceName = extractDeviceName(firstCap as WebdriverIO.Capabilities)
                if (deviceName) {
                    return deviceName
                }
            }
        }
    }

    if (Array.isArray(capabilities) && capabilities.length > 0) {
        const deviceName = extractDeviceName(capabilities[0])
        if (deviceName) {
            return deviceName
        }
    }

    const deviceName = extractDeviceName(capabilities as unknown as WebdriverIO.Capabilities)
    if (deviceName) {
        return deviceName
    }

    return 'unknown'
}

/**
 * Wraps a long line to fit within maxLineLength, breaking at word boundaries when possible
 */
function wrapLine(line: string, maxLineLength: number, indent: string = ''): string[] {
    if (line.length <= maxLineLength) {
        return [line]
    }

    const prefixMatch = line.match(/^(\s*)(\d+\.|•|→)\s+/)
    let continuationIndent = indent

    if (prefixMatch) {
        const leadingSpaces = prefixMatch[1]
        const prefixMarker = prefixMatch[2]
        continuationIndent = leadingSpaces + ' '.repeat(prefixMarker.length + 1)
    } else if (!indent) {
        const leadingWhitespaceMatch = line.match(/^(\s+)/)
        if (leadingWhitespaceMatch) {
            continuationIndent = leadingWhitespaceMatch[1]
        }
    }

    const lines: string[] = []
    let remaining = line
    let isFirstLine = true

    while (true) {
        const effectiveMaxLength = isFirstLine ? maxLineLength : maxLineLength - continuationIndent.length

        if (remaining.length <= effectiveMaxLength) {
            if (remaining.length > 0) {
                if (isFirstLine) {
                    lines.push(remaining)
                } else {
                    lines.push(continuationIndent + remaining)
                }
            }
            break
        }

        let breakPoint = effectiveMaxLength
        const searchStart = Math.max(0, effectiveMaxLength - 20)
        const spaceIndex = remaining.lastIndexOf(' ', effectiveMaxLength)
        const commaIndex = remaining.lastIndexOf(',', effectiveMaxLength)
        const arrowIndex = remaining.lastIndexOf('→', effectiveMaxLength)

        if (arrowIndex > searchStart) {
            breakPoint = arrowIndex + 1
        } else if (commaIndex > searchStart) {
            breakPoint = commaIndex + 1
        } else if (spaceIndex > searchStart) {
            breakPoint = spaceIndex + 1
        }

        if (isFirstLine) {
            const firstLinePart = remaining.substring(0, breakPoint)
            lines.push(firstLinePart)
        } else {
            lines.push(continuationIndent + remaining.substring(0, breakPoint).trim())
        }
        remaining = remaining.substring(breakPoint).trim()
        isFirstLine = false
    }

    return lines
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
 * Deduplicate selectors for CLI report, keeping the one with highest improvement
 */
function deduplicateSelectorsForCli(
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
            usageCount: usageCounts.get(entry.selector) || 1,
            duration: entry.duration,
            optimizedDuration: entry.optimizedDuration
        }

        if (!existing || Math.abs(current.improvementMs) > Math.abs(existing.improvementMs)) {
            if (existing && !current.selectorFile && existing.selectorFile) {
                current.selectorFile = existing.selectorFile
                current.lineNumber = existing.lineNumber
            }
            selectorMap.set(entry.selector, current)
        } else if (!existing.selectorFile && current.selectorFile) {
            existing.selectorFile = current.selectorFile
            existing.lineNumber = current.lineNumber
        }
    }

    return Array.from(selectorMap.values())
}

/**
 * Group optimizations by source file for CLI report
 */
function groupByFileForCli(optimizations: GroupedOptimization[]): {
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

function generateGroupedSummaryReport(
    optimizedSelectors: SelectorPerformanceData[],
    deviceName: string,
    write: (message: string) => void,
    maxLineLength: number,
    timingInfo?: RunTimingInfo
): void {
    // Count usage and deduplicate
    const usageCounts = countSelectorUsage(optimizedSelectors)
    const deduplicated = deduplicateSelectorsForCli(optimizedSelectors, usageCounts)

    // Separate positive and negative optimizations
    // Positive: optimized selector is faster (improvementMs > 0 means XPath took longer than native)
    // Negative: optimized selector is slower (improvementMs < 0 means native took longer than XPath)
    const positiveOptimizations = deduplicated.filter(o => o.improvementMs > 0)
    const negativeOptimizations = deduplicated.filter(o => o.improvementMs < 0)

    if (positiveOptimizations.length === 0 && negativeOptimizations.length === 0) {
        write('\n')
        write('═══════════════════════════════════════════════════════════════════════════════\n')
        write('📊 Mobile Selector Performance Optimizer\n')
        write('═══════════════════════════════════════════════════════════════════════════════\n')
        write(`${REPORT_INDENT_SUMMARY}No optimizations found.\n`)
        write('═══════════════════════════════════════════════════════════════════════════════\n')
        return
    }

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

    // Group by file
    const { fileGroups, workspaceWide } = groupByFileForCli(positiveOptimizations)

    // Header
    write('\n')
    write('═══════════════════════════════════════════════════════════════════════════════\n')
    write('📊 Mobile Selector Performance Optimizer Report\n')
    write('═══════════════════════════════════════════════════════════════════════════════\n')
    write('\n')

    // Summary stats
    if (deviceName && deviceName !== 'unknown') {
        write(`${REPORT_INDENT_SUMMARY}Device: ${deviceName}\n`)
    }

    // Timing information
    if (timingInfo) {
        const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const formatDuration = (ms: number) => {
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
        write(`${REPORT_INDENT_SUMMARY}Run Time: ${formatTime(timingInfo.startTime)} → ${formatTime(timingInfo.endTime)} (${formatDuration(timingInfo.totalRunDurationMs)})\n`)
    }

    const analyzedText = negativeOptimizations.length > 0
        ? `${deduplicated.length} unique selectors (${positiveOptimizations.length} optimizable, ${negativeOptimizations.length} not recommended)`
        : `${deduplicated.length} unique selectors (${positiveOptimizations.length} optimizable)`
    write(`${REPORT_INDENT_SUMMARY}Analyzed: ${analyzedText}\n`)

    // Format total savings
    const formatSavings = (ms: number) => {
        if (ms < 1000) {return `${ms.toFixed(0)}ms`}
        return `${(ms / 1000).toFixed(2)}s`
    }

    // Total savings with potential improvement percentage
    let savingsLine = `${REPORT_INDENT_SUMMARY}Total Potential Savings: ${formatSavings(totalSavingsMs)} per test run`
    if (timingInfo && timingInfo.totalRunDurationMs > 0) {
        const improvementPercent = (totalSavingsMs / timingInfo.totalRunDurationMs) * 100
        savingsLine += ` (${improvementPercent.toFixed(1)}% of total run time)`
    }
    write(`${savingsLine}\n`)
    write(`${REPORT_INDENT_SUMMARY}Average Improvement per Selector: ${avgImprovement.toFixed(1)}% faster\n`)
    write('\n')

    // Summary
    write('📈 Summary\n')
    write('───────────────────────────────────────────────────────────────────────────────\n')
    if (highImpact.length > 0) {
        write(`${REPORT_INDENT_SUMMARY}🔴 High (>50% gain):      ${String(highImpact.length).padStart(3)} → Fix immediately\n`)
    }
    if (mediumImpact.length > 0) {
        write(`${REPORT_INDENT_SUMMARY}🟠 Medium (20-50% gain):  ${String(mediumImpact.length).padStart(3)} → Recommended\n`)
    }
    if (lowImpact.length > 0) {
        write(`${REPORT_INDENT_SUMMARY}🟡 Low (10-20% gain):     ${String(lowImpact.length).padStart(3)} → Minor optimization\n`)
    }
    if (minorImpact.length > 0) {
        write(`${REPORT_INDENT_SUMMARY}⚪ Minor (<10% gain):     ${String(minorImpact.length).padStart(3)} → Optional\n`)
    }
    if (negativeOptimizations.length > 0) {
        write(`${REPORT_INDENT_SUMMARY}⚠️  Slower in Testing:    ${String(negativeOptimizations.length).padStart(3)} → See warnings below\n`)
    }
    write('\n')

    // File-Based Fixes
    if (fileGroups.length > 0) {
        write('🎯 File-Based Fixes\n')
        write('───────────────────────────────────────────────────────────────────────────────\n')
        write(`${REPORT_INDENT_SUMMARY}Update these specific lines for immediate impact:\n`)
        write('\n')

        for (const group of fileGroups) {
            write(`${REPORT_INDENT_FILE}📁 ${group.filePath}\n`)

            for (const opt of group.optimizations) {
                const formattedOriginal = formatSelectorForDisplay(opt.selector, 45)
                const formattedOptimized = formatSelectorForDisplay(opt.optimizedSelector, 45)
                const quoteStyle = opt.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
                const lineNum = opt.lineNumber ? `L${opt.lineNumber}` : '?'
                const perUse = `${opt.improvementMs.toFixed(1)}ms/use`
                const totalSaved = opt.improvementMs * opt.usageCount
                const totalDisplay = totalSaved >= 1000 ? `${(totalSaved / 1000).toFixed(2)}s` : `${totalSaved.toFixed(1)}ms`

                if (opt.usageCount > 1) {
                    const line = `${REPORT_INDENT_SELECTOR}${lineNum}: $('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle})`
                    const wrapped = wrapLine(line, maxLineLength, REPORT_INDENT_SELECTOR + '    ')
                    for (const wrappedLine of wrapped) {
                        write(`${wrappedLine}\n`)
                    }
                    write(`${REPORT_INDENT_SELECTOR}    ⚡ ${perUse} × ${opt.usageCount} uses = ${totalDisplay} total\n`)
                } else {
                    const line = `${REPORT_INDENT_SELECTOR}${lineNum}: $('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle}) [${opt.improvementMs.toFixed(1)}ms]`
                    const wrapped = wrapLine(line, maxLineLength, REPORT_INDENT_SELECTOR + '    ')
                    for (const wrappedLine of wrapped) {
                        write(`${wrappedLine}\n`)
                    }
                }
            }

            const fileTotalDisplay = group.totalSavingsWithUsage >= 1000
                ? `${(group.totalSavingsWithUsage / 1000).toFixed(2)}s`
                : `${group.totalSavingsWithUsage.toFixed(1)}ms`
            write(`${REPORT_INDENT_SUITE}└─ File total: ${fileTotalDisplay} saved (${group.optimizations.length} selector${group.optimizations.length > 1 ? 's' : ''})\n`)
            write('\n')
        }
    }

    // Workspace-Wide Optimizations
    if (workspaceWide.length > 0) {
        write('🔍 Workspace-Wide Optimizations\n')
        write('───────────────────────────────────────────────────────────────────────────────\n')
        write(`${REPORT_INDENT_SUMMARY}Source file unknown. Search your IDE (Cmd+Shift+F) for these selectors:\n`)
        write('\n')

        for (const opt of workspaceWide) {
            const formattedOriginal = formatSelectorForDisplay(opt.selector, 45)
            const formattedOptimized = formatSelectorForDisplay(opt.optimizedSelector, 45)
            const quoteStyle = opt.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
            const perUse = `${opt.improvementMs.toFixed(1)}ms/use`
            const totalSaved = opt.improvementMs * opt.usageCount
            const totalDisplay = totalSaved >= 1000 ? `${(totalSaved / 1000).toFixed(2)}s` : `${totalSaved.toFixed(1)}ms`

            const line = `${REPORT_INDENT_SELECTOR}$('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle})`
            const wrapped = wrapLine(line, maxLineLength, REPORT_INDENT_SELECTOR + '  ')
            for (const wrappedLine of wrapped) {
                write(`${wrappedLine}\n`)
            }
            if (opt.usageCount > 1) {
                write(`${REPORT_INDENT_SELECTOR}   ⚡ ${perUse} × ${opt.usageCount} uses = ${totalDisplay} total\n`)
            } else {
                write(`${REPORT_INDENT_SELECTOR}   ⚡ ${totalDisplay}\n`)
            }
        }
        write('\n')
    }

    // Performance Warnings
    if (negativeOptimizations.length > 0) {
        write('⚠️  Performance Warnings\n')
        write('───────────────────────────────────────────────────────────────────────────────\n')
        write(`${REPORT_INDENT_SUMMARY}Native selectors were SLOWER than XPath for these cases.\n`)
        write(`${REPORT_INDENT_SUMMARY}This can happen due to app-specific optimizations, element hierarchy,\n`)
        write(`${REPORT_INDENT_SUMMARY}caching effects, or Appium/driver version differences.\n`)
        write(`${REPORT_INDENT_SUMMARY}Recommendation: Keep using XPath for these selectors.\n`)
        write('\n')

        for (const opt of negativeOptimizations) {
            const xpathSelector = formatSelectorForDisplay(opt.selector, 40)
            const nativeSelector = formatSelectorForDisplay(opt.optimizedSelector, 40)
            const xpathTime = opt.duration ? `${opt.duration.toFixed(0)}ms` : '?'
            // improvementMs = xpathDuration - nativeDuration
            // If improvementMs < 0, nativeDuration > xpathDuration
            const nativeTime = opt.optimizedDuration
                ? `${opt.optimizedDuration.toFixed(0)}ms`
                : (opt.duration ? `${(opt.duration - opt.improvementMs).toFixed(0)}ms` : '?')
            const slowdownMs = Math.abs(opt.improvementMs).toFixed(0)
            const slowdownPercent = Math.abs(opt.improvementPercent).toFixed(0)

            // Show location if available
            const location = opt.selectorFile && opt.lineNumber
                ? `${opt.selectorFile}:${opt.lineNumber}`
                : (opt.selectorFile ? opt.selectorFile : null)
            if (location) {
                write(`${REPORT_INDENT_FILE}📍 ${location}\n`)
            }
            write(`${REPORT_INDENT_SELECTOR}XPath:  $('${xpathSelector}') → ${xpathTime}\n`)
            write(`${REPORT_INDENT_SELECTOR}Native: $('${nativeSelector}') → ${nativeTime}\n`)
            write(`${REPORT_INDENT_SELECTOR}        ❌ Native was ${slowdownMs}ms slower (${slowdownPercent}%)\n`)
            write('\n')
        }
    }

    // Why Change section (compact)
    write('💡 Why Change?\n')
    write('───────────────────────────────────────────────────────────────────────────────\n')
    write(`${REPORT_INDENT_SUMMARY}• Speed: Native selectors bypass expensive XML tree traversal\n`)
    write(`${REPORT_INDENT_SUMMARY}• Stability: Less affected by UI hierarchy changes\n`)
    write(`${REPORT_INDENT_SUMMARY}• Priority: ~accessibilityId > -ios predicate string > -ios class chain > //xpath\n`)
    write(`${REPORT_INDENT_SUMMARY}• Docs: https://webdriver.io/docs/selectors#mobile-selectors\n`)
    write('═══════════════════════════════════════════════════════════════════════════════\n')
}


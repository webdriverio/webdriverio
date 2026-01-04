import fs from 'node:fs'
import path from 'node:path'
import { SevereServiceError } from 'webdriverio'
import type { Capabilities } from '@wdio/types'
import type { SelectorPerformanceData } from './types.js'
import {
    formatSelectorForDisplay,
    REPORT_INDENT_SUMMARY,
    REPORT_INDENT_FILE,
    REPORT_INDENT_SUITE,
    REPORT_INDENT_TEST,
    REPORT_INDENT_SELECTOR,
    REPORT_INDENT_SHARED,
    REPORT_INDENT_SHARED_DETAIL,
    REPORT_INDENT_WHY_CHANGE,
    REPORT_INDENT_DOCS
} from './utils.js'

/**
 * Aggregates selector performance data from all worker files and generates a report
 * @param capabilities - The capabilities for this runner instance
 * @param maxLineLength - Maximum line length for report output
 * @param writeFn - Optional function to write output (uses console.log if not provided)
 * @param reportDirectory - Report directory path (determined and validated in service constructor)
 */
export async function aggregateSelectorPerformanceData(
    capabilities: Capabilities.TestrunnerCapabilities | Capabilities.ResolvedTestrunnerCapabilities,
    maxLineLength: number,
    writeFn?: (message: string) => void,
    reportDirectory?: string
): Promise<void> {
    const write = writeFn || ((message: string) => process.stdout.write(message))
    const writeWarn = writeFn || console.warn
    const writeError = writeFn || console.error
    const workersDataDir = path.join(process.cwd(), 'logs', 'selector-performance')

    if (!reportDirectory) {
        throw new SevereServiceError(
            'Mobile Selector Performance Optimizer: Report directory was not determined. ' +
            'This should have been validated during service initialization.'
        )
    }

    // Ensure report directory exists
    if (!fs.existsSync(reportDirectory)) {
        fs.mkdirSync(reportDirectory, { recursive: true })
    }

    // Generate unique filename with device name and timestamp
    const deviceName = getDeviceName(capabilities)
    const sanitizedDeviceName = deviceName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase() || 'unknown'
    const timestamp = Date.now()
    const finalJsonPath = path.join(reportDirectory, `mobile-selector-performance-optimizer-report-${sanitizedDeviceName}-${timestamp}.json`)

    try {
        if (!fs.existsSync(workersDataDir)) {
            return
        }

        // Read all worker data files (all workers have finished by the time onComplete runs)
        const files = fs.readdirSync(workersDataDir)
        const workerDataFiles = files.filter(file => file.startsWith('worker-data-') && file.endsWith('.json'))

        if (workerDataFiles.length === 0) {
            return
        }

        // Aggregate all worker data
        const allData: SelectorPerformanceData[] = []

        workerDataFiles.forEach((file) => {
            const filePath = path.join(workersDataDir, file)
            try {
                const content = fs.readFileSync(filePath, 'utf8')
                const workerData = JSON.parse(content)
                if (Array.isArray(workerData)) {
                    allData.push(...workerData)
                }
            } catch (err) {
                writeWarn(`Failed to read worker data file ${file}:`, err)
            }
        })

        // Group data by spec file for JSON output
        const groupedData = groupDataBySpecFile(allData)

        // Write aggregated data to final JSON file (grouped by spec file)
        fs.writeFileSync(finalJsonPath, JSON.stringify(groupedData, null, 2))

        // Generate summary
        const totalSelectors = allData.length

        if (totalSelectors === 0) {
            write('\n📊 Selector Performance Summary:\n')
            write(`${REPORT_INDENT_SUMMARY}No element-finding commands were tracked.\n`)
            write(`${REPORT_INDENT_SUMMARY}💡 JSON file written to: ${finalJsonPath}\n`)
        } else {
            const avgDuration = allData.reduce((sum, d) => sum + d.duration, 0) / totalSelectors || 0

            // Analyze optimized selectors
            const optimizedSelectors = allData.filter(d => d.optimizedSelector && d.improvementMs !== undefined)

            // Show optimization insights if we have optimized selectors
            if (optimizedSelectors.length > 0) {
                generateGroupedSummaryReport(optimizedSelectors, deviceName, write, maxLineLength)
            } else {
                // Only show basic summary if no optimizations found
                write('\n📊 Selector Performance Summary:\n')
                write(`${REPORT_INDENT_SUMMARY}Total element finds: ${totalSelectors}\n`)
                write(`${REPORT_INDENT_SUMMARY}Average duration: ${avgDuration.toFixed(2)}ms\n`)
            }

            if (optimizedSelectors.length === 0) {
                write(`\n${REPORT_INDENT_SUMMARY}✅ All selectors performed well\n`)
                write(`${REPORT_INDENT_SUMMARY}💡 JSON file written to: ${finalJsonPath}\n`)
            }
        }

        // Clean up worker data directory
        try {
            fs.rmSync(workersDataDir, { recursive: true, force: true })
        } catch (err) {
            writeWarn('Failed to clean up worker data directory:', err)
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
    // First pass: Build maps to help infer unknown values
    // Map 1: suiteName+testName -> testFile
    const testFileInference = new Map<string, string>()
    // Map 2: testFile+testName -> suiteName (for inferring suite names)
    const suiteNameInference = new Map<string, string>()
    for (const data of allData) {
        if (data.testFile && data.testFile !== 'unknown' && data.suiteName && data.suiteName !== 'unknown' && data.testName) {
            const key1 = `${data.suiteName}::${data.testName}`
            if (!testFileInference.has(key1)) {
                testFileInference.set(key1, data.testFile)
            }
            const key2 = `${data.testFile}::${data.testName}`
            if (!suiteNameInference.has(key2)) {
                suiteNameInference.set(key2, data.suiteName)
            }
        }
    }

    // Second pass: Infer and update unknown values
    const processedData = allData.map(data => {
        let testFile = data.testFile || 'unknown'
        let suiteName = data.suiteName || 'unknown'
        const testName = data.testName || 'unknown'

        // Infer test file if unknown
        if (testFile === 'unknown' && suiteName !== 'unknown' && testName !== 'unknown') {
            const key = `${suiteName}::${testName}`
            const inferred = testFileInference.get(key)
            if (inferred) {
                testFile = inferred
            }
        }

        // Infer suite name if unknown (but we have test file and test name)
        if (suiteName === 'unknown' && testFile !== 'unknown' && testName !== 'unknown') {
            const key = `${testFile}::${testName}`
            const inferred = suiteNameInference.get(key)
            if (inferred) {
                suiteName = inferred
            }
        }

        return { ...data, testFile, suiteName }
    })

    // Group by spec file → suite name → test → selectors
    const grouped: Record<string, Record<string, Record<string, SelectorPerformanceData[]>>> = {}
    for (const data of processedData) {
        const specFile = data.testFile || 'unknown'
        let suiteName = data.suiteName || 'unknown'
        const testName = data.testName || 'unknown'

        // If we have an "unknown" suite but there's a known suite for this test file + test name, use that
        if (suiteName === 'unknown' && specFile !== 'unknown' && testName !== 'unknown') {
            const key = `${specFile}::${testName}`
            const inferred = suiteNameInference.get(key)
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

        // Deduplicate selectors within the same test
        const existing = grouped[specFile][suiteName][testName].find(d => d.selector === data.selector)
        if (!existing) {
            grouped[specFile][suiteName][testName].push(data)
        }
    }

    // Post-processing: Merge "unknown" suite entries into known suite entries for the same test
    for (const specFile of Object.keys(grouped)) {
        const suites = grouped[specFile]
        const suiteNames = Object.keys(suites)

        // Find "unknown" suites that should be merged
        for (const suiteName of suiteNames) {
            if (suiteName === 'unknown') {
                const unknownSuite = suites[suiteName]
                const testNames = Object.keys(unknownSuite)

                for (const testName of testNames) {
                    const key = `${specFile}::${testName}`
                    const knownSuiteName = suiteNameInference.get(key)

                    if (knownSuiteName && suites[knownSuiteName]) {
                        // Merge into known suite
                        if (!suites[knownSuiteName][testName]) {
                            suites[knownSuiteName][testName] = []
                        }

                        // Move selectors from unknown suite to known suite (deduplicate)
                        for (const data of unknownSuite[testName]) {
                            const existing = suites[knownSuiteName][testName].find(d => d.selector === data.selector)
                            if (!existing) {
                                data.suiteName = knownSuiteName
                                suites[knownSuiteName][testName].push(data)
                            }
                        }

                        // Remove the test from unknown suite
                        delete unknownSuite[testName]
                    }
                }

                // Remove unknown suite if empty
                if (Object.keys(unknownSuite).length === 0) {
                    delete suites[suiteName]
                }
            }
        }
    }

    // Sort suites and tests within each file by execution order (timestamp)
    for (const specFile of Object.keys(grouped)) {
        const suites = grouped[specFile]
        const sortedSuiteNames = Object.keys(suites).sort((suiteA, suiteB) => {
            // Get the earliest timestamp from each suite's tests
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
                // Get the earliest timestamp from each test's selectors
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

    // Helper to extract deviceName from a capabilities object
    const extractDeviceName = (caps: WebdriverIO.Capabilities | Capabilities.W3CCapabilities): string | undefined => {
        if (!caps || typeof caps !== 'object') {
            return undefined
        }

        const capsRecord = caps as Record<string, unknown>

        // Try appium:deviceName first (W3C format)
        const appiumDeviceName = capsRecord['appium:deviceName']
        if (appiumDeviceName && typeof appiumDeviceName === 'string') {
            return appiumDeviceName
        }

        // Try deviceName directly (legacy format or resolved capabilities)
        const deviceName = capsRecord['deviceName']
        if (deviceName && typeof deviceName === 'string') {
            return deviceName
        }

        // Try W3C format with alwaysMatch
        const w3cCap = (caps as Capabilities.W3CCapabilities).alwaysMatch || caps
        if (w3cCap && typeof w3cCap === 'object') {
            const w3cRecord = w3cCap as Record<string, unknown>
            const w3cAppiumDeviceName = w3cRecord['appium:deviceName']
            if (w3cAppiumDeviceName && typeof w3cAppiumDeviceName === 'string') {
                return w3cAppiumDeviceName
            }
            const w3cDeviceName = w3cRecord['deviceName']
            if (w3cDeviceName && typeof w3cDeviceName === 'string') {
                return w3cDeviceName
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

    // Detect prefix pattern (e.g., "   1. ", "            • ", "   → ")
    // to calculate proper continuation indent that aligns with content after the marker
    const prefixMatch = line.match(/^(\s*)(\d+\.|•|→)\s+/)
    let continuationIndent = indent

    if (prefixMatch) {
        // Found a numbered/bulleted prefix - calculate continuation indent
        // to align with content after the marker (e.g., after "1. " or "• ")
        const leadingSpaces = prefixMatch[1]
        const prefixMarker = prefixMatch[2]
        // Continuation should align with content, so: leading spaces + marker + space
        // This makes continuation align with where content starts after the marker
        continuationIndent = leadingSpaces + ' '.repeat(prefixMarker.length + 1)
    } else if (!indent) {
        // Try to detect leading whitespace and preserve it
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
        const searchStart = Math.max(0, effectiveMaxLength - 20) // Look back up to 20 chars
        const spaceIndex = remaining.lastIndexOf(' ', effectiveMaxLength)
        const commaIndex = remaining.lastIndexOf(',', effectiveMaxLength)
        const arrowIndex = remaining.lastIndexOf('→', effectiveMaxLength)

        // Prefer breaking at arrow, then comma, then space
        if (arrowIndex > searchStart) {
            breakPoint = arrowIndex + 1
        } else if (commaIndex > searchStart) {
            breakPoint = commaIndex + 1
        } else if (spaceIndex > searchStart) {
            breakPoint = spaceIndex + 1
        }

        // For first line, preserve the original line up to breakPoint (don't trim prefix)
        // For continuation lines, use the calculated continuation indent
        if (isFirstLine) {
            // Ensure we preserve the full prefix on the first line
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

function generateGroupedSummaryReport(
    optimizedSelectors: SelectorPerformanceData[],
    deviceName: string,
    write: (message: string) => void,
    maxLineLength: number
): void {
    // 1. Separate positive and negative improvements
    const positiveOptimizations = optimizedSelectors.filter(
        d => d.improvementMs !== undefined && d.improvementMs > 0 && (d.improvementPercent || 0) > 0
    )
    const negativeOptimizations = optimizedSelectors.filter(
        d => d.improvementMs !== undefined && (d.improvementMs <= 0 || (d.improvementPercent || 0) <= 0)
    )

    if (positiveOptimizations.length === 0 && negativeOptimizations.length === 0) {
        write('📊 Mobile Selector Performance: Summary Report\n')
        write(`${REPORT_INDENT_SUMMARY}No optimizations found.\n`)
        return
    }

    // Calculate overall stats (only for positive optimizations)
    const totalTimeSaved = positiveOptimizations.reduce((sum, d) => sum + (d.improvementMs || 0), 0)
    const avgImprovement = positiveOptimizations.reduce((sum, d) => sum + (d.improvementPercent || 0), 0) / positiveOptimizations.length
    const totalTimeSavedSeconds = (totalTimeSaved / 1000).toFixed(2)
    const totalSelectorsAnalyzed = optimizedSelectors.length

    // Group by test file -> suite name -> test name -> selector
    interface GroupedOptimization {
        testFile: string
        suiteName: string
        testName: string
        originalSelector: string
        optimizedSelector: string
        improvementPercent: number
        improvementMs: number
        timestamp: number
        isNegative?: boolean
    }

    // First pass: Build maps to help infer unknown values
    // Map 1: suiteName+testName -> testFile
    const testFileInference = new Map<string, string>()
    // Map 2: testFile+testName -> suiteName (for inferring suite names)
    const suiteNameInference = new Map<string, string>()
    for (const data of optimizedSelectors) {
        if (data.testFile && data.testFile !== 'unknown' && data.suiteName && data.suiteName !== 'unknown' && data.testName) {
            const key1 = `${data.suiteName}::${data.testName}`
            if (!testFileInference.has(key1)) {
                testFileInference.set(key1, data.testFile)
            }
            const key2 = `${data.testFile}::${data.testName}`
            if (!suiteNameInference.has(key2)) {
                suiteNameInference.set(key2, data.suiteName)
            }
        }
    }

    // Process both positive and negative optimizations
    const allProcessedSelectors = [...positiveOptimizations, ...negativeOptimizations]

    // Second pass: Infer and update unknown values
    const processedSelectors = allProcessedSelectors.map(data => {
        let testFile = data.testFile || 'unknown'
        let suiteName = data.suiteName || 'unknown'
        const testName = data.testName || 'unknown'
        const isNegative = (data.improvementMs || 0) <= 0 || (data.improvementPercent || 0) <= 0

        // Infer test file if unknown
        if (testFile === 'unknown' && suiteName !== 'unknown' && testName !== 'unknown') {
            const key = `${suiteName}::${testName}`
            const inferred = testFileInference.get(key)
            if (inferred) {
                testFile = inferred
            }
        }

        // Infer suite name if unknown (but we have test file and test name)
        if (suiteName === 'unknown' && testFile !== 'unknown' && testName !== 'unknown') {
            const key = `${testFile}::${testName}`
            const inferred = suiteNameInference.get(key)
            if (inferred) {
                suiteName = inferred
            }
        }

        return { ...data, testFile, suiteName, isNegative }
    })

    const groupedByFile = new Map<string, Map<string, Map<string, GroupedOptimization[]>>>()
    const selectorUsageCount = new Map<string, { count: number; testFiles: Set<string> }>()

    for (const data of processedSelectors) {
        if (!data.optimizedSelector || data.improvementMs === undefined) {
            continue
        }

        const isNegative = (data as SelectorPerformanceData & { isNegative?: boolean }).isNegative || false
        const testFile = data.testFile || 'unknown'
        const suiteName = data.suiteName || 'unknown'
        const testName = data.testName || 'unknown'
        const selectorKey = data.selector

        // Track selector usage across tests
        if (!selectorUsageCount.has(selectorKey)) {
            selectorUsageCount.set(selectorKey, { count: 0, testFiles: new Set() })
        }
        const usage = selectorUsageCount.get(selectorKey)!
        usage.count++
        usage.testFiles.add(testFile)

        // Group by file -> suite -> test
        if (!groupedByFile.has(testFile)) {
            groupedByFile.set(testFile, new Map())
        }
        const fileGroup = groupedByFile.get(testFile)!

        if (!fileGroup.has(suiteName)) {
            fileGroup.set(suiteName, new Map())
        }
        const suiteGroup = fileGroup.get(suiteName)!

        if (!suiteGroup.has(testName)) {
            suiteGroup.set(testName, [])
        }
        const testGroup = suiteGroup.get(testName)!

        // Check if this selector is already in this test (deduplicate)
        // Look for existing entry with same selector in this test
        const existing = testGroup.find(o => o.originalSelector === data.selector)
        if (!existing) {
            testGroup.push({
                testFile,
                suiteName,
                testName,
                originalSelector: data.selector,
                optimizedSelector: data.optimizedSelector,
                improvementPercent: data.improvementPercent || 0,
                improvementMs: data.improvementMs,
                timestamp: data.timestamp,
                isNegative: isNegative
            })
        } else {
            // Update existing entry if we have a better suite name or more recent data
            if (suiteName !== 'unknown' && existing.suiteName === 'unknown') {
                existing.suiteName = suiteName
            }
            // Prefer more recent data
            if (data.timestamp > existing.timestamp) {
                existing.timestamp = data.timestamp
                existing.improvementPercent = data.improvementPercent || 0
                existing.improvementMs = data.improvementMs
                if (suiteName !== 'unknown') {
                    existing.suiteName = suiteName
                }
            }
        }
    }

    // Sort files: known files first, then unknown
    // Sort tests within each file by execution order (timestamp)
    const sortedFiles = Array.from(groupedByFile.entries()).sort(([fileA], [fileB]) => {
        if (fileA === 'unknown' && fileB !== 'unknown') {
            return 1
        }
        if (fileA !== 'unknown' && fileB === 'unknown') {
            return -1
        }
        return fileA.localeCompare(fileB)
    })

    // Sort suites and tests within each file by execution order
    for (const [testFile, suiteMap] of sortedFiles) {
        // Sort suites by earliest timestamp from any test in the suite
        const sortedSuites = Array.from(suiteMap.entries()).sort(([_suiteA, testMapA], [_suiteB, testMapB]) => {
            const allTimestampsA = Array.from(testMapA.values()).flatMap((opts: GroupedOptimization[]) => opts.map((o: GroupedOptimization) => o.timestamp))
            const allTimestampsB = Array.from(testMapB.values()).flatMap((opts: GroupedOptimization[]) => opts.map((o: GroupedOptimization) => o.timestamp))
            const firstA = allTimestampsA.length > 0 ? Math.min(...allTimestampsA) : 0
            const firstB = allTimestampsB.length > 0 ? Math.min(...allTimestampsB) : 0
            return firstA - firstB
        })

        // Sort tests within each suite by execution order
        const sortedSuiteMap = new Map<string, Map<string, GroupedOptimization[]>>()
        for (const [suiteName, testMap] of sortedSuites) {
            const sortedTests = Array.from(testMap.entries()).sort(([_nameA, optsA], [_nameB, optsB]) => {
                // Get the earliest timestamp from each test's selectors
                const firstA = optsA.length > 0 ? Math.min(...optsA.map((o: GroupedOptimization) => o.timestamp)) : 0
                const firstB = optsB.length > 0 ? Math.min(...optsB.map((o: GroupedOptimization) => o.timestamp)) : 0
                return firstA - firstB
            })
            sortedSuiteMap.set(suiteName, new Map(sortedTests))
        }
        groupedByFile.set(testFile, sortedSuiteMap)
    }

    // Post-processing: Merge "unknown" suite entries into known suite entries for the same test
    for (const [testFile, suiteMap] of groupedByFile.entries()) {
        const suiteNames = Array.from(suiteMap.keys())

        // Find "unknown" suites that should be merged
        for (const suiteName of suiteNames) {
            if (suiteName === 'unknown') {
                const unknownSuite = suiteMap.get(suiteName)!
                const testNames = Array.from(unknownSuite.keys())

                for (const testName of testNames) {
                    const key = `${testFile}::${testName}`
                    const knownSuiteName = suiteNameInference.get(key)

                    if (knownSuiteName && suiteMap.has(knownSuiteName)) {
                        // Merge into known suite
                        const knownSuite = suiteMap.get(knownSuiteName)!
                        if (!knownSuite.has(testName)) {
                            knownSuite.set(testName, [])
                        }

                        // Move selectors from unknown suite to known suite (deduplicate)
                        const unknownTestGroup = unknownSuite.get(testName)!
                        const knownTestGroup = knownSuite.get(testName)!
                        for (const opt of unknownTestGroup) {
                            const existing = knownTestGroup.find(o => o.originalSelector === opt.originalSelector)
                            if (!existing) {
                                opt.suiteName = knownSuiteName
                                knownTestGroup.push(opt)
                            }
                        }

                        // Remove the test from unknown suite
                        unknownSuite.delete(testName)
                    }
                }

                // Remove unknown suite if empty
                if (unknownSuite.size === 0) {
                    suiteMap.delete(suiteName)
                }
            }
        }
    }

    // Group optimizations by improvement ranges (6. Group by improvement ranges)
    const highImpact: GroupedOptimization[] = [] // >50%
    const mediumImpact: GroupedOptimization[] = [] // 20-50%
    const lowImpact: GroupedOptimization[] = [] // 10-20%
    const minorImpact: GroupedOptimization[] = [] // <10%
    const allOptimizations: GroupedOptimization[] = []

    for (const [, suiteMap] of sortedFiles) {
        for (const [, testMap] of suiteMap.entries()) {
            for (const [, optimizations] of testMap.entries()) {
                allOptimizations.push(...optimizations)
            }
        }
    }

    for (const opt of allOptimizations) {
        if (opt.improvementPercent >= 50) {
            highImpact.push(opt)
        } else if (opt.improvementPercent >= 20) {
            mediumImpact.push(opt)
        } else if (opt.improvementPercent >= 10) {
            lowImpact.push(opt)
        } else {
            minorImpact.push(opt)
        }
    }

    // 3. Top 10 optimizations summary (sorted by time saved, deduplicated by original selector)
    // Group by original selector and keep only the best one (highest improvementMs)
    const topOptimizationsMap = new Map<string, GroupedOptimization>()
    for (const opt of allOptimizations) {
        const existing = topOptimizationsMap.get(opt.originalSelector)
        if (!existing || (opt.improvementMs || 0) > (existing.improvementMs || 0)) {
            topOptimizationsMap.set(opt.originalSelector, opt)
        }
    }
    const topOptimizations = Array.from(topOptimizationsMap.values())
        .sort((a, b) => (b.improvementMs || 0) - (a.improvementMs || 0))
        .slice(0, 10)

    // 7. Quick Wins: Shared selectors with high improvements
    const quickWins = Array.from(selectorUsageCount.entries())
        .filter(([_, usage]) => usage.count > 1)
        .map(([selector, usage]) => {
            const example = allOptimizations.find(o => o.originalSelector === selector)
            return example ? { selector, usage, optimization: example } : null
        })
        .filter((item): item is { selector: string; usage: { count: number; testFiles: Set<string> }; optimization: GroupedOptimization } => item !== null)
        .filter(item => item.optimization.improvementPercent >= 20 && item.optimization.optimizedSelector.startsWith('~'))
        .sort((a, b) => (b.optimization.improvementMs || 0) - (a.optimization.improvementMs || 0))
        .slice(0, 10)

    write('\n "Mobile Selector Performance Optimizer" Reporter:\n')
    write('\n')
    write('═══════════════════════════════════════════════════════════════════════════════\n')
    write('📊 Mobile Selector Performance: Summary Report\n')
    write('═══════════════════════════════════════════════════════════════════════════════\n')
    if (deviceName && deviceName !== 'unknown') {
        write(`${REPORT_INDENT_SUMMARY}Device: ${deviceName}\n`)
    }
    write(`${REPORT_INDENT_SUMMARY}Total selectors analyzed: ${totalSelectorsAnalyzed}\n`)
    write(`${REPORT_INDENT_SUMMARY}Positive optimizations found: ${positiveOptimizations.length}\n`)
    write(`${REPORT_INDENT_SUMMARY}Average improvement: ${avgImprovement.toFixed(1)}% faster\n`)
    write(`${REPORT_INDENT_SUMMARY}Total time saved: ${totalTimeSaved.toFixed(2)}ms (${totalTimeSavedSeconds}s) per test run\n`)
    const impactBreakdownLine = `${REPORT_INDENT_SUMMARY}Impact breakdown: ${highImpact.length} high (>50%), ${mediumImpact.length} medium (20-50%), ${lowImpact.length} low (10-20%), ${minorImpact.length} minor (<10%)`
    const wrappedImpactBreakdown = wrapLine(impactBreakdownLine, maxLineLength, '')
    for (const wrappedLine of wrappedImpactBreakdown) {
        write(`${wrappedLine}\n`)
    }
    write('\n')

    // 3. Top 10 Optimizations Summary
    if (topOptimizations.length > 0) {
        write('🏆 Top 10 Most Impactful Optimizations\n')
        write('───────────────────────────────────────────────────────────────────────────\n')
        for (let i = 0; i < topOptimizations.length; i++) {
            const opt = topOptimizations[i]
            const formattedOriginal = formatSelectorForDisplay(opt.originalSelector)
            const formattedOptimized = formatSelectorForDisplay(opt.optimizedSelector)
            const quoteStyle = opt.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
            const isShared = selectorUsageCount.get(opt.originalSelector)!.count > 1
            const sharedMarker = isShared ? ' ⚠️ (shared)' : ''
            const line = `${REPORT_INDENT_SUMMARY}${i + 1}. $('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle}) (${opt.improvementPercent.toFixed(1)}% faster, ${opt.improvementMs.toFixed(2)}ms saved)${sharedMarker}`
            const wrapped = wrapLine(line, maxLineLength, REPORT_INDENT_SUMMARY)
            for (const wrappedLine of wrapped) {
                write(`${wrappedLine}\n`)
            }
        }
        write('\n')
    }

    // 7. Quick Wins Section
    if (quickWins.length > 0) {
        write('⚡ Quick Wins (Shared Selectors with High Impact)\n')
        write('───────────────────────────────────────────────────────────────────────────\n')
        write(`${REPORT_INDENT_SUMMARY}These selectors appear in multiple tests and have high improvement. Fix once, benefit everywhere!\n`)
        for (const { selector, usage, optimization } of quickWins) {
            const formattedOriginal = formatSelectorForDisplay(selector)
            const formattedOptimized = formatSelectorForDisplay(optimization.optimizedSelector)
            const quoteStyle = optimization.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'
            const line1 = `${REPORT_INDENT_SUMMARY}• $('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle}) (${optimization.improvementPercent.toFixed(1)}% faster, appears in ${usage.count} test(s))`
            const wrapped1 = wrapLine(line1, maxLineLength, REPORT_INDENT_SUMMARY + '  ')
            for (const wrappedLine of wrapped1) {
                write(`${wrappedLine}\n`)
            }
            write(`${REPORT_INDENT_SUMMARY}  → Search in: page-objects/**/*.ts or helpers/**/*.ts\n`)
        }
        write('\n')
    }

    write('📋 All Actions Required - Grouped by Test\n')
    write('───────────────────────────────────────────────────────────────────────────\n')

    // Print grouped optimizations
    for (const [testFile, suiteMap] of sortedFiles) {
        const displayFile = testFile === 'unknown' ? 'Unknown Test File (likely in hooks or shared code)' : testFile
        write(`${REPORT_INDENT_FILE}📁 ${displayFile}\n`)

        for (const [suiteName, testMap] of suiteMap.entries()) {
            const displaySuiteName = suiteName === 'unknown' ? 'Unknown Suite' : suiteName
            write(`${REPORT_INDENT_SUITE}📦 Suite: "${displaySuiteName}"\n`)

            for (const [testName, optimizations] of testMap.entries()) {
                const displayTestName = testName === 'unknown' ? 'Unknown Test (likely in hooks)' : testName
                write(`${REPORT_INDENT_TEST}🧪 Test: "${displayTestName}"\n`)

                // 4. Filter by improvement threshold - group minor improvements separately
                const significantOptimizations = optimizations.filter(opt => opt.improvementPercent >= 10)
                const minorOptimizations = optimizations.filter(opt => opt.improvementPercent < 10)

                for (const opt of significantOptimizations) {
                    const isShared = selectorUsageCount.get(opt.originalSelector)!.count > 1
                    const sharedMarker = isShared ? ' ⚠️ (also in other test(s))' : ''
                    const formattedOriginal = formatSelectorForDisplay(opt.originalSelector)
                    const formattedOptimized = formatSelectorForDisplay(opt.optimizedSelector)
                    const quoteStyle = opt.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'

                    if (opt.isNegative) {
                        // Show negative improvements with warning
                        const slowdownPercent = Math.abs(opt.improvementPercent)
                        const line = `${REPORT_INDENT_SELECTOR}⚠️  Replace: $('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle}) (${slowdownPercent.toFixed(1)}% slower)${sharedMarker}`
                        const wrapped = wrapLine(line, maxLineLength, REPORT_INDENT_SELECTOR)
                        for (const wrappedLine of wrapped) {
                            write(`${wrappedLine}\n`)
                        }
                        const noteLine = `${REPORT_INDENT_SELECTOR}   Note: While slower, this selector is more maintainable and less brittle than XPath`
                        const wrappedNote = wrapLine(noteLine, maxLineLength, REPORT_INDENT_SELECTOR)
                        for (const wrappedLine of wrappedNote) {
                            write(`${wrappedLine}\n`)
                        }
                    } else {
                        const line = `${REPORT_INDENT_SELECTOR}• Replace: $('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle}) (${opt.improvementPercent.toFixed(1)}% faster)${sharedMarker}`
                        const wrapped = wrapLine(line, maxLineLength, REPORT_INDENT_SELECTOR)
                        for (const wrappedLine of wrapped) {
                            write(`${wrappedLine}\n`)
                        }
                    }
                }

                // Show minor optimizations collapsed
                if (minorOptimizations.length > 0) {
                    write(`${REPORT_INDENT_SELECTOR}• ${minorOptimizations.length} minor optimization(s) (<10% improvement) - see detailed report\n`)
                }
            }
        }
    }

    // 2. Print shared selectors section (aggregated across all spec files)
    const sharedSelectors = Array.from(selectorUsageCount.entries())
        .filter(([_, usage]) => usage.count > 1)

    if (sharedSelectors.length > 0) {
        write('\n')
        write('⚠️  [Shared Selectors Detected]\n')
        write('───────────────────────────────────────────────────────────────────────────\n')
        write(`${REPORT_INDENT_SHARED}The following selectors appear in multiple tests and are likely in Page Objects:\n`)

        for (const [selector, usage] of sharedSelectors) {
            const example = allOptimizations.find(o => o.originalSelector === selector)
            if (!example) {
                continue
            }

            const formattedOriginal = formatSelectorForDisplay(selector)
            const formattedOptimized = formatSelectorForDisplay(example.optimizedSelector)
            const quoteStyle = example.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'

            const line1 = `${REPORT_INDENT_SHARED}• $('${formattedOriginal}') - appears in ${usage.count} test(s) across ${usage.testFiles.size} file(s)`
            const wrapped1 = wrapLine(line1, maxLineLength, REPORT_INDENT_SHARED + '  ')
            for (const wrappedLine of wrapped1) {
                write(`${wrappedLine}\n`)
            }
            write(`${REPORT_INDENT_SHARED_DETAIL}→ Search in: page-objects/**/*.ts or helpers/**/*.ts\n`)
            const line2 = `${REPORT_INDENT_SHARED_DETAIL}→ Replace with: $(${quoteStyle}${formattedOptimized}${quoteStyle})`
            const wrapped2 = wrapLine(line2, maxLineLength, REPORT_INDENT_SHARED_DETAIL + '  ')
            for (const wrappedLine of wrapped2) {
                write(`${wrappedLine}\n`)
            }
        }
    }

    // Analyze which selector types were used
    const selectorTypes = new Set<string>()
    for (const data of positiveOptimizations) {
        if (data.optimizedSelector) {
            if (data.optimizedSelector.startsWith('-ios predicate string:')) {
                selectorTypes.add('predicate string')
            } else if (data.optimizedSelector.startsWith('-ios class chain:')) {
                selectorTypes.add('class chain')
            } else if (data.optimizedSelector.startsWith('~') || !data.optimizedSelector.includes(':')) {
                selectorTypes.add('accessibility id')
            }
        }
    }

    // Build benefits message based on selector types used
    const benefits: string[] = []
    if (selectorTypes.has('accessibility id')) {
        benefits.push('uses native iOS accessibility ID')
    }
    if (selectorTypes.has('predicate string')) {
        benefits.push('uses iOS predicate strings')
    }
    if (selectorTypes.has('class chain')) {
        benefits.push('uses iOS class chains')
    }

    const benefitsText = benefits.length > 0
        ? `More stable: ${benefits.join(', ')}`
        : 'More stable: uses native iOS selectors'

    // Build documentation links
    const docLinks: string[] = []
    if (selectorTypes.has('accessibility id')) {
        docLinks.push('Accessibility ID: https://webdriver.io/docs/selectors#accessibility-id')
    }
    if (selectorTypes.has('predicate string')) {
        docLinks.push('Predicate String: https://webdriver.io/docs/selectors#ios-predicate-string')
    }
    if (selectorTypes.has('class chain')) {
        docLinks.push('Class Chain: https://webdriver.io/docs/selectors#ios-class-chain')
    }

    // Print "Why Change?" section with improved formatting
    write('\n')
    write('💡 [Why Change?]\n')
    write('───────────────────────────────────────────────────────────────────────────\n')
    write(`${REPORT_INDENT_WHY_CHANGE}• Average ${avgImprovement.toFixed(1)}% performance improvement (total of ${totalTimeSavedSeconds} seconds faster per run of this suite)\n`)
    write(`${REPORT_INDENT_WHY_CHANGE}• ${benefitsText}\n`)
    if (docLinks.length > 0) {
        write(`${REPORT_INDENT_WHY_CHANGE}• Documentation:\n`)
        for (const link of docLinks) {
            write(`${REPORT_INDENT_DOCS}- ${link}\n`)
        }
    }
    write('═══════════════════════════════════════════════════════════════════════════════\n')
}


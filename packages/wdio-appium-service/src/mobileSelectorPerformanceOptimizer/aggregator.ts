import fs from 'node:fs'
import path from 'node:path'
import { SevereServiceError } from 'webdriverio'
import type { Capabilities } from '@wdio/types'
import type { SelectorPerformanceData } from './types.js'
import { getPerformanceData } from './mspo-store.js'
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
    const writeError = writeFn || console.error

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

    const workersDataDir = path.join(reportDirectory, 'selector-performance-worker-data')
    const deviceName = getDeviceName(capabilities)
    const sanitizedDeviceName = deviceName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase() || 'unknown'
    const timestamp = Date.now()
    const finalJsonPath = path.join(reportDirectory, `mobile-selector-performance-optimizer-report-${sanitizedDeviceName}-${timestamp}.json`)

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

        const groupedData = groupDataBySpecFile(allData)

        fs.writeFileSync(finalJsonPath, JSON.stringify(groupedData, null, 2))

        const totalSelectors = allData.length

        if (totalSelectors === 0) {
            write('\n📊 Selector Performance Summary:\n')
            write(`${REPORT_INDENT_SUMMARY}No element-finding commands were tracked.\n`)
            write(`${REPORT_INDENT_SUMMARY}💡 JSON file written to: ${finalJsonPath}\n`)
        } else {
            const avgDuration = allData.reduce((sum, d) => sum + d.duration, 0) / totalSelectors || 0
            const optimizedSelectors = allData.filter(d => d.optimizedSelector && d.improvementMs !== undefined)

            if (optimizedSelectors.length > 0) {
                generateGroupedSummaryReport(optimizedSelectors, deviceName, write, maxLineLength)
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

        const deviceName = capsRecord['deviceName']

        if (deviceName && typeof deviceName === 'string') {
            return deviceName
        }

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

function generateGroupedSummaryReport(
    optimizedSelectors: SelectorPerformanceData[],
    deviceName: string,
    write: (message: string) => void,
    maxLineLength: number
): void {
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

    const totalTimeSaved = positiveOptimizations.reduce((sum, d) => sum + (d.improvementMs || 0), 0)
    const avgImprovement = positiveOptimizations.reduce((sum, d) => sum + (d.improvementPercent || 0), 0) / positiveOptimizations.length
    const totalTimeSavedSeconds = (totalTimeSaved / 1000).toFixed(2)
    const totalSelectorsAnalyzed = optimizedSelectors.length

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
        lineNumber?: number
        selectorFile?: string
    }

    const inferenceMaps = buildInferenceMaps(optimizedSelectors)

    const allProcessedSelectors = [...positiveOptimizations, ...negativeOptimizations]

    const processedSelectors = allProcessedSelectors.map(data => {
        const testName = data.testName || 'unknown'
        const isNegative = (data.improvementMs || 0) <= 0 || (data.improvementPercent || 0) <= 0
        const [testFile, suiteName] = applyInference(
            data.testFile || 'unknown',
            data.suiteName || 'unknown',
            testName,
            inferenceMaps
        )
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

        if (!selectorUsageCount.has(selectorKey)) {
            selectorUsageCount.set(selectorKey, { count: 0, testFiles: new Set() })
        }
        const usage = selectorUsageCount.get(selectorKey)!
        usage.count++
        usage.testFiles.add(testFile)

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
                isNegative: isNegative,
                lineNumber: data.lineNumber,
                selectorFile: data.selectorFile
            })
        } else {
            if (suiteName !== 'unknown' && existing.suiteName === 'unknown') {
                existing.suiteName = suiteName
            }
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

    const sortedFiles = Array.from(groupedByFile.entries()).sort(([fileA], [fileB]) => {
        if (fileA === 'unknown' && fileB !== 'unknown') {
            return 1
        }
        if (fileA !== 'unknown' && fileB === 'unknown') {
            return -1
        }
        return fileA.localeCompare(fileB)
    })

    for (const [testFile, suiteMap] of sortedFiles) {
        const sortedSuites = Array.from(suiteMap.entries()).sort(([_suiteA, testMapA], [_suiteB, testMapB]) => {
            const allTimestampsA = Array.from(testMapA.values()).flatMap((opts: GroupedOptimization[]) => opts.map((o: GroupedOptimization) => o.timestamp))
            const allTimestampsB = Array.from(testMapB.values()).flatMap((opts: GroupedOptimization[]) => opts.map((o: GroupedOptimization) => o.timestamp))
            const firstA = allTimestampsA.length > 0 ? Math.min(...allTimestampsA) : 0
            const firstB = allTimestampsB.length > 0 ? Math.min(...allTimestampsB) : 0
            return firstA - firstB
        })

        const sortedSuiteMap = new Map<string, Map<string, GroupedOptimization[]>>()
        for (const [suiteName, testMap] of sortedSuites) {
            const sortedTests = Array.from(testMap.entries()).sort(([_nameA, optsA], [_nameB, optsB]) => {
                const firstA = optsA.length > 0 ? Math.min(...optsA.map((o: GroupedOptimization) => o.timestamp)) : 0
                const firstB = optsB.length > 0 ? Math.min(...optsB.map((o: GroupedOptimization) => o.timestamp)) : 0
                return firstA - firstB
            })
            sortedSuiteMap.set(suiteName, new Map(sortedTests))
        }
        groupedByFile.set(testFile, sortedSuiteMap)
    }

    for (const [testFile, suiteMap] of groupedByFile.entries()) {
        const suiteNames = Array.from(suiteMap.keys())

        for (const suiteName of suiteNames) {
            if (suiteName === 'unknown') {
                const unknownSuite = suiteMap.get(suiteName)!
                const testNames = Array.from(unknownSuite.keys())

                for (const testName of testNames) {
                    const key = `${testFile}::${testName}`
                    const knownSuiteName = inferenceMaps.suiteNameInference.get(key)

                    if (knownSuiteName && suiteMap.has(knownSuiteName)) {
                        const knownSuite = suiteMap.get(knownSuiteName)!
                        if (!knownSuite.has(testName)) {
                            knownSuite.set(testName, [])
                        }

                        const unknownTestGroup = unknownSuite.get(testName)!
                        const knownTestGroup = knownSuite.get(testName)!
                        for (const opt of unknownTestGroup) {
                            const existing = knownTestGroup.find(o => o.originalSelector === opt.originalSelector)
                            if (!existing) {
                                opt.suiteName = knownSuiteName
                                knownTestGroup.push(opt)
                            }
                        }

                        unknownSuite.delete(testName)
                    }
                }

                if (unknownSuite.size === 0) {
                    suiteMap.delete(suiteName)
                }
            }
        }
    }

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
            const locationFile = opt.selectorFile || opt.testFile
            if (opt.lineNumber && locationFile) {
                write(`${REPORT_INDENT_SUMMARY}   📍 Found at: ${locationFile}:${opt.lineNumber}\n`)
            }
        }
        write('\n')
    }

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
            const locationFile = optimization.selectorFile || optimization.testFile
            if (optimization.lineNumber && locationFile) {
                write(`${REPORT_INDENT_SUMMARY}  📍 Found at: ${locationFile}:${optimization.lineNumber}\n`)
            } else {
                write(`${REPORT_INDENT_SUMMARY}  → Selector location not found. Search in: page-objects/**/*.ts or helpers/**/*.ts\n`)
            }
        }
        write('\n')
    }

    write('📋 All Actions Required - Grouped by Test\n')
    write('───────────────────────────────────────────────────────────────────────────\n')

    for (const [testFile, suiteMap] of sortedFiles) {
        const displayFile = testFile === 'unknown' ? 'Unknown Test File (likely in hooks or shared code)' : testFile
        write(`${REPORT_INDENT_FILE}📁 ${displayFile}\n`)

        for (const [suiteName, testMap] of suiteMap.entries()) {
            const displaySuiteName = suiteName === 'unknown' ? 'Unknown Suite' : suiteName
            write(`${REPORT_INDENT_SUITE}📦 Suite: "${displaySuiteName}"\n`)

            for (const [testName, optimizations] of testMap.entries()) {
                const displayTestName = testName === 'unknown' ? 'Unknown Test (likely in hooks)' : testName
                write(`${REPORT_INDENT_TEST}🧪 Test: "${displayTestName}"\n`)

                const significantOptimizations = optimizations.filter(opt => opt.improvementPercent >= 10)
                const minorOptimizations = optimizations.filter(opt => opt.improvementPercent < 10)

                for (const opt of significantOptimizations) {
                    const isShared = selectorUsageCount.get(opt.originalSelector)!.count > 1
                    const sharedMarker = isShared ? ' ⚠️ (also in other test(s))' : ''
                    const formattedOriginal = formatSelectorForDisplay(opt.originalSelector)
                    const formattedOptimized = formatSelectorForDisplay(opt.optimizedSelector)
                    const quoteStyle = opt.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'

                    if (opt.isNegative) {
                        const slowdownPercent = Math.abs(opt.improvementPercent)
                        const line = `${REPORT_INDENT_SELECTOR}⚠️  Replace: $('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle}) (${slowdownPercent.toFixed(1)}% slower)${sharedMarker}`
                        const wrapped = wrapLine(line, maxLineLength, REPORT_INDENT_SELECTOR)
                        for (const wrappedLine of wrapped) {
                            write(`${wrappedLine}\n`)
                        }
                        const locationFile = opt.selectorFile || opt.testFile
                        if (opt.lineNumber && locationFile) {
                            write(`${REPORT_INDENT_SELECTOR}   📍 Found at: ${locationFile}:${opt.lineNumber}\n`)
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
                        const locationFile = opt.selectorFile || opt.testFile
                        if (opt.lineNumber && locationFile) {
                            write(`${REPORT_INDENT_SELECTOR}   📍 Found at: ${locationFile}:${opt.lineNumber}\n`)
                        }
                    }
                }

                if (minorOptimizations.length > 0) {
                    write(`${REPORT_INDENT_SELECTOR}• ${minorOptimizations.length} minor optimization(s) (<10% improvement) - see detailed report\n`)
                }
            }
        }
    }

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
            const locationFile = example.selectorFile || example.testFile
            if (example.lineNumber && locationFile) {
                write(`${REPORT_INDENT_SHARED_DETAIL}📍 Found at: ${locationFile}:${example.lineNumber}\n`)
            } else {
                write(`${REPORT_INDENT_SHARED_DETAIL}→ Selector location not found. Search in: page-objects/**/*.ts or helpers/**/*.ts\n`)
            }
            const line2 = `${REPORT_INDENT_SHARED_DETAIL}→ Replace with: $(${quoteStyle}${formattedOptimized}${quoteStyle})`
            const wrapped2 = wrapLine(line2, maxLineLength, REPORT_INDENT_SHARED_DETAIL + '  ')
            for (const wrappedLine of wrapped2) {
                write(`${wrappedLine}\n`)
            }
        }
    }

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


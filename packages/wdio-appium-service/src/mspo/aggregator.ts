import fs from 'node:fs'
import path from 'node:path'
import type { Capabilities } from '@wdio/types'
import type { SelectorPerformanceData } from './types.js'
import { formatSelectorForDisplay } from './utils.js'

/**
 * Aggregates selector performance data from all worker files and generates a report
 */
export function aggregateSelectorPerformanceData(
    capabilities: Capabilities.TestrunnerCapabilities
): void {
    const workersDataDir = path.join(process.cwd(), 'logs', 'selector-performance')

    // Generate unique filename with device name and timestamp
    const deviceName = getDeviceName(capabilities)
    const timestamp = Date.now()
    const sanitizedDeviceName = deviceName.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase() || 'unknown'
    const finalJsonPath = path.join(process.cwd(), `selector-performance-${sanitizedDeviceName}-${timestamp}.json`)

    try {
        if (!fs.existsSync(workersDataDir)) {
            return
        }

        // Read all worker data files
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
                console.warn(`Failed to read worker data file ${file}:`, err)
            }
        })

        // Group data by spec file for JSON output
        const groupedData = groupDataBySpecFile(allData)

        // Write aggregated data to final JSON file (grouped by spec file)
        fs.writeFileSync(finalJsonPath, JSON.stringify(groupedData, null, 2))

        // Generate summary
        const totalSelectors = allData.length

        if (totalSelectors === 0) {
            console.log('\n📊 Selector Performance Summary:')
            console.log('   No element-finding commands were tracked.')
            console.log(`   💡 JSON file written to: ${finalJsonPath}`)
        } else {
            const avgDuration = allData.reduce((sum, d) => sum + d.duration, 0) / totalSelectors || 0

            // Analyze optimized selectors
            const optimizedSelectors = allData.filter(d => d.optimizedSelector && d.improvementMs !== undefined)

            // Show optimization insights if we have optimized selectors
            if (optimizedSelectors.length > 0) {
                generateGroupedSummaryReport(optimizedSelectors)
            } else {
                // Only show basic summary if no optimizations found
                console.log('\n📊 Selector Performance Summary:')
                console.log(`   Total element finds: ${totalSelectors}`)
                console.log(`   Average duration: ${avgDuration.toFixed(2)}ms`)
            }

            if (optimizedSelectors.length === 0) {
                console.log('\n   ✅ All selectors performed well')
                console.log(`   💡 JSON file written to: ${finalJsonPath}`)
            }
        }

        // Clean up worker data directory
        try {
            fs.rmSync(workersDataDir, { recursive: true, force: true })
        } catch (err) {
            console.warn('Failed to clean up worker data directory:', err)
        }
    } catch (err) {
        console.error('Failed to aggregate selector performance data:', err)
        if (err instanceof Error) {
            console.error('Error details:', err.message)
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
export function getDeviceName(capabilities: Capabilities.TestrunnerCapabilities): string {
    if (!capabilities) {
        return 'unknown'
    }

    // Handle multiremote capabilities
    if (!Array.isArray(capabilities) && typeof capabilities === 'object') {
        const firstCap = Object.values(capabilities)[0]
        if (firstCap && typeof firstCap === 'object' && 'capabilities' in firstCap) {
            const caps = (firstCap.capabilities as Capabilities.W3CCapabilities).alwaysMatch || firstCap.capabilities as Capabilities.W3CCapabilities
            return (caps['appium:deviceName'] || 'unknown') as string
        }
    }

    // Handle array of capabilities - use first one
    if (Array.isArray(capabilities) && capabilities.length > 0) {
        const cap = capabilities[0] as Capabilities.W3CCapabilities
        const w3cCap = cap.alwaysMatch || cap
        return (w3cCap['appium:deviceName'] || 'unknown') as string
    }

    // Handle single capability object
    const cap = capabilities as unknown as Capabilities.W3CCapabilities
    const w3cCap = cap.alwaysMatch || cap
    return (w3cCap['appium:deviceName'] || 'unknown') as string
}

/**
 * Generates a grouped summary report of selector optimizations
 */
function generateGroupedSummaryReport(optimizedSelectors: SelectorPerformanceData[]): void {
    // Calculate overall stats
    const totalTimeSaved = optimizedSelectors.reduce((sum, d) => sum + (d.improvementMs || 0), 0)
    const avgImprovement = optimizedSelectors.reduce((sum, d) => sum + (d.improvementPercent || 0), 0) / optimizedSelectors.length
    const totalTimeSavedSeconds = (totalTimeSaved / 1000).toFixed(2)

    // Group by test file -> suite name -> test name -> selector
    interface GroupedOptimization {
        testFile: string
        suiteName: string
        testName: string
        originalSelector: string
        optimizedSelector: string
        improvementPercent: number
        improvementMs: number
        timestamp: number // For sorting by execution order
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

    // Second pass: Infer and update unknown values
    const processedSelectors = optimizedSelectors.map(data => {
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

    const groupedByFile = new Map<string, Map<string, Map<string, GroupedOptimization[]>>>()
    const selectorUsageCount = new Map<string, { count: number; testFiles: Set<string> }>()

    for (const data of processedSelectors) {
        if (!data.optimizedSelector || data.improvementMs === undefined) {
            continue
        }

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
                timestamp: data.timestamp // Store timestamp for sorting
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

    // Print summary header
    console.log('\n📊 Mobile Selector Performance: Summary Report')
    console.log(`   Total optimizations found: ${optimizedSelectors.length}`)
    console.log(`   Average improvement: ${avgImprovement.toFixed(1)}% faster`)
    console.log(`   Total time saved: ${totalTimeSaved.toFixed(2)}ms per test run`)
    console.log('\n📋 All Actions Required - Grouped by Test')

    // Print grouped optimizations
    for (const [testFile, suiteMap] of sortedFiles) {
        const displayFile = testFile === 'unknown' ? 'Unknown Test File (likely in hooks or shared code)' : testFile
        console.log(`\n   📁 ${displayFile}`)

        for (const [suiteName, testMap] of suiteMap.entries()) {
            const displaySuiteName = suiteName === 'unknown' ? 'Unknown Suite' : suiteName
            console.log(`\n      📦 Suite: "${displaySuiteName}"`)

            for (const [testName, optimizations] of testMap.entries()) {
                const displayTestName = testName === 'unknown' ? 'Unknown Test (likely in hooks)' : testName
                console.log(`\n         🧪 Test: "${displayTestName}"`)

                for (const opt of optimizations) {
                    const isShared = selectorUsageCount.get(opt.originalSelector)!.count > 1
                    const sharedMarker = isShared ? ' ⚠️ (also in other test(s))' : ''
                    const formattedOriginal = formatSelectorForDisplay(opt.originalSelector)
                    const formattedOptimized = formatSelectorForDisplay(opt.optimizedSelector)
                    const quoteStyle = opt.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'

                    console.log(`            • Replace: $('${formattedOriginal}') → $(${quoteStyle}${formattedOptimized}${quoteStyle}) (${opt.improvementPercent.toFixed(1)}% faster)${sharedMarker}`)
                }
            }
        }
    }

    // Print shared selectors section
    const sharedSelectors = Array.from(selectorUsageCount.entries())
        .filter(([_, usage]) => usage.count > 1)

    if (sharedSelectors.length > 0) {
        console.log('\n   ⚠️  [Shared Selectors Detected]')
        console.log('      The following selectors appear in multiple tests and are likely in Page Objects:')

        for (const [selector, usage] of sharedSelectors) {
            const example = optimizedSelectors.find(d => d.selector === selector)
            if (!example || !example.optimizedSelector) {
                continue
            }

            const formattedOriginal = formatSelectorForDisplay(selector)
            const formattedOptimized = formatSelectorForDisplay(example.optimizedSelector)
            const quoteStyle = example.optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'

            console.log(`      • $('${formattedOriginal}') - appears in ${usage.count} test(s)`)
            console.log('         → Search in: page-objects/**/*.ts or helpers/**/*.ts')
            console.log(`         → Replace with: $(${quoteStyle}${formattedOptimized}${quoteStyle})`)
        }
    }

    // Analyze which selector types were used
    const selectorTypes = new Set<string>()
    for (const data of optimizedSelectors) {
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

    // Print "Why Change?" section
    console.log('\n   💡 [Why Change?]')
    console.log(`      • Average ${avgImprovement.toFixed(1)}% performance improvement (total of ${totalTimeSavedSeconds} seconds faster per run of this suite)`)
    console.log(`      • ${benefitsText}`)
    if (docLinks.length > 0) {
        console.log('      • Documentation:')
        for (const link of docLinks) {
            console.log(`        - ${link}`)
        }
    }
}


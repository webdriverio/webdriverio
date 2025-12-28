import fs from 'node:fs'
import path from 'node:path'
import type { Capabilities } from '@wdio/types'
import type { SelectorPerformanceData } from './types.js'

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

        // Write aggregated data to final JSON file
        fs.writeFileSync(finalJsonPath, JSON.stringify(allData, null, 2))

        // Generate summary
        const totalSelectors = allData.length

        if (totalSelectors === 0) {
            console.log('\n📊 Selector Performance Summary:')
            console.log('   No element-finding commands were tracked.')
            console.log(`   💡 JSON file written to: ${finalJsonPath}`)
        } else {
            const slowSelectors = allData.filter(d => d.duration > 100) // Consider >100ms as slow
            const avgDuration = allData.reduce((sum, d) => sum + d.duration, 0) / totalSelectors || 0

            // Analyze optimized selectors
            const optimizedSelectors = allData.filter(d => d.optimizedSelector && d.improvementMs !== undefined)
            const xpathSelectors = allData.filter(d => d.selectorType === 'xpath')

            console.log('\n📊 Selector Performance Summary:')
            console.log(`   Total element finds: ${totalSelectors}`)
            console.log(`   Average duration: ${avgDuration.toFixed(2)}ms`)

            // Show optimization insights if we have optimized selectors
            if (optimizedSelectors.length > 0) {
                const totalTimeSaved = optimizedSelectors.reduce((sum, d) => sum + (d.improvementMs || 0), 0)
                const avgImprovement = optimizedSelectors.reduce((sum, d) => sum + (d.improvementPercent || 0), 0) / optimizedSelectors.length
                const bestImprovement = optimizedSelectors.reduce((best, d) => {
                    const improvement = d.improvementPercent || 0
                    return improvement > (best.improvementPercent || 0) ? d : best
                }, optimizedSelectors[0])

                console.log('\n🚀 Selector Optimization Results:')
                console.log(`   Optimized selectors: ${optimizedSelectors.length} out of ${xpathSelectors.length} XPath selectors`)
                console.log(`   Average improvement: ${avgImprovement.toFixed(1)}% faster`)
                console.log(`   Total time saved: ${totalTimeSaved.toFixed(2)}ms`)

                if (bestImprovement && bestImprovement.improvementPercent) {
                    console.log(`   Best improvement: ${bestImprovement.improvementPercent.toFixed(1)}% faster`)
                    const originalDisplay = bestImprovement.selector.length > 50
                        ? `${bestImprovement.selector.substring(0, 50)}...`
                        : bestImprovement.selector
                    const optimizedDisplay = bestImprovement.optimizedSelector && bestImprovement.optimizedSelector.length > 50
                        ? `${bestImprovement.optimizedSelector.substring(0, 50)}...`
                        : bestImprovement.optimizedSelector || ''
                    console.log(`     Original: $('${originalDisplay}')`)
                    console.log(`     Optimized: $('${optimizedDisplay}')`)
                }
            }

            if (slowSelectors.length > 0) {
                console.log(`\n   ⚠️  Found ${slowSelectors.length} selectors that may be slow (>100ms)`)
                console.log(`   💡 A detailed report can be generated from: ${finalJsonPath}`)
            } else {
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


import fs from 'node:fs/promises'
import path from 'node:path'
import type { ResultSet } from './types.js'

/**
 * Validates a file pattern to prevent ReDoS attacks
 * @param pattern - The pattern to validate
 * @returns true if the pattern is safe, false otherwise
 */
function isFilePatternSafe(pattern: string): boolean {
    // Basic length limit
    if (pattern.length > 200) {return false}

    // Check for potentially dangerous regex patterns
    const dangerousPatterns = [
        // Nested quantifiers
        /(\*.*\*)|(\+.*\+)|(\?.*\?)/,
        // Alternation with overlapping patterns
        /\([^)]*\|[^)]*\)\*|\([^)]*\|[^)]*\)\+/,
        // Complex lookarounds
        /\(\?=/,
        /\(\?!/,
        /\(\?<=/,
        /\(\?<!/,
        // Excessive repetition
        /\{[0-9]{3,}\}/,
        // Suspicious character classes with quantifiers
        /\[.*\]\*.*\[.*\]\*|\[.*\]\+.*\[.*\]\+/
    ]

    return !dangerousPatterns.some(dangerous => dangerous.test(pattern))
}

const DEFAULT_FILENAME = 'wdio-merged.json'

type MergedResultSet = Omit<ResultSet, 'capabilities'> & { capabilities: ResultSet['capabilities'][] }

export default async function mergeResults(
    dir: string = process.argv[2],
    filePattern: string | RegExp = process.argv[3],
    customFileName: string = process.argv[4]
) {
    const doesDirExist = fs.access(dir).then(() => true, () => false)
    if (!doesDirExist) {
        throw new Error(`Directory "${dir}" does not exist.`)
    }
    const rawData = await getDataFromFiles(dir, filePattern)
    const mergedResults = mergeData(rawData)

    if (customFileName) {
        const fileName = customFileName || DEFAULT_FILENAME
        const filePath = path.join(dir, fileName)
        await fs.writeFile(filePath, JSON.stringify(mergedResults))
    }

    return mergedResults
}

async function getDataFromFiles (dir: string, filePattern: string | RegExp) {
    let safePattern: RegExp

    if (filePattern instanceof RegExp) {
        safePattern = filePattern
    } else if (typeof filePattern === 'string' && isFilePatternSafe(filePattern)) {
        try {
            safePattern = new RegExp(filePattern)
        } catch {
            // If the pattern is invalid, fall back to a safe default
            safePattern = /\.json$/
        }
    } else {
        // If pattern is unsafe or invalid, use a safe default
        safePattern = /\.json$/
    }

    const fileNames = (await fs.readdir(dir)).filter((file) => file.match(safePattern))
    const data: unknown[] = []

    await Promise.all(fileNames.map(async (fileName) => {
        data.push(JSON.parse((await fs.readFile(`${dir}/${fileName}`)).toString()))
    }))

    return data as ResultSet[]
}

function mergeData (rawData: ResultSet[]) {
    if (rawData.length === 0) {
        return {} as MergedResultSet
    }

    const mergedResults: MergedResultSet = {
        ...rawData[0],
        capabilities: [rawData[0].capabilities]
    }

    for (const data of rawData.slice(1)) {
        mergedResults.suites.push(...data.suites)
        mergedResults.specs.push(...data.specs)
        mergedResults.state.passed += data.state.passed
        mergedResults.state.failed += data.state.failed
        mergedResults.state.skipped += data.state.skipped
        mergedResults.capabilities.push(data.capabilities)
    }

    mergedResults.suites.forEach((suite) => {
        mergedResults.end = (suite.end && mergedResults.end && suite.end > mergedResults.end ? suite.end : mergedResults.end)
    })

    return mergedResults
}

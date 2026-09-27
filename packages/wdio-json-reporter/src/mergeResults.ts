import fs from 'node:fs/promises'
import path from 'node:path'

import safeRegexTest from 'safe-regex2'

import type { ResultSet } from './types.js'

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
    const fileName = customFileName || DEFAULT_FILENAME
    const filePath = path.join(dir, fileName)
    const rawData = await getDataFromFiles(dir, filePattern, path.basename(fileName))

    // Nothing matched this pattern. Return an empty result and leave a usable
    // output file alone so a previous merge or a raw report is not handed back
    // or replaced with {}.
    if (rawData.length === 0 && await outputFileParses(filePath)) {
        return {} as MergedResultSet
    }

    const mergedResults = mergeData(rawData)
    await fs.writeFile(filePath, JSON.stringify(mergedResults))

    return mergedResults
}

async function getDataFromFiles (dir: string, filePattern: string | RegExp, outputFileName?: string) {
    let safePattern: RegExp

    if (filePattern instanceof RegExp) {
        // For existing RegExp objects, test them for safety
        safePattern = safeRegexTest(filePattern) ? filePattern : /\.json$/
    } else if (typeof filePattern === 'string') {
        try {
            // Test the created RegExp for safety
            safePattern = safeRegexTest(filePattern) ? new RegExp(filePattern) : /\.json$/
        } catch {
            // If the pattern syntax is invalid, fall back to a safe default
            safePattern = /\.json$/
        }
    } else {
        // If pattern is unsafe or invalid, use a safe default
        safePattern = /\.json$/
    }

    const fileNames = (await fs.readdir(dir)).filter((file) => file.match(safePattern))
    const entries = (await Promise.all(fileNames.map(async (fileName) => {
        const raw = (await fs.readFile(path.join(dir, fileName))).toString()
        try {
            const contents = JSON.parse(raw) as ResultSet
            return { fileName, contents }
        } catch (err) {
            // A truncated previous output must not block merging valid worker reports.
            if (fileName === outputFileName) {
                return undefined
            }
            throw err
        }
    }))).filter((entry): entry is { fileName: string, contents: ResultSet } => entry !== undefined)

    // A previous merge stores capabilities as an array. A raw worker report keeps
    // a capabilities object, including when outputFileFormat uses the merged filename.
    return entries
        .filter(({ fileName, contents }) => !(fileName === outputFileName && Array.isArray(contents.capabilities)))
        .map(({ contents }) => contents)
}

async function outputFileParses (filePath: string) {
    try {
        JSON.parse((await fs.readFile(filePath)).toString())
        return true
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT' || err instanceof SyntaxError) {
            return false
        }
        throw err
    }
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

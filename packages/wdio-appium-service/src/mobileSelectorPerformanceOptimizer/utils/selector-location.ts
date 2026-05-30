import path from 'node:path'
import fs from 'node:fs'
import logger from '@wdio/logger'
import { isXPathSelector } from './selector-utils.js'

const log = logger('@wdio/appium-service:selector-optimizer')

export interface SelectorLocation {
    file: string
    line: number
    isPageObject: boolean
}

/**
 * Searches for a selector string in a file and returns the line number where it's found.
 * Handles both plain selectors and template literals.
 */
function findSelectorInFile(filePath: string, selector: string): number | undefined {
    try {
        if (!fs.existsSync(filePath)) {
            return undefined
        }

        const content = fs.readFileSync(filePath, 'utf-8')
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (line.includes(selector) ||
                line.includes(`'${selector}'`) ||
                line.includes(`"${selector}"`) ||
                line.includes(`\`${selector}\``)) {
                return i + 1
            }
        }

        return undefined
    } catch {
        return undefined
    }
}

/**
 * Finds potential page object files related to a test file.
 * Common patterns:
 * - tests/specs/login.spec.ts -> tests/pageobjects/login.page.ts
 * - tests/e2e/login.test.ts -> tests/pages/login.page.ts
 * - test/specs/login.spec.js -> test/page-objects/login.page.js
 */
function findPotentialPageObjects(testFile: string): string[] {
    const testDir = path.dirname(testFile)
    const testBasename = path.basename(testFile)
    const ext = path.extname(testFile)

    const baseName = testBasename
        .replace(/\.(spec|test|e2e)/, '')
        .replace(ext, '')

    const potentialFiles: string[] = []
    const pageObjectDirs = ['pageobjects', 'pageObjects', 'page-objects', 'pages', 'page_objects']

    let currentDir = testDir
    for (let i = 0; i < 5; i++) {
        for (const poDir of pageObjectDirs) {
            const pageObjectDir = path.join(currentDir, poDir)

            if (fs.existsSync(pageObjectDir)) {
                const patterns = [
                    `${baseName}.page${ext}`,
                    `${baseName}.po${ext}`,
                    `${baseName}Page${ext}`,
                    `${baseName}${ext}`,
                ]

                for (const pattern of patterns) {
                    const fullPath = path.join(pageObjectDir, pattern)
                    if (fs.existsSync(fullPath)) {
                        potentialFiles.push(fullPath)
                    }
                }
            }
        }

        const parentDir = path.dirname(currentDir)
        if (parentDir === currentDir) {
            break
        }
        currentDir = parentDir
    }

    return potentialFiles
}

/**
 * Recursively finds all JavaScript/TypeScript files in a directory.
 */
function findFilesInDirectory(dirPath: string, maxDepth: number = 5, currentDepth: number = 0): string[] {
    const files: string[] = []

    if (currentDepth >= maxDepth) {
        return files
    }

    try {
        if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
            return files
        }

        const entries = fs.readdirSync(dirPath, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)

            if (entry.isDirectory()) {
                if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                    continue
                }
                files.push(...findFilesInDirectory(fullPath, maxDepth, currentDepth + 1))
            } else if (entry.isFile() && /\.(js|ts|jsx|tsx)$/.test(entry.name)) {
                files.push(fullPath)
            }
        }
    } catch {
        // Ignore errors
    }

    return files
}

/**
 * Finds all page object files from configured paths.
 */
function findPageObjectFilesFromConfig(pageObjectPaths: string[]): string[] {
    const files: string[] = []

    for (const configPath of pageObjectPaths) {
        try {
            const resolvedPath = path.isAbsolute(configPath)
                ? configPath
                : path.resolve(process.cwd(), configPath)

            const stat = fs.statSync(resolvedPath)

            if (stat.isDirectory()) {
                files.push(...findFilesInDirectory(resolvedPath))
            } else if (stat.isFile() && /\.(js|ts|jsx|tsx)$/.test(resolvedPath)) {
                files.push(resolvedPath)
            }
        } catch {
            // Path doesn't exist, skip it
        }
    }

    return files
}

/**
 * Searches for a selector in the test file and related page object files.
 * Returns all locations where the selector is defined.
 *
 * Strategy:
 * 1. First search the test file itself
 * 2. If pageObjectPaths provided, search those directories
 * 3. Otherwise, search related page object files (guessing from test file name)
 * 4. Return all matches with file and line number
 *
 * IMPORTANT: Only searches for XPath selectors (starting with // or /).
 * This prevents searching for optimized selectors like accessibility IDs or class chains.
 */
export function findSelectorLocation(
    testFile: string | undefined,
    selector: string,
    pageObjectPaths?: string[]
): SelectorLocation[] {
    if (!testFile || !selector) {
        log.debug('[Selector Location] No test file or selector provided')
        return []
    }

    if (!isXPathSelector(selector)) {
        log.debug(`[Selector Location] Skipping non-XPath selector: ${selector}`)
        return []
    }

    try {
        const locations: SelectorLocation[] = []

        log.debug(`[Selector Location] Searching for XPath selector: ${selector}`)
        log.debug(`[Selector Location] Starting with test file: ${testFile}`)

        const testFileLine = findSelectorInFile(testFile, selector)
        if (testFileLine) {
            log.debug(`[Selector Location] Found in test file at line ${testFileLine}`)
            locations.push({
                file: testFile,
                line: testFileLine,
                isPageObject: false
            })
        }

        log.debug('[Selector Location] Searching page objects...')

        const pageObjectFiles = pageObjectPaths && pageObjectPaths.length > 0
            ? findPageObjectFilesFromConfig(pageObjectPaths)
            : findPotentialPageObjects(testFile)

        if (pageObjectPaths && pageObjectPaths.length > 0) {
            log.debug('[Selector Location] Using configured page object paths:')
            pageObjectPaths.forEach(p => {
                log.debug(`[Selector Location]   - ${p}`)
            })
        }
        if (pageObjectFiles.length > 0) {
            log.debug(`[Selector Location] Found ${pageObjectFiles.length} page object file(s) to search`)
        } else {
            log.debug('[Selector Location] No page object files found')
        }

        for (const pageObjectFile of pageObjectFiles) {
            const pageObjectLine = findSelectorInFile(pageObjectFile, selector)
            if (pageObjectLine) {
                log.debug(`[Selector Location] Found in page object at ${pageObjectFile}:${pageObjectLine}`)
                locations.push({
                    file: pageObjectFile,
                    line: pageObjectLine,
                    isPageObject: true
                })
            }
        }

        if (locations.length === 0) {
            log.debug('[Selector Location] Selector not found in test file or page objects')
        } else {
            log.debug(`[Selector Location] Found ${locations.length} location(s)`)
        }

        return locations
    } catch (error) {
        log.debug(`[Selector Location] Error: ${error instanceof Error ? error.message : String(error)}`)
        return []
    }
}

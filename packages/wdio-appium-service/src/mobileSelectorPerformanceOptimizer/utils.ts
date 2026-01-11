import path from 'node:path'
import fs from 'node:fs'
import { SevereServiceError } from 'webdriverio'
import logger from '@wdio/logger'
import type { Frameworks, Options, Reporters } from '@wdio/types'
import type { XPathConversionResult } from './xpath-utils.js'
import { convertXPathToOptimizedSelector } from './xpath-utils.js'
import type { TestContext, CommandTiming, SelectorPerformanceData } from './types.js'
import type { AppiumServiceConfig } from '../types.js'
import { addPerformanceData } from './mspo-store.js'

const log = logger('@wdio/appium-service')

export const LOG_PREFIX = 'Mobile Selector Performance'
export const INDENT_LEVEL_1 = '  '
export const INDENT_LEVEL_2 = '      '
export const INDENT_LEVEL_3 = '    '
export const INDENT_LEVEL_4 = '          '
export const INDENT_LEVEL_5 = '        '

// User commands that find elements
export const SINGLE_ELEMENT_COMMANDS = ['$', 'custom$'] as const
export const MULTIPLE_ELEMENT_COMMANDS = ['$$', 'custom$$'] as const
export const USER_COMMANDS = [...SINGLE_ELEMENT_COMMANDS, ...MULTIPLE_ELEMENT_COMMANDS] as const

// Report formatting constants
export const REPORT_INDENT_SUMMARY = '   '
export const REPORT_INDENT_FILE = '   '
export const REPORT_INDENT_SUITE = '      '
export const REPORT_INDENT_TEST = '         '
export const REPORT_INDENT_SELECTOR = '            '
export const REPORT_INDENT_SHARED = '      '
export const REPORT_INDENT_SHARED_DETAIL = '         '
export const REPORT_INDENT_WHY_CHANGE = '      '
export const REPORT_INDENT_DOCS = '        '

/**
 * Checks if the log level is silent
 * Checks both the environment variable (which has priority in WebdriverIO) and the config
 */
export function isSilentLogLevel(config?: Options.Testrunner): boolean {
    const envLogLevel = process.env.WDIO_LOG_LEVEL
    if (envLogLevel === 'silent') {
        return true
    }
    if (envLogLevel) {
        return false
    }

    if (!config) {
        return false
    }
    const logLevel = config.logLevel || 'info'
    return logLevel === 'silent'
}

/**
 * Extracts the test file path from a test or suite object.
 * Follows the same pattern as wdio-spec-reporter for consistency.
 *
 * For suites: uses suite.file directly (works for Mocha, Jasmine, Cucumber)
 * For tests: uses test.file if available, otherwise gets from parent suite
 */
export function extractTestFile(test?: Frameworks.Test, suite?: Frameworks.Suite): string | undefined {
    // For suites: use file property directly (same as spec-reporter)
    if (suite) {
        const suiteWithFile = suite as Frameworks.Suite & { file?: string }
        if (suiteWithFile.file && typeof suiteWithFile.file === 'string') {
            return suiteWithFile.file
        }
    }

    if (test) {
        const testWithFile = test as Frameworks.Test & { file?: string }
        if (testWithFile.file && typeof testWithFile.file === 'string') {
            return testWithFile.file
        }

        if (test.parent && typeof test.parent === 'object') {
            const parentWithFile = test.parent as unknown as Frameworks.Suite & { file?: string }
            if (parentWithFile.file && typeof parentWithFile.file === 'string') {
                return parentWithFile.file
            }
        }
    }

    return undefined
}

/**
 * Extracts the suite name from a test object
 */
export function extractSuiteName(test?: Frameworks.Test): string {
    if (!test) {
        return 'unknown'
    }

    // For Mocha: test.parent.title
    // For Jasmine: test.fullName without test.title
    const parent = test.parent
    if (parent && typeof parent === 'object') {
        const parentSuite = parent as unknown as Frameworks.Suite
        if ('title' in parentSuite) {
            const parentTitle = parentSuite.title
            return (typeof parentTitle === 'string' ? parentTitle : 'unknown') || 'unknown'
        }
    }

    if (test.fullName) {
        const testTitle = test.title || ''
        return test.fullName.replace(new RegExp(' ' + testTitle + '$'), '').trim() || 'unknown'
    }

    return 'unknown'
}

/**
 * Extracts the test name from a test object
 */
export function extractTestName(test?: Frameworks.Test): string {
    if (!test) {
        return 'unknown'
    }

    return test.title || test.description || 'unknown'
}

/**
 * Result of finding a selector in source files
 */
export interface SelectorLocation {
    file: string
    line: number
    isPageObject: boolean
}

/**
 * Searches for a selector string in a file and returns the line number where it's found.
 * Handles both plain selectors and template literals.
 *
 * @param filePath - Absolute path to the file to search
 * @param selector - The selector string to find
 * @returns Line number (1-indexed) or undefined if not found
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

            // Check for exact match (accounting for quotes)
            // Matches: $('selector'), $("selector"), $(`selector`)
            if (line.includes(selector) ||
                line.includes(`'${selector}'`) ||
                line.includes(`"${selector}"`) ||
                line.includes(`\`${selector}\``)) {
                return i + 1  // Line numbers are 1-indexed
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
 *
 * @param testFile - The test file path
 * @returns Array of potential page object file paths
 */
function findPotentialPageObjects(testFile: string): string[] {
    const testDir = path.dirname(testFile)
    const testBasename = path.basename(testFile)
    const ext = path.extname(testFile)

    // Extract base name without spec/test suffix
    // login.spec.ts -> login, login.test.js -> login
    const baseName = testBasename
        .replace(/\.(spec|test|e2e)/, '')
        .replace(ext, '')

    const potentialFiles: string[] = []

    // Common page object directory names
    const pageObjectDirs = ['pageobjects', 'pageObjects', 'page-objects', 'pages', 'page_objects']

    // Search up the directory tree for page object directories
    let currentDir = testDir
    for (let i = 0; i < 5; i++) {  // Search up to 5 levels
        for (const poDir of pageObjectDirs) {
            const pageObjectDir = path.join(currentDir, poDir)

            if (fs.existsSync(pageObjectDir)) {
                // Try different naming conventions
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

        // Move up one directory
        const parentDir = path.dirname(currentDir)
        if (parentDir === currentDir) {
            break  // Reached root
        }
        currentDir = parentDir
    }

    return potentialFiles
}

/**
 * Recursively finds all JavaScript/TypeScript files in a directory
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
                // Skip node_modules and hidden directories
                if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
                    continue
                }
                files.push(...findFilesInDirectory(fullPath, maxDepth, currentDepth + 1))
            } else if (entry.isFile()) {
                // Include .js, .ts, .jsx, .tsx files
                if (/\.(js|ts|jsx|tsx)$/.test(entry.name)) {
                    files.push(fullPath)
                }
            }
        }
    } catch {
        // Ignore errors accessing directories
    }

    return files
}

/**
 * Finds all page object files from configured paths
 */
function findPageObjectFilesFromConfig(pageObjectPaths: string[]): string[] {
    const files: string[] = []

    for (const configPath of pageObjectPaths) {
        try {
            // Resolve path relative to cwd
            const resolvedPath = path.isAbsolute(configPath)
                ? configPath
                : path.resolve(process.cwd(), configPath)

            const stat = fs.statSync(resolvedPath)

            if (stat.isDirectory()) {
                // If it's a directory, find all files recursively
                files.push(...findFilesInDirectory(resolvedPath))
            } else if (stat.isFile() && /\.(js|ts|jsx|tsx)$/.test(resolvedPath)) {
                // If it's a single file, add it
                files.push(resolvedPath)
            }
        } catch {
            // Path doesn't exist or can't be accessed, skip it
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
 *
 * @param testFile - The test file path
 * @param selector - The selector to search for (should be XPath)
 * @param pageObjectPaths - Optional array of paths/globs to search for page objects
 * @param enableLogging - If true, logs detailed debugging information
 * @returns Array of location info (empty if not found or not an XPath selector)
 */
export function findSelectorLocation(
    testFile: string | undefined,
    selector: string,
    pageObjectPaths?: string[],
    enableLogging: boolean = false
): SelectorLocation[] {
    if (!testFile || !selector) {
        if (enableLogging) {
            console.log(`${INDENT_LEVEL_2}🔍 [Selector Location] No test file or selector provided`)
        }
        return []
    }

    // Only search for XPath selectors (original selectors, not optimized ones)
    if (!isXPathSelector(selector)) {
        if (enableLogging) {
            console.log(`${INDENT_LEVEL_2}🔍 [Selector Location] Skipping non-XPath selector: ${selector}`)
        }
        return []
    }

    try {
        const locations: SelectorLocation[] = []

        if (enableLogging) {
            console.log(`${INDENT_LEVEL_2}🔍 [Selector Location] Searching for XPath selector: ${selector}`)
            console.log(`${INDENT_LEVEL_2}   Starting with test file: ${testFile}`)
        }

        // Step 1: Search in the test file itself
        const testFileLine = findSelectorInFile(testFile, selector)
        if (testFileLine) {
            if (enableLogging) {
                console.log(`${INDENT_LEVEL_2}✅ [Selector Location] Found in test file at line ${testFileLine}`)
            }
            locations.push({
                file: testFile,
                line: testFileLine,
                isPageObject: false
            })
        }

        if (enableLogging) {
            console.log(`${INDENT_LEVEL_2}   Searching page objects...`)
        }

        // Step 2: Search in page object files
        // Use configured paths if provided, otherwise guess based on test file name
        const pageObjectFiles = pageObjectPaths && pageObjectPaths.length > 0
            ? findPageObjectFilesFromConfig(pageObjectPaths)
            : findPotentialPageObjects(testFile)

        if (enableLogging) {
            if (pageObjectPaths && pageObjectPaths.length > 0) {
                console.log(`${INDENT_LEVEL_2}   Using configured page object paths:`)
                pageObjectPaths.forEach(p => {
                    console.log(`${INDENT_LEVEL_2}     - ${p}`)
                })
            }
            if (pageObjectFiles.length > 0) {
                console.log(`${INDENT_LEVEL_2}   Found ${pageObjectFiles.length} page object file(s) to search:`)
                pageObjectFiles.forEach(file => {
                    console.log(`${INDENT_LEVEL_2}     - ${file}`)
                })
            } else {
                console.log(`${INDENT_LEVEL_2}   No page object files found`)
            }
        }

        for (const pageObjectFile of pageObjectFiles) {
            const pageObjectLine = findSelectorInFile(pageObjectFile, selector)
            if (pageObjectLine) {
                if (enableLogging) {
                    console.log(`${INDENT_LEVEL_2}✅ [Selector Location] Found in page object at ${pageObjectFile}:${pageObjectLine}`)
                }
                locations.push({
                    file: pageObjectFile,
                    line: pageObjectLine,
                    isPageObject: true
                })
            }
        }

        if (enableLogging) {
            if (locations.length === 0) {
                console.log(`${INDENT_LEVEL_2}⚠️  [Selector Location] Selector not found in test file or page objects`)
            } else {
                console.log(`${INDENT_LEVEL_2}✅ [Selector Location] Found ${locations.length} location(s)`)
            }
        }

        return locations
    } catch (error) {
        if (enableLogging) {
            console.log(`${INDENT_LEVEL_2}❌ [Selector Location] Error: ${error instanceof Error ? error.message : String(error)}`)
        }
        return []
    }
}

/**
 * Checks if a command is an element find command ($, $$, custom$, etc.)
 * These commands return elements and should NOT be tracked as element actions.
 * Based on WebdriverIO source: packages/webdriverio/src/commands/element/
 * - $, $$, custom$, custom$$, shadow$, shadow$$ are marked as @type utility
 * - getElement, getElements, nextElement, previousElement, parentElement are also @type utility
 */
export function isElementFindCommand(commandName: string): boolean {
    const elementFindCommands = [
        '$', '$$', 'findElement', 'findElements',
        'custom$', 'custom$$',
        'shadow$', 'shadow$$',
        'getElement', 'getElements',
        'nextElement', 'previousElement', 'parentElement',
    ]
    return elementFindCommands.includes(commandName)
}

/**
 * Extracts a selector string from command arguments
 */
export function extractSelectorFromArgs(args: unknown[]): string | null {
    if (!args || args.length === 0) {
        return null
    }

    // First argument is usually the selector
    const firstArg = args[0]

    if (typeof firstArg === 'string') {
        return firstArg
    }

    if (typeof firstArg === 'object' && firstArg !== null) {
        // For custom selectors or object-based selectors, stringify
        try {
            return JSON.stringify(firstArg)
        } catch {
            return String(firstArg)
        }
    }

    return String(firstArg)
}

/**
 * Formats a selector for display/logging purposes (truncates long selectors)
 */
export function formatSelectorForDisplay(selector: string | object, maxLength: number = 100): string {
    // Handle string selectors directly (most common case)
    if (typeof selector === 'string') {
        if (selector.length > maxLength) {
            return selector.substring(0, maxLength) + '...'
        }
        return selector
    }

    // Handle object selectors with simple string conversion
    return String(selector)
}

/**
 * Gets high-resolution time in milliseconds
 */
export function getHighResTime(): number {
    // Use high-resolution time if available (Node.js 16.5+)
    if (typeof process !== 'undefined' && process.hrtime) {
        const [seconds, nanoseconds] = process.hrtime()
        return seconds * 1000 + nanoseconds / 1000000
    }
    // Fallback to Date.now() for older Node.js versions
    return Date.now()
}

/**
 * Builds a complete test context object from a test object and test file
 * Note: Line numbers are not included here as they require a specific selector to search for
 */
export function buildTestContext(test?: Frameworks.Test, testFile?: string): TestContext {
    return {
        testFile: testFile || extractTestFile(test),
        suiteName: extractSuiteName(test),
        testName: extractTestName(test),
        lineNumber: undefined
    }
}

/**
 * Checks if a selector is an XPath selector.
 * Uses pattern matching to distinguish XPath from CSS selectors.
 *
 * XPath patterns detected:
 * - Absolute path: /html, //div, //*
 * - Relative path: ./div, ../parent
 * - Descendant any: asterisk followed by slash, e.g. asterisk/child
 * - Grouped expressions: (//div)[1] - must contain XPath-like content
 *
 * Not XPath (CSS selectors):
 * - Pseudo-selectors starting with (: e.g., (:has(...))
 * - Class selectors: .class
 * - ID selectors: #id
 * - Tag selectors: div, button
 */
export function isXPathSelector(selector: unknown): selector is string {
    if (typeof selector !== 'string') {
        return false
    }

    // Check for clear XPath patterns
    if (selector.startsWith('/') ||      // Absolute or descendant path: /html, //div
        selector.startsWith('../') ||    // Parent path
        selector.startsWith('./') ||     // Current context path
        selector.startsWith('*/')) {     // Descendant any type
        return true
    }

    // Check for grouped XPath expressions: (//...) or (/...) but not CSS pseudo-selectors like (:has)
    if (selector.startsWith('(')) {
        // Must contain XPath-like content (/ after opening paren or within)
        // CSS pseudo-selectors start with (: like (:has, (:is, etc.
        if (selector.startsWith('(:')) {
            return false
        }
        // Check if it looks like grouped XPath: (//...), (/...), or contains XPath operators
        return selector.includes('/') || selector.includes('@')
    }

    return false
}

/**
 * Checks if the browser is in native context.
 * MSPO only works in native context, not in webview context.
 *
 * @param browser - The browser instance to check
 * @returns True if in native context, false otherwise
 */
export function isNativeContext(browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser): boolean {
    if (!browser) {
        return false
    }

    try {
        // isNativeContext is a getter property on the browser object
        const browserWithNativeContext = browser as WebdriverIO.Browser & {
            isNativeContext?: boolean
        }

        // For MultiRemote, we need to check each browser instance
        if ('instances' in browser && Array.isArray(browser.instances)) {
            // MultiRemote is not supported yet - log warning and disable
            log.warn('Mobile Selector Performance Optimizer does not support MultiRemote sessions yet. Feature disabled for this session.')
            return false
        }

        return browserWithNativeContext.isNativeContext === true
    } catch {
        // If checking context fails, assume not native (fail safe)
        return false
    }
}

/**
 * Parses an optimized selector string into WebDriver using/value format
 */
export function parseOptimizedSelector(optimizedSelector: string): { using: string, value: string } | null {
    if (optimizedSelector.startsWith('~')) {
        // Accessibility ID
        return {
            using: 'accessibility id',
            value: optimizedSelector.substring(1)
        }
    }
    if (optimizedSelector.startsWith('-ios predicate string:')) {
        // iOS Predicate String
        return {
            using: '-ios predicate string',
            value: optimizedSelector.substring('-ios predicate string:'.length)
        }
    }
    if (optimizedSelector.startsWith('-ios class chain:')) {
        // iOS Class Chain
        return {
            using: '-ios class chain',
            value: optimizedSelector.substring('-ios class chain:'.length)
        }
    }
    return null
}

/**
 * Extracts matching elements from page source for debugging
 */
async function extractMatchingElementsFromPageSource(
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    using: string,
    value: string
): Promise<string[]> {
    try {
        const browserWithPageSource = browser as WebdriverIO.Browser & {
            getPageSource: () => Promise<string>
        }
        const pageSource = await browserWithPageSource.getPageSource()

        if (!pageSource || typeof pageSource !== 'string') {
            return []
        }

        const matchingElements: string[] = []

        if (using === '-ios predicate string') {
            // Parse predicate to find matching elements
            const typeMatch = value.match(/type\s*==\s*'([^']+)'/)
            const elementType = typeMatch ? typeMatch[1] : null

            // Extract attribute conditions (excluding 'type')
            const conditions: Array<{ attr: string, value: string }> = []
            const attrPattern = /(\w+)\s*==\s*'([^']+)'/g
            let attrMatch: RegExpExecArray | null
            while ((attrMatch = attrPattern.exec(value)) !== null) {
                if (attrMatch[1] !== 'type') {
                    conditions.push({ attr: attrMatch[1], value: attrMatch[2] })
                }
            }

            if (!elementType) {
                // No type specified, can't match
                return []
            }

            // Find matching elements by type
            const elementPattern = new RegExp(`<${elementType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'gi')

            let match: RegExpExecArray | null
            while ((match = elementPattern.exec(pageSource)) !== null) {
                const attrs = match[1] || ''
                let matches = true

                // Check attribute conditions (if any)
                for (const condition of conditions) {
                    const attrPattern = new RegExp(`${condition.attr}="([^"]*)"`, 'i')
                    const attrMatch = attrs.match(attrPattern)
                    if (!attrMatch || attrMatch[1] !== condition.value) {
                        matches = false
                        break
                    }
                }

                if (matches) {
                    matchingElements.push(match[0])
                }
            }
        } else if (using === '-ios class chain') {
            // Parse class chain to find matching elements
            const typeMatch = value.match(/^\*\*\/(\w+)/)
            const elementType = typeMatch ? typeMatch[1] : null

            if (elementType) {
                // Extract predicate conditions from backticks if present
                const predicateMatch = value.match(/\[`([^`]+)`\]/)
                const conditions: Array<{ attr: string, value: string }> = []

                if (predicateMatch) {
                    const predicateContent = predicateMatch[1]
                    const attrPattern = /(\w+)\s*==\s*"([^"]+)"/g
                    let attrMatch: RegExpExecArray | null
                    while ((attrMatch = attrPattern.exec(predicateContent)) !== null) {
                        conditions.push({ attr: attrMatch[1], value: attrMatch[2] })
                    }
                }

                const elementPattern = new RegExp(`<${elementType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^>]*)>`, 'gi')
                let match: RegExpExecArray | null
                while ((match = elementPattern.exec(pageSource)) !== null) {
                    const attrs = match[1] || ''
                    let matches = true

                    // Check attribute conditions if present
                    for (const condition of conditions) {
                        const attrPattern = new RegExp(`${condition.attr}="([^"]*)"`, 'i')
                        const attrMatch = attrs.match(attrPattern)
                        if (!attrMatch || attrMatch[1] !== condition.value) {
                            matches = false
                            break
                        }
                    }

                    if (matches) {
                        matchingElements.push(match[0])
                    }
                }
            }
        }

        return matchingElements
    } catch {
        return []
    }
}

/**
 * Tests an optimized selector and returns the element reference and duration
 * @param debug - If true, logs detailed debugging steps (for non-accessibility ID selectors)
 */
export async function testOptimizedSelector(
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser,
    using: string,
    value: string,
    isMultiple: boolean,
    debug: boolean = false
): Promise<{ elementRefs: Array<{ [key: string]: string }>, duration: number } | null> {
    try {
        if (debug) {
            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 1: Preparing to call findElement${isMultiple ? 's' : ''}()`)
            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 1.1: Using strategy: "${using}"`)
            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 1.2: Selector value: "${value}"`)
            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 1.3: Multiple elements: ${isMultiple}`)
        }

        const startTime = getHighResTime()
        const browserWithProtocol = browser as WebdriverIO.Browser & {
            findElement: (using: string, value: string) => Promise<{ [key: string]: string }>
            findElements: (using: string, value: string) => Promise<Array<{ [key: string]: string }>>
        }

        if (debug) {
            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 2: Executing findElement${isMultiple ? 's' : ''}(${JSON.stringify(using)}, ${JSON.stringify(value)})`)
        }

        let elementRefs: Array<{ [key: string]: string }> = []
        let duration: number

        if (isMultiple) {
            const result = await browserWithProtocol.findElements(using, value)
            duration = getHighResTime() - startTime
            elementRefs = Array.isArray(result) ? result : []

            if (debug) {
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3: findElements() completed`)
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.1: Found ${elementRefs.length} element(s)`)
                if (elementRefs.length > 0) {
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.2: Element reference(s): ${JSON.stringify(elementRefs)}`)
                } else {
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.2: No elements found - selector may not match any elements`)
                }
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.3: Execution time: ${duration.toFixed(2)}ms`)
            }
        } else {
            const result = await browserWithProtocol.findElement(using, value)
            duration = getHighResTime() - startTime

            // Check if result is an error object (has 'error' property) or a valid element reference
            const isError = result && typeof result === 'object' && 'error' in result
            const isValidElement = result && !isError && (('ELEMENT' in result) || ('element-6066-11e4-a52e-4f735466cecf' in result))

            elementRefs = isValidElement ? [result as { [key: string]: string }] : []

            if (debug) {
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3: findElement() completed`)
                if (isError) {
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.1: Element NOT found - error returned`)
                    const errorMsg = (result as { error?: string, message?: string }).message || (result as { error?: string }).error || 'Unknown error'
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.2: Error details: ${errorMsg}`)
                } else if (isValidElement) {
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.1: Element found successfully`)
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.2: Element reference: ${JSON.stringify(result)}`)
                } else {
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.1: No element found - selector may not match any element`)
                }
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.3: Execution time: ${duration.toFixed(2)}ms`)
            }
        }

        if (debug) {
            if (elementRefs.length > 0) {
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 4: Verification successful - selector is valid and found element(s)`)
            }
            if (elementRefs.length === 0) {
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 4: Verification failed - selector did not find any element(s)`)
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5: Collecting fresh page source to investigate...`)
                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.0: Searching for elements matching: ${using}="${value}"`)

                // Collect fresh page source and extract matching elements
                const matchingElements = await extractMatchingElementsFromPageSource(browser, using, value)

                if (matchingElements.length > 0) {
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.1: Found ${matchingElements.length} matching element(s) in fresh page source:`)
                    matchingElements.forEach((element, index) => {
                        // Truncate long element strings for readability
                        const truncated = element.length > 200 ? element.substring(0, 200) + '...' : element
                        console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.1.${index + 1}: ${truncated}`)
                    })
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.2: Retrying selector with fresh page source state...`)

                    // Retry once with fresh state
                    const retryStartTime = getHighResTime()
                    try {
                        if (isMultiple) {
                            const retryResult = await browserWithProtocol.findElements(using, value)
                            const retryDuration = getHighResTime() - retryStartTime
                            const retryElementRefs = Array.isArray(retryResult) ? retryResult : []

                            if (retryElementRefs.length > 0) {
                                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.3: Retry successful! Found ${retryElementRefs.length} element(s) in ${retryDuration.toFixed(2)}ms`)
                                return { elementRefs: retryElementRefs, duration: retryDuration }
                            }
                            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.3: Retry failed - still no elements found (${retryDuration.toFixed(2)}ms)`)
                        } else {
                            const retryResult = await browserWithProtocol.findElement(using, value)
                            const retryDuration = getHighResTime() - retryStartTime

                            const isError = retryResult && typeof retryResult === 'object' && 'error' in retryResult
                            const isValidElement = retryResult && !isError && (('ELEMENT' in retryResult) || ('element-6066-11e4-a52e-4f735466cecf' in retryResult))
                            const retryElementRefs = isValidElement ? [retryResult as { [key: string]: string }] : []

                            if (retryElementRefs.length > 0) {
                                console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.3: Retry successful! Found element in ${retryDuration.toFixed(2)}ms`)
                                return { elementRefs: retryElementRefs, duration: retryDuration }
                            }
                            const errorMsg = isError
                                ? ((retryResult as { error?: string, message?: string }).message || (retryResult as { error?: string }).error || 'Unknown error')
                                : 'No element found'
                            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.3: Retry failed - ${errorMsg} (${retryDuration.toFixed(2)}ms)`)
                        }
                    } catch (retryError) {
                        const retryDuration = getHighResTime() - retryStartTime
                        console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.3: Retry threw error: ${retryError instanceof Error ? retryError.message : String(retryError)} (${retryDuration.toFixed(2)}ms)`)
                    }
                } else {
                    console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 5.1: No matching elements found in fresh page source - element may have disappeared`)
                }
            }
        }

        return { elementRefs, duration }
    } catch (error) {
        if (debug) {
            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3: findElement${isMultiple ? 's' : ''}() threw an error`)
            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 3.1: Error: ${error instanceof Error ? error.message : String(error)}`)
            console.log(`${INDENT_LEVEL_2}🔬 [${LOG_PREFIX}: Debug] Step 4: Verification failed - selector execution error`)
        }
        return null
    }
}

/**
 * Finds an optimized selector for a given XPath
 */
export async function findOptimizedSelector(
    xpath: string,
    options: {
        usePageSource: boolean
        browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
        logPageSource?: boolean
    }
): Promise<XPathConversionResult | null> {
    if (options.usePageSource && options.browser) {
        if (options.logPageSource !== false) {
            console.log(`${INDENT_LEVEL_1}⏳ [${LOG_PREFIX}: Step 2] Collecting page source for dynamic analysis...`)
        }
        const pageSourceStartTime = getHighResTime()
        const result = await convertXPathToOptimizedSelector(xpath, {
            browser: options.browser,
            usePageSource: true
        })
        if (options.logPageSource !== false) {
            const pageSourceDuration = getHighResTime() - pageSourceStartTime
            console.log(`${INDENT_LEVEL_1}✅ [${LOG_PREFIX}: Step 2] Page source collected in ${pageSourceDuration.toFixed(2)}ms`)
        }
        return result
    }

    const staticResult = convertXPathToOptimizedSelector(xpath, {
        usePageSource: false
    })
    return staticResult instanceof Promise ? await staticResult : staticResult
}

/**
 * Formats selector locations into a human-readable string for CLI output.
 * Handles single, multiple, and no locations.
 */
export function formatSelectorLocations(locations: SelectorLocation[]): string {
    if (locations.length === 0) {
        return ''
    }

    if (locations.length === 1) {
        const loc = locations[0]
        const fileDisplay = loc.isPageObject ? `${loc.file} (page object)` : loc.file
        return ` at ${fileDisplay}:${loc.line}`
    }

    // Multiple locations found
    const locationStrings = locations.map(loc => {
        const fileDisplay = loc.isPageObject ? `${loc.file} (page object)` : loc.file
        return `${fileDisplay}:${loc.line}`
    })

    return ` at multiple locations:\n${INDENT_LEVEL_2}   - ${locationStrings.join(`\n${INDENT_LEVEL_2}   - `)}\n${INDENT_LEVEL_2}   Note: The selector was found in ${locations.length} files. Please verify which one is correct.`
}

/**
 * Logs the optimization conclusion
 */
export function logOptimizationConclusion(
    timeDifference: number,
    improvementPercent: number,
    originalSelector: string,
    optimizedSelector: string,
    locationInfo: string = ''
): void {
    const formattedOriginal = formatSelectorForDisplay(originalSelector)
    const formattedOptimized = formatSelectorForDisplay(optimizedSelector)
    const quoteStyle = optimizedSelector.startsWith('-ios class chain:') ? "'" : '"'

    if (timeDifference > 0) {
        console.log(`🚀 [${LOG_PREFIX}: Conclusion] Optimized selector is ${timeDifference.toFixed(2)}ms faster than XPath (${improvementPercent.toFixed(1)}% improvement)`)
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Advice] Consider using the optimized selector ${quoteStyle}${formattedOptimized}${quoteStyle} for better performance${locationInfo ? locationInfo : ''}.`)
    } else if (timeDifference < 0) {
        console.log(`⚠️ [${LOG_PREFIX}: Conclusion] Optimized selector is ${Math.abs(timeDifference).toFixed(2)}ms slower than XPath`)
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Advice] There is no improvement in performance, consider using the original selector '${formattedOriginal}' if performance is critical. If performance is not critical, you can use the optimized selector ${quoteStyle}${formattedOptimized}${quoteStyle} for better stability${locationInfo ? locationInfo : ''}.`)
    } else {
        console.log(`📊 [${LOG_PREFIX}: Conclusion] Optimized selector has the same performance as XPath`)
        console.log(`${INDENT_LEVEL_1}💡 [${LOG_PREFIX}: Advice] There is no improvement in performance, consider using the original selector '${formattedOriginal}' if performance is critical. If performance is not critical, you can use the optimized selector ${quoteStyle}${formattedOptimized}${quoteStyle} for better stability${locationInfo ? locationInfo : ''}.`)
    }
}

/**
 * Creates optimized selector performance data object
 */
export function createOptimizedSelectorData(
    testContext: TestContext,
    originalSelector: string,
    originalDuration: number,
    optimizedSelector: string,
    optimizedDuration: number
): SelectorPerformanceData {
    const timeDifference = originalDuration - optimizedDuration
    const improvementPercent = originalDuration > 0 ? (timeDifference / originalDuration) * 100 : 0

    return {
        testFile: testContext.testFile || 'unknown',
        suiteName: testContext.suiteName,
        testName: testContext.testName,
        lineNumber: testContext.lineNumber,
        selectorFile: testContext.selectorFile,
        selector: originalSelector,
        selectorType: 'xpath',
        duration: originalDuration,
        timestamp: Date.now(),
        optimizedSelector: optimizedSelector,
        optimizedDuration: optimizedDuration,
        improvementMs: timeDifference,
        improvementPercent: improvementPercent
    }
}

/**
 * Finds the most recent user command that hasn't been matched with an internal command yet
 */
export function findMostRecentUnmatchedUserCommand(
    commandTimings: Map<string, CommandTiming>
): [string, CommandTiming] | undefined {
    return Array.from(commandTimings.entries())
        .filter(([_id, timing]) => timing.isUserCommand && !timing.selectorType)
        .sort(([_idA, a], [_idB, b]) => b.startTime - a.startTime)[0]
}

/**
 * Finds the matching internal command timing entry for a given formatted selector and selector type
 */
export function findMatchingInternalCommandTiming(
    commandTimings: Map<string, CommandTiming>,
    formattedSelector: string,
    selectorType: string
): [string, CommandTiming] | undefined {
    return Array.from(commandTimings.entries())
        .filter(([_id, timing]) =>
            !timing.isUserCommand &&
            timing.formattedSelector === formattedSelector &&
            timing.selectorType === selectorType
        )
        .sort(([_idA, a], [_idB, b]) => b.startTime - a.startTime)[0]
}

/**
 * Stores performance data for a selector operation
 */
export function storePerformanceData(
    timing: CommandTiming,
    duration: number,
    testContext: TestContext
): void {
    const data: SelectorPerformanceData = {
        testFile: testContext.testFile || 'unknown',
        suiteName: testContext.suiteName,
        testName: testContext.testName,
        lineNumber: testContext.lineNumber,
        selector: timing.selector,
        selectorType: timing.selectorType!,
        duration,
        timestamp: Date.now()
    }

    addPerformanceData(data)
}

/**
 * Checks if a reporter with the given name is already registered in the config
 */
export function isReporterRegistered(reporters: Reporters.ReporterEntry[], reporterName: string): boolean {
    return reporters.some((reporter) => {
        if (Array.isArray(reporter)) {
            const reporterClass = reporter[0]
            if (typeof reporterClass === 'function') {
                return reporterClass.name === reporterName
            }
            return false
        }
        if (typeof reporter === 'function') {
            return reporter.name === reporterName
        }
        return false
    })
}

/**
 * Determines the report directory path using the fallback chain:
 * 1. reportPath from trackSelectorPerformance service options
 * 2. config.outputDir
 * 3. appiumServiceOptions.logPath
 * 4. appiumServiceOptions.args.log (directory from log file path)
 * 5. Throws error if none are set
 */
export function determineReportDirectory(
    reportPath?: string,
    config?: Options.Testrunner,
    appiumServiceOptions?: AppiumServiceConfig
): string {
    let reportDir: string | undefined

    if (reportPath) {
        reportDir = path.isAbsolute(reportPath) ? reportPath : path.join(process.cwd(), reportPath)
    } else if (config?.outputDir) {
        reportDir = path.isAbsolute(config.outputDir) ? config.outputDir : path.join(process.cwd(), config.outputDir)
    } else if (appiumServiceOptions?.logPath) {
        reportDir = path.isAbsolute(appiumServiceOptions.logPath)
            ? appiumServiceOptions.logPath
            : path.join(process.cwd(), appiumServiceOptions.logPath)
    } else if (appiumServiceOptions?.args?.log) {
        const logPath = appiumServiceOptions.args.log
        reportDir = path.isAbsolute(logPath) ? path.dirname(logPath) : path.join(process.cwd(), path.dirname(logPath))
    }

    if (!reportDir) {
        throw new SevereServiceError(
            'Mobile Selector Performance Optimizer: JSON report cannot be created. ' +
            'Please provide one of the following:\n' +
            '  1. reportPath in trackSelectorPerformance service options\n' +
            '  2. outputDir in WebdriverIO config\n' +
            '  3. logPath in Appium service options\n' +
            '  4. log in Appium service args'
        )
    }

    return reportDir
}


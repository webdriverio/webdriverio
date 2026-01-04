/**
 * Shared in-memory store for test context information
 * Used to share data between the MSPO reporter and service
 */

export interface TestContextInfo {
    testFile?: string
    suiteName?: string
    testName?: string
    timestamp: number
}

// In-memory store keyed by timestamp (for lookup by execution order)
// We use a Map to allow easy updates and lookups
const testContextStore = new Map<number, TestContextInfo>()

// Current context tracking
let currentSuiteName: string | undefined
let currentTestFile: string | undefined
let currentTestName: string | undefined

/**
 * Store test context information
 */
export function storeTestContext(context: TestContextInfo): void {
    testContextStore.set(context.timestamp, context)
}

/**
 * Get test context for a given timestamp
 */
export function getTestContext(timestamp: number): TestContextInfo | undefined {
    return testContextStore.get(timestamp)
}

/**
 * Find the most recent test context before or at a given timestamp
 */
export function findTestContextForTimestamp(timestamp: number): TestContextInfo | undefined {
    let closest: TestContextInfo | undefined
    let closestTime = 0

    for (const [ctxTimestamp, context] of testContextStore.entries()) {
        if (ctxTimestamp <= timestamp && ctxTimestamp > closestTime) {
            closest = context
            closestTime = ctxTimestamp
        }
    }

    return closest
}

/**
 * Update current suite name
 */
export function setCurrentSuiteName(suiteName: string): void {
    currentSuiteName = suiteName
}

/**
 * Get current suite name
 */
export function getCurrentSuiteName(): string | undefined {
    return currentSuiteName
}

/**
 * Update current test file
 */
export function setCurrentTestFile(testFile: string): void {
    currentTestFile = testFile
}

/**
 * Get current test file
 */
export function getCurrentTestFile(): string | undefined {
    return currentTestFile
}

/**
 * Update current test name
 */
export function setCurrentTestName(testName: string): void {
    currentTestName = testName
}

/**
 * Get current test name
 */
export function getCurrentTestName(): string | undefined {
    return currentTestName
}

/**
 * Clear the store (useful for cleanup)
 */
export function clearStore(): void {
    testContextStore.clear()
    currentSuiteName = undefined
    currentTestFile = undefined
    currentTestName = undefined
}


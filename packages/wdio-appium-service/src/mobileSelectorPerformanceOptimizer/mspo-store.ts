let currentSuiteName: string | undefined
let currentTestFile: string | undefined
let currentTestName: string | undefined

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
    currentSuiteName = undefined
    currentTestFile = undefined
    currentTestName = undefined
}


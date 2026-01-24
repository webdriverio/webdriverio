import type { SelectorPerformanceData } from './types.js'

let currentSuiteName: string | undefined
let currentTestFile: string | undefined
let currentTestName: string | undefined
let currentDeviceName: string | undefined
let performanceData: SelectorPerformanceData[] = []

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
 * Update current device name
 */
export function setCurrentDeviceName(deviceName: string): void {
    currentDeviceName = deviceName
}

/**
 * Get current device name
 */
export function getCurrentDeviceName(): string | undefined {
    return currentDeviceName
}

/**
 * Add performance data to the store
 */
export function addPerformanceData(data: SelectorPerformanceData): void {
    performanceData.push(data)
}

/**
 * Get all performance data
 */
export function getPerformanceData(): SelectorPerformanceData[] {
    return performanceData
}

/**
 * Clear all performance data
 */
export function clearPerformanceData(): void {
    performanceData = []
}

/**
 * Clear the store (useful for cleanup)
 */
export function clearStore(): void {
    currentSuiteName = undefined
    currentTestFile = undefined
    currentTestName = undefined
    currentDeviceName = undefined
    performanceData = []
}


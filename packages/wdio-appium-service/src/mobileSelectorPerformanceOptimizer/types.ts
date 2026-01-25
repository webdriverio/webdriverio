/**
 * Performance data for a selector operation
 */
export interface SelectorPerformanceData {
    testFile: string
    suiteName: string
    testName: string
    lineNumber?: number
    selectorFile?: string
    selector: string
    selectorType: string
    duration: number
    timestamp: number
    deviceName?: string
    optimizedSelector?: string
    optimizedDuration?: number
    improvementMs?: number
    improvementPercent?: number
}

/**
 * Timing information for a command execution
 */
export interface CommandTiming {
    startTime: number
    commandName: string
    selector: string
    formattedSelector: string
    selectorType?: string
    timingId: string
    isUserCommand: boolean
    lineNumber?: number
}

/**
 * Test context information
 */
export interface TestContext {
    testFile?: string
    suiteName: string
    testName: string
    lineNumber?: number
    selectorFile?: string
}

/**
 * Options for selector optimization
 */
export interface OptimizationOptions {
    browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    isReplacingSelector: { value: boolean }
    pageObjectPaths?: string[]
    provideSelectorLocation?: boolean
}


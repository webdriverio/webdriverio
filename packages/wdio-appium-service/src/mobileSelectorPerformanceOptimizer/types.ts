/**
 * Performance data for a selector operation
 */
export interface SelectorPerformanceData {
    testFile: string
    suiteName: string
    testName: string
    lineNumber?: number
    selector: string
    selectorType: string
    duration: number
    timestamp: number
    // Optimized selector information (when replaceWithOptimizedSelector is enabled)
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
}

/**
 * Test context information
 */
export interface TestContext {
    testFile?: string
    suiteName: string
    testName: string
    lineNumber?: number
}

/**
 * Options for selector optimization
 */
export interface OptimizationOptions {
    usePageSource: boolean
    browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    isReplacingSelector: { value: boolean }
    isSilentLogLevel?: boolean
}


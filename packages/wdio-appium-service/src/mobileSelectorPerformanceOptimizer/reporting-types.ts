/**
 * Timing information for the test run
 */
export interface RunTimingInfo {
    startTime: number
    endTime: number
    totalRunDurationMs: number
}

/**
 * Report options for controlling output formats
 */
export interface ReportOptions {
    /**
     * Enable CLI report output to terminal
     * @default false
     */
    enableCliReport?: boolean
    /**
     * Enable markdown report file generation
     * @default false
     */
    enableMarkdownReport?: boolean
}

/**
 * Grouped optimization data for reporting
 */
export interface GroupedOptimization {
    selector: string
    optimizedSelector: string
    improvementMs: number
    improvementPercent: number
    lineNumber?: number
    selectorFile?: string
    testFile: string
    usageCount: number
    duration?: number
    optimizedDuration?: number
}

/**
 * File-based grouping with subtotals for reporting
 */
export interface FileGroup {
    filePath: string
    optimizations: GroupedOptimization[]
    totalSavingsMs: number  // Per-use savings sum (for display)
    totalSavingsWithUsage: number  // True total = sum(improvementMs × usageCount)
}

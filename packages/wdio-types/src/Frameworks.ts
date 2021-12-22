export interface Suite {
    type: string
    title: string
    parent: string
    fullTitle: string
    pending: boolean
    file: string
    error?: any
    duration?: number
}

export interface Test extends Suite {
    fullName: string
    fn?: Function
    body?: string
    async?: number
    sync?: boolean
    timedOut?: boolean
    ctx: any

    /**
     * Mocha flags
     */
    description?: string
    _retriedTest?: any
    _currentRetry?: number
    _retries?: number
}

export interface TestResult {
    error?: any
    result?: any
    passed: boolean
    duration: number
    retries: { limit: number, attempts: number }
    exception: string
    status: string
}

export interface Results {
    finished: number
    passed: number
    failed: number
}

export interface World {
    pickle: {
        name?: string
    }
    result?: {
        duration: {
            seconds: number
            nanos: number
        }
        status: 'UNKNOWN' | 'PASSED' | 'SKIPPED' | 'PENDING' | 'UNDEFINED' | 'AMBIGUOUS' | 'FAILED'
        message?: string
        willBeRetried: boolean
    }
}

/**
 * Result of a pick (scenario or step)
 */
export interface PickleResult {
    /**
     * true if scenario has passed
     */
    passed: boolean
    /**
     * error stack if scenario failed
     */
    error?: string
    /**
     * duration of scenario in milliseconds
     */
    duration?: number
}

/**
 * Info on of a pick (step)
 */
export interface PickleStep {
    /**
     * line number in the feature file
     */
    id: string
    /**
     * text of the step
     */
    text: string
    /**
     * Array of line numbers
     */
    astNodeIds: string[]
    /**
     * 'Given|When|Then|And' followed by a space
     */
    keyword: string
}

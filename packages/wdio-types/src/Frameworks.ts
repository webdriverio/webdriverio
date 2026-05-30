/* eslint-disable @typescript-eslint/no-explicit-any */
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

export interface TestRetries {
    limit: number
    attempts: number
}

export interface TestResult {
    error?: any
    result?: any
    passed: boolean
    duration: number
    retries: TestRetries
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
 * Info of a pickle (step)
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
    keyword: 'Given ' | 'When ' | 'Then ' | 'And '
}

/**
 * Info of a cucumber tag
 */
export interface Tag {
    /**
     * name of the tag
     */
    name: string
    /**
     * line number in the feature file
     */
    astNodeId: string
}

/**
 * Info of a cucumber scenario
 */
export interface Scenario {
    /**
     * line number in the feature file
     */
    id: string
    /**
     * uri of the feature file
     */
    uri: string
    /**
     * name of the scenario
     */
    name: string
    /**
     * Array of line numbers
     */
    astNodeIds: string[]
    /**
     * Array of steps
     */
    steps: PickleStep[]
    /**
     * Array of tags
     */
    tags: Tag[]
}

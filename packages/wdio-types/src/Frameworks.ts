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
        status?: number
        message?: string
    }
}

export type Framework = 'mocha' | 'jasmine' | 'cucumber'

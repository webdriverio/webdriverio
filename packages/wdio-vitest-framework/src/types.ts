export interface VitestOpts {
    /**
     * Include globs for test files.
     */
    include?: string[]
    /**
     * Exclude globs for test files.
     */
    exclude?: string[]
    /**
     * Test timeout in milliseconds.
     * @default 10000
     */
    testTimeout?: number
    /**
     * Hook timeout in milliseconds.
     * @default 10000
     */
    hookTimeout?: number
    /**
     * Number of times to retry a failing test.
     * @default 0
     */
    retry?: number
    /**
     * Defines how hooks should be ordered.
     */
    sequence?: {
        hooks?: 'stack' | 'list' | 'parallel'
    }
    /**
     * Maximum number of concurrent tests.
     * @default 5
     */
    maxConcurrency?: number
    /**
     * Pass with no tests found.
     * @default false
     */
    passWithNoTests?: boolean
    /**
     * Glob or regexp pattern to filter test names.
     */
    grep?: string | RegExp
    /**
     * Setup files to run before tests.
     */
    setupFiles?: string[]
}

export interface FrameworkMessage {
    type: string
    cid?: string
    specs?: string[]
    uid?: string
    title?: string
    parent?: string
    fullTitle?: string
    pending?: boolean
    passed?: boolean
    file?: string
    duration?: number
    error?: ErrorInfo
    body?: string
}

export interface ErrorInfo {
    name: string
    message: string
    stack: string
    type: string
    expected?: unknown
    actual?: unknown
}


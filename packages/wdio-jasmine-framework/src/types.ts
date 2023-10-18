export interface ReporterOptions {
    cid: string
    specs: string[]
    cleanStack?: boolean,
    jasmineOpts: JasmineOpts
}

export interface ParentSuite {
    description: string
    id: string
    tests: number
}

export interface SuiteEvent extends jasmine.SuiteResult {
    type: 'suite'
    start: Date,
    duration: number | null,
    errors?: jasmine.FailedExpectation[],
    error?: jasmine.FailedExpectation,
    filename?: string
}

export interface TestEvent extends jasmine.SpecResult {
    type: 'test' | 'hook'
    start: Date,
    duration: number | null,
    errors?: jasmine.FailedExpectation[],
    error?: jasmine.FailedExpectation,
    filename?: string
}

export interface ResultHandlerPayload {
    passed: boolean
    message?: string
    error?: Error
}

export interface FrameworkMessage {
    type: string
    payload?: any
    err?: jasmine.FailedExpectation
}

export interface FormattedMessage {
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
    currentTest?: string
    error?: jasmine.FailedExpectation
    context?: any

    /**
     * jasmine specific
     */
    fullName?: string
    errors?: jasmine.FailedExpectation[]
}

export interface JasmineOpts {
    /**
     * Default Timeout Interval for Jasmine operations.
     * @default 60000
     */
    defaultTimeoutInterval?: number
    /**
     * Array of filepaths (and globs) relative to spec_dir to include before jasmine specs.
     * @default []
     */
    helpers?: string[]
    /**
     * The `requires` option is useful when you want to add or extend some basic functionality.
     * @default []
     */
    requires?: string[]
    /**
     * Whether to randomize spec execution order.
     * @default true
     */
    random?: boolean
    /**
     * Seed to use as the basis of randomization. Null causes the seed to be determined randomly at the start of execution.
     * @since v3.3.0
     */
    seed?: Function
    /**
     * Whether to stop execution of the suite after the first spec failure.
     * @default false
     * @since v3.3.0
     * @deprecated Use the `stopOnSpecFailure` config property instead.
     */
    failFast?: boolean
    /**
     * Whether to fail the spec if it ran no expectations. By default a spec that ran no expectations is reported as passed.
     * Setting this to true will report such spec as a failure.
     * @default false
     * @since v3.5.0
     */
    failSpecWithNoExpectations?: boolean
    /**
     * Whether to cause specs to only have one expectation failure.
     * @default false
     * @since v3.3.0
     */
    oneFailurePerSpec?: boolean
    /**
     * Function to use to filter specs.
     * @since v3.3.0
     */
    specFilter?: () => boolean
    /**
     * Only run tests matching this string or regexp. (Only applicable if no custom `specFilter` function is set)
     */
    grep?: string | RegExp
    /**
     * If true it inverts the matching tests and only runs tests that don't match with the expression used in `grep`.
     * (Only applicable if no custom `specFilter` function is set)
     * @default false
     */
    invertGrep?: boolean
    /**
     * Clean up stack trace and remove all traces of node module packages.
     * @default false
     */
    cleanStack?: boolean
    /**
     * Stops test suite (`describe`) execution on first spec (`it`) failure (other suites continue running)
     * @default false
     */
    stopOnSpecFailure?: boolean
    /**
     * Stops a spec (`it`) execution on a first expectation failure (other specs continue running)
     * @default false
     */
    stopSpecOnExpectationFailure?: boolean
    /**
     * The Jasmine framework allows it to intercept each assertion in order to log the state of the application
     * or website depending on the result. For example it is pretty handy to take a screenshot every time
     * an assertion fails.
     */
    expectationResultHandler?: (passed: boolean, data: ResultHandlerPayload) => void
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** The kind of a hook, as a framework sends it in its hook events. @experimental */
export type HookKind = 'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll' | 'beforeStep' | 'afterStep'

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
    skipped?: boolean
}

export interface Results {
    finished: number
    passed: number
    failed: number
}

export interface World {
    pickle: {
        /**
         * the same for every attempt of a retried scenario
         */
        id?: string
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

export interface FrameworkLaunchParams {
    config: WebdriverIO.Config
    /** Resolved absolute spec file paths, after `--spec` and `exclude` filtering. */
    specs: string[]
    configFile: string
    /** CLI arguments the launcher was started with, so framework workers can rebuild the same config. */
    args?: Record<string, unknown>
    /** Aborted when the launcher receives SIGINT/SIGTERM. The framework must cancel its run and resolve. */
    signal?: AbortSignal
    /** Receives the job and reporter events the CLI needs to render the run. */
    onEvent?: (event: FrameworkLaunchEvent) => void
}

export type FrameworkLaunchEvent =
    | { type: 'job:start', cid: string, caps: WebdriverIO.Capabilities, specs: string[] }
    | { type: 'job:end', cid: string, passed: boolean }
    | { type: 'message', message: unknown }

/**
 * Frameworks that schedule specs themselves export `launch`. The CLI then
 * calls it in the launcher process instead of starting WDIO workers.
 *
 * @experimental Internal to first-party frameworks (the CLI only honors an
 * allowlist). The contract may change in any release, without a major version.
 */
export interface FrameworkLauncher {
    /** @returns number of failures, `0` when the run passed */
    launch(params: FrameworkLaunchParams): Promise<number>
}

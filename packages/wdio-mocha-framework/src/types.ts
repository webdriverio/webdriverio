export { default } from 'mocha'

export interface MochaOpts {
    /**
     * Enable parallel test execution within a spec file. Each `it()` block
     * runs simultaneously in its own browsing context (window). Requires a
     * WebDriver Bidi session AND the `'wdio:experimentalBiDiCommands': true`
     * capability; if either is missing, tests run sequentially with a warning.
     *
     * - `'contexts'`: windows share the default user context, so cookies,
     *   localStorage and service workers are shared across concurrent tests.
     * - `'userContexts'`: each test gets its own user context, so storage is
     *   isolated per test. Every test pays its own login cost. Throws if the
     *   driver does not support `browser.createUserContext`.
     *
     * In both modes `browser.mock()` inside a test only intercepts that
     * test's context. `before()`/`after()` run once per test, only
     * `mochaOpts.timeout` applies, and `bail`/`retries` are not supported.
     *
     * @see https://webdriver.io/docs/parallel-tests
     * @default undefined (sequential execution)
     */
    parallelMode?: 'contexts' | 'userContexts'

    /**
     * Maximum number of browsing contexts (windows) to use in parallel.
     * Runs a pool of this many slots, each running one test at a time in its
     * own window. A slot opens its next window while its test runs and closes
     * the previous one in the background, so up to three times this many
     * windows can be open briefly.
     * @default os.cpus().length
     */
    maxParallelContexts?: number

    /**
     * The `require` option is useful when you want to add or extend some
     * basic functionality (WebdriverIO framework option).
     */
    require?: string[],
    /**
     * Propagate uncaught errors?
     */
    allowUncaught?: boolean;
    /**
     * Force done callback or promise?
     */
    asyncOnly?: boolean;
    /**
     * Bail after first test failure?
     */
    bail?: boolean;
    /**
     * Check for global variable leaks?
     */
    checkLeaks?: boolean;
    /**
     * Delay root suite execution?
     */
    delay?: boolean;
    /**
     * Report tests skipped by a failing `before` or `beforeEach` hook as failed.
     * WebdriverIO defaults this to `true`.
     */
    failHookAffectedTests?: boolean;
    /**
     * Test filter given string.
     */
    fgrep?: string;
    /**
     * Tests marked only fail the suite?
     */
    forbidOnly?: boolean;
    /**
     * Pending tests fail the suite?
     */
    forbidPending?: boolean;
    /**
     * Full stacktrace upon failure?
     */
    fullTrace?: boolean;
    /**
     * Variables expected in global scope.
     */
    global?: string[];
    /**
     * Test filter given regular expression.
     */
    grep?: RegExp | string;
    /**
     * Invert test filter matches?
     */
    invert?: boolean;
    /**
     * Number of times to retry failed tests.
     */
    retries?: number;
    /**
     * Timeout threshold value.
     */
    timeout?: number | string;
    /**
     * Set test UI to one of the built-in test interfaces.
     */
    ui?: 'bdd' | 'tdd' | 'qunit' | 'exports';
}

export interface MochaError {
    name: string
    message: string
    stack: string
    type: string
    expected: unknown
    actual: unknown
}

export interface FrameworkMessage {
    type: string
    payload?: unknown
    err?: MochaError
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
    error?: MochaError
    context?: unknown
    body?: string
    /** the kind of a hook event, as `@wdio/reporter` reads it. @experimental */
    hookKind?: 'beforeAll' | 'beforeEach' | 'afterEach' | 'afterAll'
    /** the uid of the suite that declares an all-hook. @experimental */
    hookSuiteUid?: string
}

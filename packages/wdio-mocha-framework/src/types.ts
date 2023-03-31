export { default } from 'mocha'

export interface MochaOpts {
    /**
     * The `require` option is useful when you want to add or extend some
     * basic functionality (WebdriverIO framework option).
     */
    require?: string[],
    /**
     * Use the given module(s) to compile files. Compilers will be included
     * before requires (WebdriverIO framework option).
     */
    compilers?: string[],
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
    expected: any
    actual: any
}

export interface FrameworkMessage {
    type: string
    payload?: any
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
    context?: any
}

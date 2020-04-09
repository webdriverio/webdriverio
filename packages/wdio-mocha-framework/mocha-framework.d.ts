/// <reference types="mocha"/>

declare module WebdriverIO {
    interface Config extends MochaOpts {}

    interface Suite {
        file: string;
        title: string;
        parent: string;
        fullTitle: string;
        pending: boolean;
    }

    interface Test extends Suite {
        currentTest: string;
        passed: boolean;
        duration?: number;
        error?: {
            actual?: any;
            expected?: any;
            message: string;
            stack?: string;
            type: string;
        }
    }
}

interface MochaOpts {
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
}

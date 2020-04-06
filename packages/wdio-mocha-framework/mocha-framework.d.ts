/// <reference types="mocha"/>

declare namespace WebdriverIO {
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

declare module "@wdio/mocha-framework" {
    export default WebdriverIO
}

declare module "webdriverio" {
    interface Options {
        mochaOpts?: MochaOpts;
    }
}

declare module "@wdio/sync" {
    interface Options {
        mochaOpts?: MochaOpts;
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
     * Color TTY output from reporter?
     */
    color?: boolean;
    /**
     * Delay root suite execution?
     */
    delay?: boolean;
    /**
     * Show diff on failure?
     */
    diff?: boolean;
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
     * Enable desktop notifications?
     */
    growl?: boolean;
    /**
     * Display inline diffs?
     */
    inlineDiffs?: boolean;
    /**
     * Invert test filter matches?
     */
    invert?: boolean;
    /**
     * Disable syntax highlighting?
     */
    noHighlighting?: boolean;
    /**
     * Reporter name or constructor.
     */
    reporter?: string | Function;
    /**
     * Reporter settings object.
     */
    reporterOption?: object;
    /**
     * Number of times to retry failed tests.
     */
    retries?: number;
    /**
     * Slow threshold value.
     */
    slow?: number;
    /**
     * Timeout threshold value.
     */
    timeout?: number | string;
    /**
     * Interface name.
     */
    ui?: string;
}

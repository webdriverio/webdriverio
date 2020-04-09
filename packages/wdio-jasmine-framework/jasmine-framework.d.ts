/// <reference types="jasmine"/>

declare namespace WebdriverIO {
    interface Suite {
        title: string;
        fullName: string;
        file: string;
    }

    interface Test extends Suite {
        parent: string;
        passed: boolean;
    }
}

declare module "webdriverio" {
    interface Options {
        jasmineNodeOpts?: JasmineNodeOpts;
    }
}

declare module "@wdio/sync" {
    interface Options {
        jasmineNodeOpts?: JasmineNodeOpts;
    }
}

declare module "@wdio/jasmine-framework" {
    export default WebdriverIO
}

interface JasmineNodeOpts {
    /**
     * Whether to stop execution of the suite after the first spec failure
     * Since Jasmine v3.3.0
     * @default false
     */
    failFast?: boolean;
    /**
     * Whether to fail the spec if it ran no expectations. By default a spec
     * that ran no expectations is reported as passed. Setting this to true
     * will report such spec as a failure.
     * Since Jasmine v3.5.0
     * @default false
     */
    failSpecWithNoExpectations?: boolean;
    /**
     * Whether to cause specs to only have one expectation failure.
     * Since Jasmine v3.3.0
     * @default false
     */
    oneFailurePerSpec?: boolean;
    /**
     * Whether to randomize spec execution order.
     * Since Jasmine v3.3.0
     * @default false
     */
    random?: boolean;
    /**
     * Seed to use as the basis of randomization. Null causes the seed to be
     * determined randomly at the start of execution.
     * Since Jasmine v3.3.0
     * @default null
     */
    seed?: Function;
    /**
     * Function to use to filter specs.
     * Since Jasmine v3.3.0
     * @default true
     */
    specFilter?: Function;
}

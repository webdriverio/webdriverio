/// <reference types="jasmine"/>
/// <reference types="expect-webdriverio/jasmine"/>

declare module WebdriverIO {
    interface Config extends JasmineNodeOptsConfig {}

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

interface JasmineNodeOptsConfig {
    jasmineNodeOpts?: JasmineNodeOpts;
}

interface JasmineNodeOpts {
    /**
     * Default Timeout Interval for Jasmine operations.
     * @default `60000`
     */
    defaultTimeoutInterval?: number;
    /**
     * Array of filepaths (and globs) relative to spec_dir to include before
     * jasmine specs.
     * @default `[]`
     */
    helpers?: string[];
    /**
     * The `requires` option is useful when you want to add or extend some
     * basic functionality.
     * @default `[]`
     */
    requires?: string[];
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
    /**
     * Optional pattern to selectively select it/describe cases to run from spec files.
     * @default null
     */
    grep?: string | RegExp
    /**
     * Inverts 'grep' matches.
     * @default null
     */
    invertGrep?: string | RegExp
}

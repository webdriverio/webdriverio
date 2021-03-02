declare module WebdriverIO {
    interface ServiceOption extends BrowserstackConfig {}

    interface Suite {
        title: string;
        fullName: string;
        file: string;
    }

    interface Test extends Suite {
        parent: string;
        passed: boolean;
    }

    interface TestResult {
        exception: string;
        status: string;
    }
}

interface BrowserstackConfig {
    /**
     * Set this to true to enable routing connections from Browserstack cloud through your computer.
     * You will also need to set `browserstack.local` to true in browser capabilities.
     */
    browserstackLocal?: boolean;
    /**
     * Cucumber only. Set this to true to enable updating the session name to the Scenario name if only
     * a single Scenario was ran. Useful when running in parallel
     * with [wdio-cucumber-parallel-execution](https://github.com/SimitTomar/wdio-cucumber-parallel-execution).
     */
    preferScenarioName?: boolean;
    /**
     * Set this to true to kill the browserstack process on complete, without waiting for the
     * browserstack stop callback to be called. This is experimental and should not be used by all.
     */
    forcedStop?: boolean;
    /**
     * Specified optional will be passed down to BrowserstackLocal. See this list for details:
     * https://stackoverflow.com/questions/39040108/import-class-in-definition-file-d-ts
     */
    opts?: Partial<import('browserstack-local').Options>
}

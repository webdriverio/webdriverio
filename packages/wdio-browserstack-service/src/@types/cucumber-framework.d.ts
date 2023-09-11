declare module WebdriverIO {
    interface Config extends CucumberOptsConfig {}

    interface Browser {
        getAccessibilityResultsSummary: any,
        getAccessibilityResults: any
    }

    interface MultiRemoteBrowser {
        getAccessibilityResultsSummary: any,
        getAccessibilityResults: any
    }
}

interface CucumberOptsConfig {
    cucumberOpts?: CucumberOpts
}

interface CucumberOpts {
    /**
     * Fail if there are any undefined or pending steps
     * @default false
     */
    strict?: boolean
}

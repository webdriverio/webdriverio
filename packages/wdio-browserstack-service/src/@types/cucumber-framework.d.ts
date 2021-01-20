declare module WebdriverIO {
    interface Config extends CucumberOptsConfig {}
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

declare module WebdriverIO {
    interface Config extends BrowserstackConfig {}
}

interface BrowserstackConfig {
    browserstackLocal?: boolean;
    browserstackLocalForcedStop?: boolean;
    // https://stackoverflow.com/questions/39040108/import-class-in-definition-file-d-ts
    browserstackOpts?: Partial<import('browserstack-local').Options>
}

declare module "webdriverio" {
    interface ServiceOption extends BrowserstackConfig {}
}

declare module "@wdio/sync" {
    interface ServiceOption extends BrowserstackConfig {}
}

interface BrowserstackConfig {
    browserstackLocal?: boolean;
    forcedStop?: boolean;
    // https://stackoverflow.com/questions/39040108/import-class-in-definition-file-d-ts
    opts?: Partial<import('browserstack-local').Options>
}

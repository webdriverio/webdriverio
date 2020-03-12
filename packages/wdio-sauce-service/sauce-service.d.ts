declare module "webdriverio" {
    interface ServiceOption extends SauceServiceConfig {}
}

declare module "@wdio/sync" {
    interface ServiceOption extends SauceServiceConfig {}
}

interface SauceServiceConfig {
    sauceConnect?: boolean;
    sauceConnectOpts?: object;
    scRelay?: boolean;
}

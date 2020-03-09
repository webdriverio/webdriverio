import { Options } from "browserstack-local";

declare module "webdriverio" {
    interface Config extends BrowserstackConfig {}
}

declare module "@wdio/sync" {
    interface Config extends BrowserstackConfig {}
}

interface BrowserstackConfig {
    browserstackLocal?: boolean;
    browserstackLocalForcedStop?: boolean;
    browserstackOpts?: Partial<Options>
}

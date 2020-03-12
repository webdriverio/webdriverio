import { Options } from "browserstack-local";

declare module "webdriverio" {
    interface ServiceOption extends BrowserstackConfig {}
}

declare module "@wdio/sync" {
    interface ServiceOption extends BrowserstackConfig {}
}

interface BrowserstackConfig {
    browserstackLocal?: boolean;
    forcedStop?: boolean;
    opts?: Partial<Options>
}

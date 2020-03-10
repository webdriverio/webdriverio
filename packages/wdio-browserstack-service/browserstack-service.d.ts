import { Options } from "browserstack-local";

declare module WebdriverIOAsync {
    interface Config extends BrowserstackConfig {}
}

declare module WebdriverIO {
    interface Config extends BrowserstackConfig {}
}

interface BrowserstackConfig {
    browserstackLocal?: boolean;
    browserstackLocalForcedStop?: boolean;
    browserstackOpts?: Partial<Options>
}

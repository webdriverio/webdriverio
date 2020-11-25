
export type Hooks = {
    [k in keyof WebdriverIO.HookFunctions]: WebdriverIO.HookFunctions[k] | NonNullable<WebdriverIO.HookFunctions[k]>[];
}

export type Capabilities = (WebDriver.DesiredCapabilities | WebDriver.W3CCapabilities)[] | WebdriverIO.MultiRemoteCapabilities;

export interface ConfigOptions extends Omit<WebdriverIO.Config, 'capabilities' | keyof WebdriverIO.Hooks>, Hooks {
    automationProtocol?: 'webdriver' | 'devtools'
    spec?: string[]
    suite?: string[]
    capabilities?: Capabilities
    specFileRetryAttempts?: number
    cucumberFeaturesWithLineNumbers?: string[]
}

export type DefaultOptions<T> = {
    [k in keyof T]?: {
        type: 'string' | 'number' | 'object' | 'boolean' | 'function'
        default?: T[k]
        required?: boolean
        validate?: (option: T[k]) => void
        match?: RegExp
    }
}

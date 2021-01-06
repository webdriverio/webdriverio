import { DesiredCapabilities, W3CCapabilities } from 'webdriver'
import { HookFunctions, MultiRemoteCapabilities, Config } from 'webdriverio'

export type Hooks = {
    [k in keyof HookFunctions]: HookFunctions[k] | NonNullable<HookFunctions[k]>[];
}

export type Capabilities = (DesiredCapabilities | W3CCapabilities)[] | MultiRemoteCapabilities;
export type Capability = DesiredCapabilities | W3CCapabilities | MultiRemoteCapabilities;

export interface ConfigOptions extends Omit<Config, 'capabilities' | keyof Hooks>, Hooks {
    automationProtocol?: 'webdriver' | 'devtools' | './protocol-stub'
    /**
     * specs defined as CLI argument
     */
    spec?: string[]
    /**
     * specs defined within the config file
     */
    specs?: string[]
    exclude?: string[]
    suite?: string[]
    suites?: Record<string, string[]>
    capabilities?: Capabilities
    specFileRetryAttempts?: number
    cucumberFeaturesWithLineNumbers?: string[]
    specFileRetriesDeferred?: boolean
    specFileRetries?: number
    maxInstances?: number
    watch?: boolean
}

export interface SingleConfigOption extends Omit<ConfigOptions, 'capabilities'> {
    capabilities: Capability
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

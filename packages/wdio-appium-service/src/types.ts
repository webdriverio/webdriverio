export type AppiumServerArguments = {
    [capability: string]: any
    /**
     * Port to listen on
     */
    port?: number | string
    basePath?: string
}

export interface AppiumSessionCapabilities  {
    /**
     * Default session parameters
     */
    port?: number
    protocol?: string
    hostname?: string
    path?: string
}

export interface AppiumServiceConfig {
    /**
     * Path where all logs from the Appium server should be stored.
     */
    logPath?: string
    /**
     * To use your own installation of Appium, e.g. globally installed, specify the command which should be started.
     * @default "node"
     */
    command?: string
    /**
     * Map of arguments for the Appium server, passed directly to `appium`.
     * @default {}
     */
    args?: AppiumServerArguments
}

export type ArgValue = string | number | boolean | null
export type KeyValueArgs = { [key: string]: ArgValue }

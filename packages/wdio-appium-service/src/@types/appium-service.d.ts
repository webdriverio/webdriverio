/// <reference types="webdriver"/>
/// <reference types="webdriverio"/>

declare module WebdriverIO {
    interface ServiceOption extends AppiumServiceConfig {}
}

type ArgValue = string | number | boolean | null

type AppiumServerArguments = {
    [capability: string]: any
    /**
     * Port to listen on
     */
    port?: number | string
}

type KeyValueArgs = {
    [key: string]: ArgValue
}

interface AppiumServiceConfig {
    /**
     * Path where all logs from the Appium server should be stored.
     */
    logPath?: string;
    /**
     * To use your own installation of Appium, e.g. globally installed, specify the command which should be started.
     */
    command?: string;
    /**
     * Map of arguments for the Appium server, passed directly to `appium`.
     */
    args?: AppiumServerArguments | Array<string>
}

type Config = {
    outputDir?: string
    [key: string]: any
}


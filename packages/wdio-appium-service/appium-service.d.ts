declare module WebdriverIO {
    interface ServiceOption extends AppiumServiceConfig {}
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
    args?: object | Array<string>;
}

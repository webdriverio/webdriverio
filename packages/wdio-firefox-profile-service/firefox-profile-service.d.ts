declare module WebdriverIO {
    interface ServiceOption extends FirefoxProfileConfig {}
}

interface FirefoxProfileConfig {
    /**
     * Add one or multiple extensions to the browser session. All entries can be either
     * an absolute path to the `.xpi` file or the path to an unpacked Firefox extension directory.
     */
    extensions?: Array<string>;
    /**
     * Create Firefox profile based on an existing one by setting an absolute path to that profile.
     */
    profileDirectory?: string;
    /**
     * Set network proxy settings.
     */
    proxy?: object;
    /**
     * Please set this flag to `true` if you use Firefox v55 or lower.
     */
    legacy?: boolean;
}

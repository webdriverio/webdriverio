declare module WebdriverIO {
    interface ServiceOption extends SeleniumStandaloneOptions {}
}

interface SeleniumStandaloneOptions {
    /**
     * Path where all logs from the Selenium server should be stored.
     */
    logs?: string;
    /**
     * Map of arguments for the Selenium server, passed directly to `Selenium.start()`.
     * Please note that latest drivers have to be installed, see `seleniumInstallArgs`.
     */
    installArgs?: Partial<import('selenium-standalone').InstallOpts>;
    /**
     * Map of arguments for the Selenium server, passed directly to `Selenium.install()`.
     *
     * By default, versions will be installed based on what is set in the selenium-standalone
     * package. The defaults can be overridden by specifying the versions.
     */
    args?: Partial<import('selenium-standalone').StartOpts>;
    /**
     * Boolean for skipping `selenium-standalone` server install.
     */
    skipSeleniumInstall?: boolean;
}

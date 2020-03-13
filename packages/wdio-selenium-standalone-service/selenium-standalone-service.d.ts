import { InstallOpts, StartOpts } from "selenium-standalone";

declare module WebdriverIO {
    interface Config extends BaseConfig {}
}

interface BaseConfig {
    /**
     * Path where all logs from the Selenium server should be stored.
     */
    logs?: string;
    /**
     * Map of arguments for the Selenium server, passed directly to `Selenium.start()`.
     * Please note that latest drivers have to be installed, see `seleniumInstallArgs`.
     */
    installArgs?: InstallOpts;
    /**
     * Map of arguments for the Selenium server, passed directly to `Selenium.install()`.
     *
     * By default, versions will be installed based on what is set in the selenium-standalone
     * package. The defaults can be overridden by specifying the versions.
     */
    args?: StartOpts;
    /**
     * Boolean for skipping `selenium-standalone` server install.
     */
    skipSeleniumInstall?: boolean;
}

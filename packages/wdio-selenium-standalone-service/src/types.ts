import type { InstallOpts, StartOpts } from 'selenium-standalone'

export interface SeleniumStandaloneOptions {
    /**
     * Path where all logs from the Selenium server should be stored.
     */
    logs?: string
    /**
     * Map of arguments for the Selenium server, passed directly to `Selenium.start()`.
     * Please note that latest drivers have to be installed, see `seleniumInstallArgs`.
     */
    installArgs?: Partial<InstallOpts>
    /**
     * Map of arguments for the Selenium server, passed directly to `Selenium.install()`.
     *
     * By default, versions will be installed based on what is set in the selenium-standalone
     * package. The defaults can be overridden by specifying the versions.
     */
    args?: Partial<StartOpts>
    /**
     * Boolean for skipping `selenium-standalone` server install.
     */
    skipSeleniumInstall?: boolean
    /**
     * simplified way to pass browser driver versions
     */
    drivers?: {
        chrome?: string | boolean
        firefox?: string | boolean
        chromiumedge?: string | boolean
        ie?: string | boolean
        edge?: string | boolean
    }
}

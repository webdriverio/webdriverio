import { InstallOpts, StartOpts } from "selenium-standalone";

declare namespace WebdriverIO {
    interface Config {
        seleniumLogs?: string;
        seleniumInstallArgs?: InstallOpts;
        seleniumArgs?: StartOpts;
        skipSeleniumInstall?: boolean;
    }
}

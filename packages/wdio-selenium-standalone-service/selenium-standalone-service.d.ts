import { InstallOpts, StartOpts } from "selenium-standalone";

declare module "webdriverio" {
    interface Config {
        seleniumLogs?: string;
        seleniumInstallArgs?: InstallOpts;
        seleniumArgs?: StartOpts;
        skipSeleniumInstall?: boolean;
    }
}

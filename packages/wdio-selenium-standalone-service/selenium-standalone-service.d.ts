import { InstallOpts, StartOpts } from "selenium-standalone";

declare module "webdriverio" {
    interface Config extends BaseConfig {}
}

declare module "@wdio/sync" {
    interface Config extends BaseConfig {}
}

interface BaseConfig {
    logs?: string;
    installArgs?: InstallOpts;
    args?: StartOpts;
    skipSeleniumInstall?: boolean;
}

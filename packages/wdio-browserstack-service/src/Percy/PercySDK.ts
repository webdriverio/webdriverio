import { createRequire } from "module";
const require = createRequire(import.meta.url);

const tryRequire = function (pkg: string, fallback: any) {
  try {
    return require(pkg);
  } catch {
    return fallback;
  }
}
// const percySnapshot = tryRequire('@percy/webdriverio', null);
const percySnapshot = tryRequire('@percy/selenium-webdriver', null);
const { percyScreenshot } = tryRequire('@percy/selenium-webdriver', {});
const percyAppScreenshot = require('@percy/appium-app');

import { PercyLogger } from './PercyLogger.js'

let snapshotHandler = (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, name: string) => {
  PercyLogger.error('Unsupported driver for percy')
}
if (percySnapshot) {
  snapshotHandler = (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, name: string) => {
    if (process.env.PERCY_SNAPSHOT == "true") {
      return percySnapshot(browser, name)
    }
  };
}
export const snapshot = snapshotHandler;

let screenshotHandler = (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, name: string) => {
  PercyLogger.error('Unsupported driver for percy')
}
if (percyScreenshot) {
  screenshotHandler = percyScreenshot;
}
export const screenshot = screenshotHandler;

export const screenshotApp = percyAppScreenshot;

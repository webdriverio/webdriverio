import WebDriver from 'webdriver'
import WebdriverIO from 'webdriverio'

interface DeviceFarmConfig {
  projectArn: string;
  expiresInSeconds?: number;
}

export class DeviceFarmLauncher implements WebdriverIO.HookFunctions {
    constructor(
        options: DeviceFarmConfig,
        caps: WebDriver.DesiredCapabilities,
        _config: WebdriverIO.Config
    ) {
        // TODO
        console.log('options', options)
        console.log('caps', caps)
        console.log('_config', _config)
    }
}
import WebDriver from 'webdriver'
import WebdriverIO from 'webdriverio'
import * as AWS from 'aws-sdk'

interface DeviceFarmConfig {
  projectArn: string;
  expiresInSeconds?: number;
}

export default class DeviceFarmLauncher implements WebdriverIO.HookFunctions {
    private readonly devicefarm: AWS.DeviceFarm
    private readonly options: DeviceFarmConfig

    constructor(
        options: DeviceFarmConfig,
        caps: WebDriver.DesiredCapabilities,
        _config: WebdriverIO.Config
    ) {
        // TODO
        console.log('options', options)
        console.log('caps', caps)
        console.log('_config', _config)
        this.devicefarm = new AWS.DeviceFarm()
        this.options = options
    }

    public async onPrepare(
        _config: WebdriverIO.Config,
        capabilities: WebDriver.DesiredCapabilities[]
    ): Promise<void> {
        for (const cap of capabilities) {
            // https://docs.aws.amazon.com/devicefarm/latest/testgrid/testing-frameworks-nodejs.html
            const testGridUrlResult = await this.devicefarm.createTestGridUrl({
                projectArn: this.options.projectArn,
                expiresInSeconds: this.options.expiresInSeconds || 900
            }).promise()
            console.log('Created url result:', testGridUrlResult)
            var url = new URL(testGridUrlResult.url!)
            Object.assign(cap, {
                protocol: 'https',
                port: 443,
                hostname: url.hostname,
                path: url.pathname,
                connectionRetryTimeout: 180000,
            })
        }
    }
}

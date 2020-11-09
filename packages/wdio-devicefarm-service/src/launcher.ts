import WebDriver from 'webdriver'
import WebdriverIO, { SevereServiceError } from 'webdriverio'
import DeviceFarm from 'aws-sdk/clients/devicefarm'
import getLogger from '@wdio/logger'

const log = getLogger('@wdio/devicefarm-service')

interface DeviceFarmConfig {
  projectArn: string;
  expiresInSeconds?: number;
}

export default class DeviceFarmLauncher implements WebdriverIO.HookFunctions {
    private readonly devicefarm: DeviceFarm
    private readonly options: DeviceFarmConfig

    constructor(options: DeviceFarmConfig) {
        // DeviceFarm is only available in us-west-2
        this.devicefarm = new DeviceFarm({ region: 'us-west-2' })
        this.options = options
    }

    public async onPrepare(
        _config: WebdriverIO.Config,
        capabilities: WebDriver.DesiredCapabilities[]
    ): Promise<void> {
        for (const cap of capabilities) {
            const testGridUrlResult = await this.createSession()
            const url = new URL(testGridUrlResult.url!)

            log.info('Created device farm test grid:', testGridUrlResult)

            Object.assign(cap, {
                protocol: 'https',
                port: 443,
                hostname: url.hostname,
                path: url.pathname,
                connectionRetryTimeout: 180000,
            })
        }
    }

    // https://docs.aws.amazon.com/devicefarm/latest/testgrid/testing-frameworks-nodejs.html
    private async createSession() {
        try {
            return await this.devicefarm.createTestGridUrl({
                projectArn: this.options.projectArn,
                expiresInSeconds: this.options.expiresInSeconds || 900,
            }).promise()
        } catch (err) {
            const errorMessage = `Failed to create a device farm session: ${err.message}`
            log.error(errorMessage)
            throw new SevereServiceError(errorMessage)
        }
    }
}

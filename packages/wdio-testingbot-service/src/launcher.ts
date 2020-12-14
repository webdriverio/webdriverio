import { performance, PerformanceObserver } from 'perf_hooks'
import { promisify } from 'util'

import testingbotTunnel from 'testingbot-tunnel-launcher'
import logger from '@wdio/logger'

const log = logger('@wdio/testingbot-service')

export default class TestingBotLauncher implements WebdriverIO.ServiceInstance {
    options: TestingbotOptions;
    tbTunnelOpts!: TunnelLauncherOptions;
    tunnel?: TestingbotTunnel;
    constructor (options: TestingbotOptions) {
        this.options = options
    }

    async onPrepare (config: WebdriverIO.Config, capabilities: WebDriver.DesiredCapabilities[]) {
        if (!this.options.tbTunnel || !config.user || !config.key) {
            return
        }

        const tbTunnelIdentifier = this.options.tbTunnelOpts?.tunnelIdentifier || `TB-tunnel-${Math.random().toString().slice(2)}`

        this.tbTunnelOpts = Object.assign({
            apiKey: config.user,
            apiSecret: config.key,
            'tunnel-identifier': tbTunnelIdentifier,
        }, this.options.tbTunnelOpts)

        if (Array.isArray(capabilities)) {
            for (const capability of capabilities) {
                if (!capability['tb:options']) {
                    capability['tb:options'] = {} as WebDriver.TestingbotCapabilities
                }

                capability['tb:options']['tunnel-identifier'] = tbTunnelIdentifier
            }
        } else {
            for (const browserName of Object.keys(capabilities)) {
                const capability = (capabilities as WebdriverIO.MultiRemoteOptions)[browserName]
                if (!capability['tb:options']) {
                    capability['tb:options'] = {} as WebDriver.TestingbotCapabilities
                }

                capability['tb:options']['tunnel-identifier'] = tbTunnelIdentifier
            }
        }

        /**
         * measure TestingBot tunnel boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`TestingBot tunnel successfully started after ${entry.duration}ms`)
        })
        obs.observe({ entryTypes: ['measure'], buffered: false })

        performance.mark('tbTunnelStart')
        this.tunnel = await promisify(testingbotTunnel)(this.tbTunnelOpts)
        performance.mark('tbTunnelEnd')
        performance.measure('bootTime', 'tbTunnelStart', 'tbTunnelEnd')
    }

    /**
     * Shut down the tunnel
     * @returns {Promise} Resolved promise when tunnel is closed
     */
    onComplete () {
        if (!this.tunnel) {
            return
        }

        return new Promise(resolve => this.tunnel!.close(resolve))
    }
}

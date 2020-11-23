import { performance, PerformanceObserver } from 'perf_hooks'
import { promisify } from 'util'

import testingbotTunnel from 'testingbot-tunnel-launcher'
import logger from '@wdio/logger'

const log = logger('@wdio/testingbot-service')

export default class TestingBotLauncher {
    options: TestingbotOptions;
    tbTunnelOpts!: TunnelLauncherOptions;
    tunnel?: TestingbotTunnel;
    constructor (options: TestingbotOptions) {
        this.options = options
    }

    async onPrepare (config: WebdriverIO.Config, capabilities: WebDriver.Capabilities) {
        if (!this.options.tbTunnel || !config.user || !config.key) {
            return
        }

        const tbTunnelIdentifier = `TB-tunnel-${Math.random().toString().slice(2)}`

        this.tbTunnelOpts = Object.assign({
            apiKey: config.user,
            apiSecret: config.key,
            'tunnel-identifier': tbTunnelIdentifier,
        }, this.options.tbTunnelOpts)

        let tbOptions = capabilities['tb:options']
        if (!tbOptions) {
            tbOptions = {}
        }

        tbOptions['tunnel-identifier'] = tbTunnelIdentifier

        const caps = Array.isArray(capabilities) ? capabilities : Object.values(capabilities)
        caps.forEach((cap: WebDriver.DesiredCapabilities) => Object.assign(cap, { 'tb:options': tbOptions }, { ...cap }))

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

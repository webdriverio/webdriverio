import { performance, PerformanceObserver } from 'perf_hooks'
import { promisify } from 'util'

import testingbotTunnel from 'testingbot-tunnel-launcher'
import logger from '@wdio/logger'

const log = logger('@wdio/sauce-service')

export default class TestingBotLauncher {
    async onPrepare (options, caps, config) {
        if (!options.tbTunnel || !config.user || !config.key) {
            return
        }

        this.tbTunnelOpts = Object.assign({
            apiKey: config.user,
            apiSecret: config.key
        }, options.tbTunnelOpts)

        config.protocol = 'http'
        config.hostname = 'localhost'
        config.port = 4445

        /**
         * measure TestingBot tunnel boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`Sauce Connect successfully started after ${entry.duration}ms`)
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

        return new Promise(resolve => this.tunnel.close(resolve))
    }
}

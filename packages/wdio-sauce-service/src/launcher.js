import { promisify } from 'util'
import { performance, PerformanceObserver } from 'perf_hooks'

import logger from '@wdio/logger'
import SauceConnectLauncher from 'sauce-connect-launcher'

const log = logger('@wdio/sauce-service')
export default class SauceLauncher {
    constructor (options) {
        this.options = options
    }

    /**
     * modify config and launch sauce connect
     */
    async onPrepare (config, capabilities) {
        if (!this.options.sauceConnect) {
            return
        }

        const sauceConnectOpts = Object.assign({ noAutodetect: true }, this.options.sauceConnectOpts)
        const sauceConnectTunnelIdentifier = (
            sauceConnectOpts.tunnelIdentifier ||
            /**
             * generate random identifier if not provided
             */
            `SC-tunnel-${Math.random().toString().slice(2)}`)

        this.sauceConnectOpts = Object.assign({
            username: config.user,
            accessKey: config.key,
            logger: log.debug,
            tunnelIdentifier: sauceConnectTunnelIdentifier
        }, sauceConnectOpts)

        if (this.options.scRelay) {
            config.protocol = 'http'
            config.hostname = 'localhost'
            config.port = this.sauceConnectOpts.port || 4445
        }

        if (Array.isArray(capabilities)) {
            capabilities.forEach(capability => {
                if (capability['sauce:options'] === undefined) {
                    capability.tunnelIdentifier = capability.tunnelIdentifier || sauceConnectTunnelIdentifier
                } else {
                    capability['sauce:options'].tunnelIdentifier = capability['sauce:options'].tunnelIdentifier || sauceConnectTunnelIdentifier
                }
            })
        } else {
            Object.keys(capabilities).forEach(browser => {
                if (capabilities[browser].capabilities['sauce:options'] === undefined) {
                    capabilities[browser].capabilities.tunnelIdentifier = capabilities[browser].capabilities.tunnelIdentifier || sauceConnectTunnelIdentifier
                } else {
                    capabilities[browser].capabilities['sauce:options'].tunnelIdentifier = capabilities[browser].capabilities['sauce:options'].tunnelIdentifier || sauceConnectTunnelIdentifier
                }
            })
        }

        /**
         * measure SC boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`Time for Sauce Connect ${entry.name}: ${entry.duration}`)
        })
        obs.observe({ entryTypes: ['measure'], buffered: false })

        performance.mark('sauceConnectStart')
        this.sauceConnectProcess = await promisify(SauceConnectLauncher)(this.sauceConnectOpts)
        performance.mark('sauceConnectEnd')
        performance.measure('bootTime', 'sauceConnectStart', 'sauceConnectEnd')
    }

    /**
     * shut down sauce connect
     */
    onComplete () {
        if (!this.sauceConnectProcess) {
            return
        }

        return new Promise(resolve => this.sauceConnectProcess.close(resolve))
    }
}

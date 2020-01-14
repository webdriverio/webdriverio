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

        const sauceConnectOpts = this.options.sauceConnectOpts || {}
        const sauceConnectTunnelIdentifier = (
            sauceConnectOpts.tunnelIdentifier ||
            /**
             * generate random identifier if not provided
             */
            `SC-tunnel-${Math.random().toString().slice(2)}`)

        this.sauceConnectOpts = {
            noAutodetect: true,
            username: config.user,
            accessKey: config.key,
            logger: log.debug,
            tunnelIdentifier: sauceConnectTunnelIdentifier,
            ...sauceConnectOpts
        }

        if (this.options.scRelay) {
            config.protocol = 'http'
            config.hostname = 'localhost'
            config.port = this.sauceConnectOpts.port || 4445
        }

        if (Array.isArray(capabilities)) {
            for (const capability of capabilities) {
                if (capability['sauce:options'] === undefined) {
                    capability.tunnelIdentifier = capability.tunnelIdentifier || sauceConnectTunnelIdentifier
                } else {
                    capability['sauce:options'].tunnelIdentifier = capability['sauce:options'].tunnelIdentifier || sauceConnectTunnelIdentifier
                }
            }
        } else {
            for (const browserName of Object.keys(capabilities)) {
                if (capabilities[browserName].capabilities['sauce:options'] === undefined) {
                    capabilities[browserName].capabilities.tunnelIdentifier = (
                        capabilities[browserName].capabilities.tunnelIdentifier ||
                        sauceConnectTunnelIdentifier
                    )
                } else {
                    capabilities[browserName].capabilities['sauce:options'].tunnelIdentifier = (
                        capabilities[browserName].capabilities['sauce:options'].tunnelIdentifier ||
                        sauceConnectTunnelIdentifier
                    )
                }
            }
        }

        /**
         * measure SC boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`Sauce Connect successfully started after ${entry.duration}ms`)
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

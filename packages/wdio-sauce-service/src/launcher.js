import { performance, PerformanceObserver } from 'perf_hooks'

import logger from '@wdio/logger'
import SauceLabs from 'saucelabs'

import { makeCapabilityFactory } from './utils.js'

const SC_RELAY_DEPCRECATION_WARNING = [
    'The "scRelay" option is depcrecated and will be removed',
    'with the upcoming versions of @wdio/sauce-service. Please',
    'remove the option as tests should work identically without it.'
].join(' ')
const MAX_SC_START_TRIALS = 3

const log = logger('@wdio/sauce-service')
export default class SauceLauncher {
    constructor (options, capabilities, config) {
        this.options = options
        this.api = new SauceLabs(config)
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
            tunnelIdentifier: sauceConnectTunnelIdentifier,
            ...sauceConnectOpts
        }

        let endpointConfigurations = {}
        if (this.options.scRelay) {
            log.warn(SC_RELAY_DEPCRECATION_WARNING)

            const scRelayPort = this.sauceConnectOpts.port || 4445
            this.sauceConnectOpts.sePort = scRelayPort
            endpointConfigurations = {
                protocol: 'http',
                hostname: 'localhost',
                port: scRelayPort
            }
        }

        const prepareCapability = makeCapabilityFactory(sauceConnectTunnelIdentifier, endpointConfigurations)

        if (Array.isArray(capabilities)) {
            for (const capability of capabilities) {
                prepareCapability(capability)
            }
        } else {
            for (const browserName of Object.keys(capabilities)) {
                prepareCapability(capabilities[browserName].capabilities)
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
        this.sauceConnectProcess = await this.startTunnel()
        performance.mark('sauceConnectEnd')
        performance.measure('bootTime', 'sauceConnectStart', 'sauceConnectEnd')
    }

    async startTunnel(retryCount = 0) {
        try {
            const scProcess = await this.api.startSauceConnect(this.sauceConnectOpts)
            return scProcess
        } catch (err) {
            ++retryCount
            /**
             * fail starting Sauce Connect eventually
             */
            if (
                /**
                 * only fail for ENOENT errors due to racing condition
                 * see: https://github.com/saucelabs/node-saucelabs/issues/86
                 */
                !err.message.includes('ENOENT') ||
                /**
                 * or if we reached the maximum rety count
                 */
                retryCount >= MAX_SC_START_TRIALS
            ) {
                throw err
            }
            log.debug(`Failed to start Sauce Connect Proxy due to ${err.stack}`)
            log.debug(`Retrying ${retryCount}/${MAX_SC_START_TRIALS}`)
            return this.startTunnel(retryCount)
        }
    }

    /**
     * shut down sauce connect
     */
    onComplete () {
        if (!this.sauceConnectProcess) {
            return
        }

        return this.sauceConnectProcess.close()
    }
}

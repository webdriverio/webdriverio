import { performance, PerformanceObserver } from 'node:perf_hooks'

import SauceLabs, { SauceLabsOptions, SauceConnectOptions, SauceConnectInstance } from 'saucelabs'
import logger from '@wdio/logger'
import type { Services, Capabilities, Options } from '@wdio/types'

import { makeCapabilityFactory } from './utils.js'
import type { SauceServiceConfig } from './types'

const SC_RELAY_DEPCRECATION_WARNING = [
    'The "scRelay" option is depcrecated and will be removed',
    'with the upcoming versions of @wdio/sauce-service. Please',
    'remove the option as tests should work identically without it.'
].join(' ')
const MAX_SC_START_TRIALS = 3

const log = logger('@wdio/sauce-service')
export default class SauceLauncher implements Services.ServiceInstance {
    private _api: SauceLabs
    private _sauceConnectProcess?: SauceConnectInstance

    constructor (
        private _options: SauceServiceConfig,
        private _capabilities: unknown,
        private _config: Options.Testrunner
    ) {
        this._api = new SauceLabs(this._config as unknown as SauceLabsOptions)
    }

    /**
     * modify config and launch sauce connect
     */
    async onPrepare (
        config: Options.Testrunner,
        capabilities: Capabilities.RemoteCapabilities
    ) {
        if (!this._options.sauceConnect) {
            return
        }

        const sauceConnectTunnelIdentifier = (
            this._options.sauceConnectOpts?.tunnelIdentifier ||
            /**
             * generate random identifier if not provided
             */
            `SC-tunnel-${Math.random().toString().slice(2)}`)

        const sauceConnectOpts: SauceConnectOptions = {
            noAutodetect: true,
            tunnelIdentifier: sauceConnectTunnelIdentifier,
            ...this._options.sauceConnectOpts
        }

        let endpointConfigurations = {}
        if (this._options.scRelay) {
            log.warn(SC_RELAY_DEPCRECATION_WARNING)

            const scRelayPort = sauceConnectOpts.sePort || 4445
            sauceConnectOpts.sePort = scRelayPort
            endpointConfigurations = {
                protocol: 'http',
                hostname: 'localhost',
                port: scRelayPort
            }
        }

        const prepareCapability = makeCapabilityFactory(sauceConnectTunnelIdentifier, endpointConfigurations)

        if (Array.isArray(capabilities)) {
            for (const capability of capabilities) {
                prepareCapability(capability as Capabilities.DesiredCapabilities)
            }
        } else {
            for (const browserName of Object.keys(capabilities)) {
                const caps = capabilities[browserName].capabilities
                prepareCapability((caps as Capabilities.W3CCapabilities).alwaysMatch || caps)
            }
        }

        /**
         * measure SC boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`Sauce Connect successfully started after ${entry.duration}ms`)
        })
        obs.observe({ entryTypes: ['measure'] })

        performance.mark('sauceConnectStart')
        this._sauceConnectProcess = await this.startTunnel(sauceConnectOpts)
        performance.mark('sauceConnectEnd')
        performance.measure('bootTime', 'sauceConnectStart', 'sauceConnectEnd')
    }

    async startTunnel (sauceConnectOpts: SauceConnectOptions, retryCount = 0): Promise<SauceConnectInstance> {
        try {
            const scProcess = await this._api.startSauceConnect(sauceConnectOpts)
            return scProcess
        } catch (err: any) {
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
            return this.startTunnel(sauceConnectOpts, retryCount)
        }
    }

    /**
     * shut down sauce connect
     */
    onComplete () {
        if (!this._sauceConnectProcess) {
            return
        }

        return this._sauceConnectProcess.close()
    }
}

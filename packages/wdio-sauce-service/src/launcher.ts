import { performance, PerformanceObserver } from 'perf_hooks'

import logger from '@wdio/logger'
import SauceLabs, { SauceConnectInstance, SauceLabsOptions } from 'saucelabs'

import { makeCapabilityFactory } from './utils'
import { SauceServiceConfig } from './service'

const SC_RELAY_DEPCRECATION_WARNING = [
    'The "scRelay" option is depcrecated and will be removed',
    'with the upcoming versions of @wdio/sauce-service. Please',
    'remove the option as tests should work identically without it.'
].join(' ')

const log = logger('@wdio/sauce-service')
export default class SauceLauncher {
    options: SauceServiceConfig;
    api: SauceLabs;
    sauceConnectProcess?: SauceConnectInstance;

    constructor (options: SauceServiceConfig, capabilities?: Webdriver.DesiredCapabilities | Array<Webdriver.DesiredCapabilities>, config?: SauceLabsOptions) {
        this.options = options
        this.api = new SauceLabs(config as SauceLabsOptions)
    }

    /**
     * modify config and launch sauce connect
     */
    async onPrepare (config: SauceLabsOptions, capabilities: Array<DesiredCapabilities>) {
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

        sauceConnectOpts.noAutodetect = true
        sauceConnectOpts.tunnelIdentifier = sauceConnectTunnelIdentifier

        let endpointConfigurations = {}
        if (this.options.scRelay) {
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
                prepareCapability(capability)
            }
        } else {
            for (const browserName in capabilities as object) {
                const browserCap = capabilities[browserName as keyof typeof capabilities] as Record<string, any>
                prepareCapability(browserCap['capabilities'])
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
        this.sauceConnectProcess = await this.api.startSauceConnect(sauceConnectOpts)
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

        return this.sauceConnectProcess.close()
    }
}

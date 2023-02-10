import { performance, PerformanceObserver } from 'node:perf_hooks'

import ip from 'ip'
import type { SauceLabsOptions, SauceConnectOptions, SauceConnectInstance } from 'saucelabs'
import SauceLabs from 'saucelabs'
import logger from '@wdio/logger'
import type { Services, Capabilities, Options } from '@wdio/types'

import { makeCapabilityFactory } from './utils.js'
import type { SauceServiceConfig } from './types.js'
import path from 'node:path'

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
        // @ts-expect-error https://github.com/saucelabs/node-saucelabs/issues/153
        this._api = new SauceLabs.default(this._config as unknown as SauceLabsOptions)
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
            ...this._options.sauceConnectOpts,
            noSslBumpDomains: `127.0.0.1,localhost,${ip.address()}` + (
                this._options.sauceConnectOpts?.noSslBumpDomains
                    ? `,${this._options.sauceConnectOpts.noSslBumpDomains}`
                    : ''
            ),
            logger: this._options.sauceConnectOpts?.logger || ((output) => log.debug(`Sauce Connect Log: ${output}`)),
            ...(!this._options.sauceConnectOpts?.logfile && this._config.outputDir
                ? { logfile: path.join(this._config.outputDir, 'wdio-sauce-connect-tunnel.log') }
                : {}
            )
        }
        const prepareCapability = makeCapabilityFactory(sauceConnectTunnelIdentifier)
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

        log.info('Starting Sauce Connect Tunnel')
        performance.mark('sauceConnectStart')
        this._sauceConnectProcess = await this.startTunnel(sauceConnectOpts)
        performance.mark('sauceConnectEnd')
        const bootimeMeasure = performance.measure('bootTime', 'sauceConnectStart', 'sauceConnectEnd')
        log.info(`Started Sauce Connect Tunnel within ${bootimeMeasure.duration}ms`)
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

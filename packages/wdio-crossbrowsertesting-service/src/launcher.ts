import { promisify } from 'node:util'
import { performance, PerformanceObserver } from 'node:perf_hooks'
import type { Capabilities, Services, Options } from '@wdio/types'

import cbt from 'cbt_tunnels'
import logger from '@wdio/logger'

import type { CrossBrowserTestingConfig } from './types'

const log = logger('@wdio/crossbrowsertesting-service')

export default class CrossBrowserTestingLauncher implements Services.ServiceInstance {
    private _isUsingTunnel: boolean = false
    private _cbtTunnelOpts: CBTConfigInterface

    constructor (
        private _options: CrossBrowserTestingConfig,
        private _caps: Capabilities.Capabilities,
        private _config: Options.Testrunner
    ) {
        this._cbtTunnelOpts = Object.assign({
            username: this._config.user,
            authkey: this._config.key,
            nokill: true
        }, this._options.cbtTunnelOpts)
    }

    async onPrepare () {
        if (!this._options.cbtTunnel) {
            return
        }

        /**
         * measure TestingBot tunnel boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`CrossBrowserTesting tunnel successfully started after ${entry.duration}ms`)
        })
        obs.observe({ entryTypes: ['measure'] })

        performance.mark('tbTunnelStart')
        await promisify(cbt.start)(this._cbtTunnelOpts)
        this._isUsingTunnel = true
        performance.mark('tbTunnelEnd')
        performance.measure('bootTime', 'tbTunnelStart', 'tbTunnelEnd')
    }

    onComplete () {
        if (!this._isUsingTunnel){
            return
        }

        return new Promise((resolve, reject) => cbt.stop((err: Error) => {
            if (err) {
                return reject(err)
            }
            return resolve('stopped')
        }))
    }
}

import { promisify } from 'util'
import { performance, PerformanceObserver } from 'perf_hooks'

import cbt from 'cbt_tunnels'
import logger from '@wdio/logger'

const log = logger('@wdio/crossbrowsertesting-service')

export default class CrossBrowserTestingLauncher implements WebdriverIO.ServiceInstance {
    private _isUsingTunnel: boolean = false;
    private _cbtTunnelOpts: CBTConfigInterface;

    constructor (
        private _options: WebdriverIO.ServiceOption,
        private _caps: WebDriver.DesiredCapabilities,
        private _config: WebdriverIO.Config
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
        obs.observe({ entryTypes: ['measure'], buffered: false })

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

import { promisify } from 'util'
import { performance, PerformanceObserver } from 'perf_hooks'

import cbt from 'cbt_tunnels'
import logger from '@wdio/logger'

const log = logger('@wdio/crossbrowsertesting-service')

export default class CrossBrowserTestingLauncher {
    constructor (options, caps, config) {
        this.options = options
        this.config = config
    }

    async onPrepare () {
        if (!this.options.cbtTunnel) {
            return
        }

        this.cbtTunnelOpts = Object.assign({
            username: this.config.user,
            authkey: this.config.key,
            nokill: true
        }, this.options.cbtTunnelOpts)

        /**
         * measure TestingBot tunnel boot time
         */
        const obs = new PerformanceObserver((list) => {
            const entry = list.getEntries()[0]
            log.info(`CrossBrowserTesting tunnel successfully started after ${entry.duration}ms`)
        })
        obs.observe({ entryTypes: ['measure'], buffered: false })

        performance.mark('tbTunnelStart')
        await promisify(cbt.start)(this.cbtTunnelOpts)
        this.tunnel = true
        performance.mark('tbTunnelEnd')
        performance.measure('bootTime', 'tbTunnelStart', 'tbTunnelEnd')
    }

    onComplete () {
        if (!this.tunnel){
            return
        }

        return new Promise((resolve, reject) => cbt.stop(err => {
            if (err) {
                return reject(err)
            }
            return resolve('stopped')
        }))
    }
}

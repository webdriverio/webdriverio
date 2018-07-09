import SauceConnectLauncher from 'sauce-connect-launcher'

export default class SauceLaunchService {
    /**
     * modify config and launch sauce connect
     */
    onPrepare (config, capabilities) {
        if (!config.sauceConnect) {
            return
        }

        this.sauceConnectOpts = Object.assign({
            username: config.user,
            accessKey: config.key
        }, config.sauceConnectOpts)

        config.protocol = 'http'
        config.host = 'localhost'
        config.port = this.sauceConnectOpts.port || 4445

        const sauceConnectTunnelIdentifier = this.sauceConnectOpts.tunnelIdentifier

        if (sauceConnectTunnelIdentifier) {
            if (Array.isArray(capabilities)) {
                capabilities.forEach(capability => {
                    capability.tunnelIdentifier = capability.tunnelIdentifier || sauceConnectTunnelIdentifier
                })
            } else {
                Object.keys(capabilities).forEach(browser => {
                    capabilities[browser].capabilities.tunnelIdentifier = capabilities[browser].capabilities.tunnelIdentifier || sauceConnectTunnelIdentifier
                })
            }
        }

        return new Promise((resolve, reject) => SauceConnectLauncher(this.sauceConnectOpts, (err, sauceConnectProcess) => {
            /* istanbul ignore if */
            if (err) {
                return reject(err)
            }

            this.sauceConnectProcess = sauceConnectProcess
            return resolve()
        }))
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

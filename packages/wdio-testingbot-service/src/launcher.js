import testingbotTunnel from 'testingbot-tunnel-launcher'

export default class TestingBotLauncher {
    onPrepare (config) {
        if (!config.tbTunnel) {
            return
        }

        this.tbTunnelOpts = Object.assign({
            apiKey: config.user,
            apiSecret: config.key
        }, config.tbTunnelOpts)

        config.protocol = 'http'
        config.hostname = 'localhost'
        config.port = 4445

        return new Promise((resolve, reject) => testingbotTunnel(this.tbTunnelOpts, (err, tunnel) => {
            /* istanbul ignore if */
            if (err) {
                return reject(err)
            }

            this.tunnel = tunnel
            return resolve()
        }))
    }

    /**
     * Shut down the tunnel
     * @returns {Promise} Resolved promise when tunnel is closed
     */
    onComplete () {
        if (!this.tunnel) {
            return
        }

        return new Promise(resolve => this.tunnel.close(resolve))
    }
}

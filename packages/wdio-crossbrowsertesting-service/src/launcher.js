const cbt = require('cbt_tunnels')

export default class CrossBrowserTestingLauncher {
    onPrepare (config) {
        if (!config.cbtTunnel) {
            return
        }

        this.cbtTunnelOpts = Object.assign({
            username: config.user,
            authkey: config.key
        }, config.cbtTunnelOpts)

        this.cbtTunnel = cbt

        return new Promise((resolve, reject) => this.cbtTunnel.start({ 'username': config.user, 'authkey': config.key }, (err) => {
            if (err) {
                return reject(err)
            }
            this.tunnel = true
            return resolve()
        }))
    }

    onComplete () {
        if(!this.tunnel){
            return
        }

        return new Promise((resolve, reject) => this.cbtTunnel.stop(err => {
            if (err) {
                return reject(err)
            }
            return resolve()
        }))
    }
}

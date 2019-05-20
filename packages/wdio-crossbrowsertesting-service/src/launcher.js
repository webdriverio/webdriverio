var cbt = require('cbt_tunnels')

export default class CrossBrowserTestingLauncher {
    onPrepare (config) {
        if (!config.cbtTunnel) {
            return
        }

        this.cbtTunnelOpts = Object.assign({
            username: config.user,
            authkey: config.key
        }, config.cbtTunnelOpts)

        return new Promise((resolve, reject) => cbt.start({ 'username': config.user, 'authkey': config.key }, (err, tunnel) => {
            if (err) {
                return reject(err)
            }

            this.tunnel = tunnel
            return resolve('connected!!!!!!')
        }))
    }

    onComplete () {
        if(!this.tunnel){
            return
        }

        return new Promise(resolve => cbt.stop(resolve))
    }
}

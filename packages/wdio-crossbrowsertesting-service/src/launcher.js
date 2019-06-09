import cbt from 'cbt_tunnels'

export default class CrossBrowserTestingLauncher {
    onPrepare (config) {
        if (!config.cbtTunnel) {
            return
        }

        this.cbtTunnelOpts = Object.assign({
            username: config.user,
            authkey: config.key
        }, config.cbtTunnelOpts)

        return new Promise((resolve, reject) => cbt.start({ 'username': config.user, 'authkey': config.key }, (err) => {
            if (err) {
                return reject(err)
            }
            this.tunnel = true
            return resolve('connected')
        }))
    }

    onComplete () {
        if(!this.tunnel){
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

import cbt from 'cbt_tunnels'

export default class CrossBrowserTestingLauncher {
    onPrepare (options, caps, config) {
        if (!options.cbtTunnel) {
            return
        }

        this.cbtTunnelOpts = Object.assign({
            username: config.user,
            authkey: config.key,
            nokill: true
        }, options.cbtTunnelOpts)

        return new Promise((resolve, reject) => cbt.start(this.cbtTunnelOpts, (err) => {
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

import { performance, PerformanceObserver } from 'perf_hooks'
import logger from '@wdio/logger'
import LambdaTestTunnelLauncher from '@lambdatest/node-tunnel'
import { TUNNEL_START_FAILED, TUNNEL_STOP_FAILED, TUNNEL_STOP_TIMEOUT } from './constants'
const log = logger('@wdio/lambdatest-service')
export default class LambdaTestLauncher {
    constructor(options) {
        this.options = options
    }

    // modify config and launch tunnel
    onPrepare(config, capabilities) {
        if (!this.options.tunnel) {
            return
        }

        const tunnelArguments = {
            user: config.user,
            key: config.key,
            ...this.options.lambdatestOpts
        }

        this.lambdatestTunnelProcess = new LambdaTestTunnelLauncher()

        if (Array.isArray(capabilities)) {
            capabilities.forEach(capability => {
                capability.tunnel = true
            })
        } else if (typeof capabilities === 'object') {
            capabilities.tunnel = true
        }
        // measure LT boot time
        const obs = new PerformanceObserver(list => {
            const entry = list.getEntries()[0]
            log.info(
                `LambdaTest Tunnel successfully started after ${entry.duration}ms`
            )
        })
        obs.observe({ entryTypes: ['measure'], buffered: false })

        let timer
        performance.mark('ltTunnelStart')
        return Promise.race([
            new Promise((resolve, reject) => {
                this.lambdatestTunnelProcess.start(tunnelArguments, err => {
                    if (err) return reject(err)
                    this.lambdatestTunnelProcess.getTunnelName(tunnelName => {
                        if (Array.isArray(capabilities)) {
                            capabilities.forEach(capability => {
                                capability.tunnelName = tunnelName
                            })
                        } else if (typeof capabilities === 'object') {
                            capabilities.tunnelName = tunnelName
                        }
                        resolve()
                    })
                })
            }),
            new Promise((resolve, reject) => {
                timer = setTimeout(() => { reject( new Error(TUNNEL_START_FAILED)) }, TUNNEL_STOP_TIMEOUT)
            })
        ]).then(
            (result) => {
                clearTimeout(timer)
                performance.mark('ltTunnelEnd')
                performance.measure('bootTime', 'ltTunnelStart', 'ltTunnelEnd')
                return Promise.resolve(result)
            },
            (err) => {
                clearTimeout(timer)
                return Promise.reject(err)
            }
        )
    }

    onComplete() {
        if (
            !this.lambdatestTunnelProcess ||
            typeof this.lambdatestTunnelProcess.isRunning !== 'function' ||
            !this.lambdatestTunnelProcess.isRunning()
        ) {
            return
        }

        let timer
        return Promise.race([
            new Promise((resolve, reject) => {
                this.lambdatestTunnelProcess.stop(err => {
                    if (err) return reject(err)
                    resolve()
                })
            }),
            new Promise((resolve, reject) => {
                timer = setTimeout(() => reject( new Error(TUNNEL_STOP_FAILED)), TUNNEL_STOP_TIMEOUT)
            })
        ]).then(
            () => {
                clearTimeout(timer)
                return Promise.resolve()
            },
            (err) => {
                clearTimeout(timer)
                return Promise.reject(err)
            }
        )
    }
}
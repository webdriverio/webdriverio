import BrowserstackLocalLauncher from 'browserstack-local'
import logger from '@wdio/logger'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackLauncherService {
    onPrepare(config, capabilities) {
        if (!config.browserstackLocal) {
            return log.info('browserstackLocal is not enabled - skipping...')
        }

        const opts = {
            key: config.key,
            forcelocal: true,
            onlyAutomate: true,
            ...config.browserstackOpts
        }

        this.browserstackLocal = new BrowserstackLocalLauncher.Local()

        if (Array.isArray(capabilities)) {
            capabilities.forEach(capability => {
                capability['browserstack.local'] = true
            })
        } else if (typeof capabilities === 'object') {
            capabilities['browserstack.local'] = true
        } else {
            throw TypeError('Capabilities should be an object or Array!')
        }

        let timer
        return Promise.race([
            new Promise((resolve, reject) => {
                this.browserstackLocal.start(opts, err => {
                    if (err) {
                        return reject(err)
                    }
                    resolve()
                })
            }),
            new Promise((resolve, reject) => {
                /* istanbul ignore next */
                timer = setTimeout(function () {
                    reject('Browserstack Local failed to start within 60 seconds!')
                }, 60000)
            })]
        ).then(function (result) {
            clearTimeout(timer)
            return Promise.resolve(result)
        }, function (err) {
            clearTimeout(timer)
            return Promise.reject(err)
        })
    }

    onComplete(exitCode, config) {
        if (!this.browserstackLocal || !this.browserstackLocal.isRunning()) {
            return
        }

        if (config.browserstackLocalForcedStop) {
            return process.kill(this.browserstackLocal.pid)
        }

        let timer
        return Promise.race([
            new Promise((resolve, reject) => {
                this.browserstackLocal.stop(err => {
                    if (err) {
                        return reject(err)
                    }
                    resolve()
                })
            }),
            new Promise((resolve, reject) => {
                /* istanbul ignore next */
                timer = setTimeout(function () {
                    reject('Browserstack Local failed to stop within 60 seconds!')
                }, 60000)
            })]
        ).then(function (result) {
            clearTimeout(timer)
            return Promise.resolve(result)
        }, function (err) {
            clearTimeout(timer)
            return Promise.reject(err)
        })
    }
}

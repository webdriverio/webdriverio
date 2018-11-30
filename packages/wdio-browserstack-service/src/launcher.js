import BrowserstackLocalLauncher from 'browserstack-local';
import logger from "@wdio/logger";

const log = logger('wdio-browserstack-service');

export default class BrowserstackLauncherService {
    onPrepare(config, capabilities) {
        if (!config.browserstackLocal) {
            log.info('browserstackLocal is not enabled - skipping...')
            return;
        }

        const opts = {
            key: config.key,
            forcelocal: true,
            onlyAutomate: true,
            ...config.browserstackOpts
        };
        this.browserstackLocal = new BrowserstackLocalLauncher.Local();

        if (Array.isArray(capabilities)) {
            capabilities.forEach(capability => {
                capability['browserstack.local'] = true;
            });
        } else if (typeof capabilities === 'object') {
            capabilities['browserstack.local'] = true;
        } else {
            throw TypeError('Capabilities should be an object or Array!')
        }

        return new Promise((resolve, reject) => {
            this.browserstackLocal.start(opts, err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
            resolve();
        });
    }

    onComplete(exitCode, config) {
        if (!this.browserstackLocal || !this.browserstackLocal.isRunning()) {
            return;
        }
        if (config.browserstackLocalForcedStop) {
            return Promise.resolve(process.kill(this.browserstackLocal.pid));
        }
        return new Promise((resolve, reject) => {
            //setTimeout(reject('Browserstack Local failed to stop within 60 seconds!'),60000);
            this.browserstackLocal.stop(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}

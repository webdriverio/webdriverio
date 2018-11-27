import BrowserstackLocalLauncher from 'browserstack-local';

export default class BrowserstackLauncherService {
    onPrepare(config, capabilities) {
        if (!config.browserstackLocal) {
            return Promise.resolve('Browserstack Local is off');
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
            return Promise.reject('Unhandled capabilities type!')
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
            return Promise.resolve('Browserstack Local is not running!');
        }
        if (config.browserstackLocalForcedStop) {
            return Promise.resolve(process.kill(this.browserstackLocal.pid));
        }
        return new Promise((resolve, reject) => {
            this.browserstackLocal.stop(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
}

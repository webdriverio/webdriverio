// export a launcher that handles onPrepare, onWorkerStart and onComplete
module.exports = class Launcher {
    // If a hook returns a promise, WebdriverIO will wait until that promise is resolved to continue.
    async onPrepare(config, capabilities) {
        // something before all workers launch
    }

    onWorkerStart(cid, caps, specs, args, execArgv) {
        // something before specific worker launch
    }

    onComplete(exitCode, config, capabilities) {
        // something after the workers shutdown
    }

    // custom service methods ...
}

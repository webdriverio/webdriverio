class Launcher {
    #esmLauncher

    constructor(
        configFilePath,
        args = {},
        isWatchMode = false
    ) {
        this.#esmLauncher = import('./launcher.js').then(
            ({ default: Launcher }) => new Launcher(configFilePath, args, isWatchMode))
    }

    /**
     * run sequence
     * @return  {Promise}  that only gets resolved with either an exitCode or an error
     */
    async run() {
        return (await this.#esmLauncher).run()
    }
}

async function run() {
    const { run } = await import('./index.js')
    return run()
}

module.exports = { Launcher, run }

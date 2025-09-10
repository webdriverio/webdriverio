/* eslint-disable @typescript-eslint/no-explicit-any */
class Launcher {
    #esmLauncher: any

    constructor(
        configFilePath: string,
        args: any = {},
        isWatchMode = false
    ) {
        this.#esmLauncher = import('./index.js').then(
            ({ Launcher }) => new Launcher(configFilePath, args, isWatchMode))
    }

    /**
     * run sequence
     * @return  {Promise}  that only gets resolved with either an exitCode or an error
     */
    async run(): Promise<undefined | number> {
        return (await this.#esmLauncher).run()
    }
}

async function run(): Promise<false | void> {
    const { run } = await import('./index.js')
    return run()
}

module.exports = { Launcher, run }

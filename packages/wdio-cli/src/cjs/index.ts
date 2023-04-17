import type { RunCommandArguments } from '../types.js'

class Launcher {

    #esmLauncher: any

    constructor(
        private configFilePath: string,
        private args: Partial<RunCommandArguments> = {},
        private isWatchMode = false
    ) {
        import('../launcher.js').then(launcher =>  this.#esmLauncher = new launcher.default(this.configFilePath, this.args, this.isWatchMode))
    }

    /**
     * run sequence
     * @return  {Promise}  that only gets resolved with either an exitCode or an error
     */
    async run(): Promise<undefined | number> {
        return this.#esmLauncher.run()
    }
}

async function run(): Promise<false | void> {
    const { run } = await import('../index.js')
    return run()
}

module.exports = { Launcher, run }

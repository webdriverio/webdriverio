/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LauncherResult } from './types.js'
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
     * @return structured test and spec results, or reject on a launcher error
     */
    async run(): Promise<LauncherResult> {
        return (await this.#esmLauncher).run()
    }
}

async function run(): Promise<false | void> {
    const { run } = await import('./index.js')
    return run()
}

module.exports = { Launcher, run }

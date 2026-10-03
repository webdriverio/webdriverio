#!/usr/bin/env node
/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test'
}

/**
 * use IIFE to allow running this within CJS and ESM context
 */
(async () => {
    /**
     * `wdio session <action>` is called once per step by people and coding
     * agents, so it skips loading the rest of the CLI (and webdriverio)
     */
    if (process.argv[2] === 'session') {
        // like the rest of the CLI, but quiet: agents read the session's output
        const { default: dotenv } = await import('dotenv')
        dotenv.config({ quiet: true })
        const { runSessionCli } = await import('@wdio/session/cli')
        process.exitCode = await runSessionCli(process.argv.slice(3))
        return
    }
    const cli = await import('../build/index.js')
    return cli.run()
})()

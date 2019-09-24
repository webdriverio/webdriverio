import pickBy from 'lodash.pickby'
import { remote } from 'webdriverio'
import { hasWdioSyncSupport } from '@wdio/utils'
import { getCapabilities } from '../utils'

import { cmdArgs } from './run'
import { CLI_EPILOGUE } from '../constants'

const IGNORED_ARGS = [
    'bail', 'framework', 'reporters', 'suite', 'spec', 'exclude',
    'mochaOpts', 'jasmineNodeOpts', 'cucumberOpts'
]

export const command = 'repl <option> [capabilities]'
export const desc = 'Run WebDriver session in command line'

export const builder = (yargs) => {
    return yargs
        .options(pickBy(cmdArgs, (_, key) => !IGNORED_ARGS.includes(key)))
        .example('$0 repl firefox --path /', 'Run repl locally')
        .example('$0 repl chrome -u <SAUCE_USERNAME> -k <SAUCE_ACCESS_KEY>', 'Run repl in Sauce Labs cloud')
        .epilogue(CLI_EPILOGUE)
        .help()
}

export const handler = async (argv) => {
    const caps = getCapabilities(argv)

    /**
     * runner option required to wrap commands within Fibers context
     */
    const execMode = hasWdioSyncSupport ? { runner: 'repl' } : {}
    const client = await remote({ ...argv, ...caps, ...execMode })

    global.$ = ::client.$
    global.$$ = ::client.$$
    global.browser = client

    await client.debug()
    await client.deleteSession()
}

import pickBy from 'lodash.pickby'
import { remote } from 'webdriverio'
import type { Argv, Options } from 'yargs'

import { cmdArgs as runCmdArgs } from './run.js'
import { getCapabilities } from '../utils.js'
import { CLI_EPILOGUE } from '../constants.js'
import type { ReplCommandArguments } from '../types.js'

const IGNORED_ARGS = [
    'bail', 'framework', 'reporters', 'suite', 'spec', 'exclude',
    'mochaOpts', 'jasmineOpts', 'cucumberOpts', 'autoCompileOpts'
]

export const command = 'repl <option> [capabilities]'
export const desc = 'Run WebDriver session in command line'
export const cmdArgs: { [k in keyof ReplCommandArguments]?: Options } = {
    platformVersion: {
        alias: 'v',
        desc: 'Version of OS for mobile devices',
        type: 'string',
    },
    deviceName: {
        alias: 'd',
        desc: 'Device name for mobile devices',
        type: 'string',
    },
    udid: {
        alias: 'u',
        desc: 'UDID of real mobile devices',
        type: 'string',
    }
} as const

export const builder = (yargs: Argv) => {
    return yargs
        .options(pickBy({ ...cmdArgs, ...runCmdArgs }, (_, key) => !IGNORED_ARGS.includes(key)))
        .example('$0 repl firefox --path /', 'Run repl locally')
        .example('$0 repl chrome -u <SAUCE_USERNAME> -k <SAUCE_ACCESS_KEY>', 'Run repl in Sauce Labs cloud')
        .example('$0 repl android', 'Run repl browser on launched Android device')
        .example('$0 repl "./path/to/your_app.app"', 'Run repl native app on iOS simulator')
        .example('$0 repl ios -v 11.3 -d "iPhone 7" -u 123432abc', 'Run repl browser on iOS device with capabilities')
        .example('$0 repl "./path/to/wdio.config.js" 0 -p 9515', 'Run repl using the first capability from the capabilty array in wdio.config.js')
        .example('$0 repl "./path/to/wdio.config.js" "myChromeBrowser" -p 9515', 'Run repl using a named multiremote capabilities in wdio.config.js')
        .epilogue(CLI_EPILOGUE)
        .help()
}

export const handler = async (argv: ReplCommandArguments) => {
    const caps = await getCapabilities(argv)
    const client = await remote({ ...argv, ...caps })

    global.$ = client.$.bind(client)
    global.$$ = client.$$.bind(client)
    global.browser = client

    await client.debug()
    return client.deleteSession()
}

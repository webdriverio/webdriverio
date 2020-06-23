import pickBy from 'lodash.pickby'
import { remote } from 'webdriverio'
import { hasWdioSyncSupport } from '@wdio/utils'
import { getCapabilities } from '../utils'

import { CLI_EPILOGUE } from '../constants'

const IGNORED_ARGS = [
    'bail', 'framework', 'reporters', 'suite', 'spec', 'exclude',
    'mochaOpts', 'jasmineNodeOpts', 'cucumberOpts'
]

export const command = 'repl <option> [capabilities]'
export const desc = 'Run WebDriver session in command line'
export const cmdArgs = {
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
}

export const builder = (yargs) => {
    return yargs
        .options(pickBy(cmdArgs, (_, key) => !IGNORED_ARGS.includes(key)))
        .example('$0 repl firefox --path /', 'Run repl locally')
        .example('$0 repl chrome -u <SAUCE_USERNAME> -k <SAUCE_ACCESS_KEY>', 'Run repl in Sauce Labs cloud')
        .example('$0 repl android', 'Run repl browser on launched Android device')
        .example('$0 repl "./path/to/your_app.app"', 'Run repl native app on iOS simulator')
        .example('$0 repl ios -v 11.3 -d "iPhone 7" -u 123432abc', 'Run repl browser on iOS device with capabilities')
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

    global.$ = client.$.bind(client)
    global.$$ = client.$$.bind(client)
    global.browser = client

    await client.debug()
    return client.deleteSession()
}

import { remote } from 'webdriverio'
import { hasWdioSyncSupport } from '@wdio/utils'

export const command = 'repl <browserName>'
export const desc = 'Run WebDriver session in command line'

export const handler = async (argv) => {
    const { browserName } = argv
    const caps = { capabilities: { browserName } }

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

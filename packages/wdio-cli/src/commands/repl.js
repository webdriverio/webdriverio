import { remote } from 'webdriverio'
import { getCapabilities } from '../utils'

export const command = 'repl <option> [capabilities]'
export const desc = 'Run WebDriver session in command line'

export const handler = async (argv) => {
    let caps = getCapabilities(argv)

    const client = await remote(Object.assign(argv, {
        capabilities: caps
    }))

    global.$ = ::client.$
    global.$$ = ::client.$$
    global.browser = client

    await client.debug()
    await client.deleteSession()
}

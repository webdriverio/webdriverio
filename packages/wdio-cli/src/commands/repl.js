import { remote } from 'webdriverio'

export const command = 'repl <browserName>'
export const desc = 'Run WebDriver session in command line'

export const handler = async (argv) => {
    const { browserName } = argv

    const client = await remote(Object.assign(argv, {
        capabilities: {
            browserName
        }
    }))

    global.$ = ::client.$
    global.$$ = ::client.$$
    global.browser = client

    await client.debug()
    await client.deleteSession()
}

import logger from 'wdio-logger'
import { remote } from 'webdriverio'

export const command = 'repl <browserName>'
export const desc = 'Run WebDriver session in command line'

const log = logger('wdio-cli:repl')

export const handler = (argv) => {
    const { browserName } = argv

    const client = remote(Object.assign(argv, {
        desiredCapabilities: {
            browserName
        }
    })).init().catch((e) => {
        log.error(e)
        throw e
    })

    global.$ = ::client.$
    global.$$ = ::client.$$
    global.browser = client

    client.debug().end().then(() => process.exit(0), (e) => {
        throw e
    })
}

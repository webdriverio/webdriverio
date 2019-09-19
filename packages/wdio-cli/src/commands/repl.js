import { remote } from 'webdriverio'
import fs from 'fs'

export const command = 'repl <browserName>'
export const desc = 'Run WebDriver session in command line'
const DEFAULT_CONFIG_PATH = 'appium.conf.js'

export const handler = async (argv) => {
    var caps = { browserName: argv.browserName }

    if (caps.browserName === 'appium') {
        const pathUrl = argv.config ? argv.config : DEFAULT_CONFIG_PATH
        if(!fs.existsSync(pathUrl)) {
            throw new Error ('File was not found. Check provided config path')
        }
        caps = JSON.parse(fs.readFileSync(pathUrl, 'utf8'))
    }

    const client = await remote(Object.assign(argv, {
        capabilities: caps
    }))

    global.$ = ::client.$
    global.$$ = ::client.$$
    global.browser = client

    await client.debug()
    await client.deleteSession()
}

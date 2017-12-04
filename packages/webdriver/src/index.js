import validateConfig from 'wdio-config'
import logger from 'wdio-logger'

import webdriverMonad from './monad'
import command from './command'
import WebDriverRequest from './request'
import { DEFAULTS } from './constants'
import WebDriverProtocol from '../protocol/webdriver.json'

export default class WebDriver {
    static async newSession (options = {}, modifier) {
        const params = validateConfig(DEFAULTS, options)
        logger.setLevel('webdriver', params.logLevel)

        const sessionRequest = new WebDriverRequest(
            'POST',
            '/session',
            { desiredCapabilities: params.desiredCapabilities }
        )

        const { sessionId, value } = await sessionRequest.makeRequest(params)
        options.capabilities = value
        const monad = webdriverMonad(sessionId, params, modifier)

        for (const [endpoint, methods] of Object.entries(WebDriverProtocol)) {
            for (const [method, commandData] of Object.entries(methods)) {
                monad.lift(commandData.command, command(method, endpoint, commandData))
            }
        }

        const prototype = monad()
        return prototype
    }
}

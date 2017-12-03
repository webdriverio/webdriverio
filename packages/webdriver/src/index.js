import parseConfig from 'wdio-config'

import webdriverMonad from './monad'
import command from './command'
import WebDriverRequest from './request'
import WebDriverProtocol from '../protocol/webdriver.json'

export default class WebDriver {
    static async newSession (options = {}, modifier) {
        const params = parseConfig(options)
        const sessionRequest = new WebDriverRequest(
            'POST',
            '/session',
            { desiredCapabilities: params.desiredCapability }
        )

        const { sessionId, value } = await sessionRequest.makeRequest(params)
        options.capabilities = value
        const monad = webdriverMonad(sessionId, options, modifier)

        for (const [endpoint, methods] of Object.entries(WebDriverProtocol)) {
            for (const [method, commandData] of Object.entries(methods)) {
                monad.lift(commandData.command, command(method, endpoint, commandData))
            }
        }

        const prototype = monad()
        return prototype
    }
}

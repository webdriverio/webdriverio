import webdriverMonad from './monad'
import command from './command'
import WebDriverProtocol from '../protocol/webdriver.json'

export default class WebDriver {
    static newSession = function (options = {}, modifier) {
        const monad = webdriverMonad(options, modifier)

        for (const [endpoint, methods] of Object.entries(WebDriverProtocol)) {
            for (const [method, commandData] of Object.entries(methods)) {
                monad.lift(commandData.command, command(method, endpoint, commandData))
            }
        }

        const prototype = monad()
        return prototype
    }
}

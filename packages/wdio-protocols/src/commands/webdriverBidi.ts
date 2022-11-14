import type { BidiResponse } from '../types'

// webdriverBidi types
export default interface WebdriverBidiCommands {
    /**
     * WebdriverBidi Protocol Command
     *
     * Send socket commands via WebDriver Bidi
     * @ref https://github.com/w3c/webdriver-bidi
     *
     */
    send(params: object): BidiResponse

    /**
     * WebdriverBidi Protocol Command
     *
     * Send asynchronous socket commands via WebDriver Bidi
     * @ref https://github.com/w3c/webdriver-bidi
     *
     */
    sendAsync(params: object): void
}

import type { UNICODE_CHARACTERS } from '@wdio/utils'

import { checkUnicode } from '../../utils/index.js'

/**
 *
 * Send a sequence of key strokes to the "active" element. You can make an input element active by just clicking
 * on it. To use characters like "Left arrow" or "Back space", import the `Key` object from the WebdriverIO package.
 *
 * Modifier like `Control`, `Shift`, `Alt` and `Command` will stay pressed so you need to trigger them again to release
 * them. Modifying a click however requires you to use the WebDriver Actions API through the
 * [performActions](https://webdriver.io/docs/api/webdriver#performactions) method.
 *
 * :::info
 *
 * Control keys differ based on the operating system the browser is running on, e.g. MacOS: `Command` and Windows: `Control`.
 * WebdriverIO provides a cross browser modifier control key called `Ctrl` (see example below).
 *
 * :::
 *
 * @param {String|String[]} value  The sequence of keys to type. An array or string must be provided.
 * @see https://w3c.github.io/webdriver/#dispatching-actions
 * @example https://github.com/webdriverio/example-recipes/blob/355434bdef13d29608d6d5fbfbeaa034c8a2aa74/keys/keys.js#L1-L17
 * @alias page.keys
 */
export async function keys (
    this: WebdriverIO.Page,
    value: string | string[]
) {
    let keySequence: string[] = []

    /**
     * replace key with corresponding unicode character
     */
    if (typeof value === 'string') {
        keySequence = checkUnicode(value as keyof typeof UNICODE_CHARACTERS)
    } else if (Array.isArray(value)) {
        const charArray = value as (keyof typeof UNICODE_CHARACTERS)[]
        for (const charSet of charArray) {
            keySequence = keySequence.concat(checkUnicode(charSet))
        }
    } else {
        throw new Error('"keys" command requires a string or array of strings as parameter')
    }

    /**
     * W3C way of handle it key actions
     */
    const keyAction = this.action('key')
    keySequence.forEach((value) => keyAction.down(value))
    /**
     * XCTest API only allows to send keypresses (e.g. keydown+keyup).
     * There is no way to "split" them
     */
    if (!this.browser.isIOS){
        keyAction.pause(10)
    }
    keySequence.forEach((value) => keyAction.up(value))

    // pass true to skip release of keys as they are already released
    return keyAction.perform(true)
}

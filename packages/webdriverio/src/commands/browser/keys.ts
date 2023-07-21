import type { UNICODE_CHARACTERS } from '@wdio/utils'

import { checkUnicode } from '../../utils/index.js'

/**
 *
 * Send a sequence of key strokes to the "active" element. You can make an input element active by just clicking
 * on it. To use characters like "Left arrow" or "Back space", import the `Key` object from the WebdriverIO package.
 *
 * Modifier like `Control`, `Shift`, `Alt` and `Command` will stay pressed so you need to trigger them again to release
 * them. Modifiying a click however requires you to use the WebDriver Actions API through the
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
 *
 */
export function keys (
    this: WebdriverIO.Browser,
    value: string | string[]
) {
    let keySequence: string[] = []

    /**
     * replace key with corresponding unicode character
     */
    if (typeof value === 'string') {
        keySequence = checkUnicode(value as keyof typeof UNICODE_CHARACTERS, this.isDevTools)
    } else if (Array.isArray(value)) {
        const charArray: (keyof typeof UNICODE_CHARACTERS)[] = value as any
        for (const charSet of charArray) {
            keySequence = keySequence.concat(checkUnicode(charSet, this.isDevTools))
        }
    } else {
        throw new Error('"keys" command requires a string or array of strings as parameter')
    }

    /**
     * JsonWireProtocol action
     */
    if (!this.isW3C) {
        return this.sendKeys(keySequence)
    }

    /**
     * W3C way of handle it key actions
     */
    const keyAction = this.action('key')
    keySequence.forEach((value) => keyAction.down(value))
    keyAction.pause(10)
    keySequence.forEach((value) => keyAction.up(value))
    return keyAction.perform()
}

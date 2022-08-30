import { UNICODE_CHARACTERS } from '@wdio/utils'
import type { Capabilities } from '@wdio/types'

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
 * <example>
    :keys.js
    import { Key } from 'webdriverio'

    it('copies text out of active element', async () => {
        await $('#username').setValue('anonymous')

        // copies text from an input element
        await browser.keys([Key.Ctrl, 'a', 'c])

        // inserts text from clipboard into input element
        await $('#username').click() // make input active element
        await browser.keys([Key.Ctrl, 'v'])
    });
 * </example>
 *
 * @param {String|String[]} value  The sequence of keys to type. An array or string must be provided.
 * @see https://w3c.github.io/webdriver/#dispatching-actions
 *
 */
export default function keys (
    this: WebdriverIO.Browser,
    value: string | string[]
) {
    let keySequence: string[] = []
    const platformName = (this.capabilities as Capabilities.Capabilities).platformName

    /**
     * replace key with corresponding unicode character
     */
    if (typeof value === 'string') {
        keySequence = checkUnicode(value as keyof typeof UNICODE_CHARACTERS, this.isDevTools, platformName)
    } else if (Array.isArray(value)) {
        const charArray: (keyof typeof UNICODE_CHARACTERS)[] = value as any
        for (const charSet of charArray) {
            keySequence = keySequence.concat(checkUnicode(charSet, this.isDevTools, platformName))
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
    keySequence.forEach((value) => keyAction.up(value))
    return keyAction.perform()
}

import type { UNICODE_CHARACTERS } from '@wdio/utils'

import { checkUnicode } from '../../utils/index.js'

/**
 *
 * Send a sequence of key strokes to the "active" element. You can make an input element active by just clicking
 * on it. To use special characters like "ArrowLeft", "Enter", or "Backspace", import the `Key` object from the WebdriverIO package:
 *
 * ```js
 * import { Key } from 'webdriverio'
 * ```
 *
 * The `Key` object provides constants for all special keys including:
 * - Navigation: `Key.ArrowLeft`, `Key.ArrowUp`, `Key.ArrowRight`, `Key.ArrowDown`, `Key.PageUp`, `Key.PageDown`, `Key.Home`, `Key.End`
 * - Editing: `Key.Enter`, `Key.Tab`, `Key.Backspace`, `Key.Delete`, `Key.Insert`
 * - Modifiers: `Key.Ctrl` (cross-platform), `Key.Shift`, `Key.Alt`, `Key.Control`, `Key.Command`
 * - Function keys: `Key.F1` through `Key.F12`
 * - Numpad: `Key.Numpad0` through `Key.Numpad9`, `Key.Multiply`, `Key.Add`, `Key.Subtract`, `Key.Divide`
 * - And more: `Key.Escape`, `Key.Space`, `Key.Clear`, `Key.Pause`, etc.
 *
 * See the [Key API docs](/docs/api/modules#key) for a complete list.
 *
 * Modifier keys like `Control`, `Shift`, `Alt` and `Command` will stay pressed throughout the sequence and will be released
 * at the end. Modifying a click requires you to use the WebDriver Actions API through the
 * [performActions](https://webdriver.io/docs/api/webdriver#performactions) method.
 *
 * :::info Cross-Platform Modifier
 *
 * The `Key.Ctrl` constant provides a convenient way to use the "control" modifier across different operating systems.
 * On macOS, it maps to the `Command` key, while on Windows and Linux it maps to the `Control` key.
 * This is useful for keyboard shortcuts like select-all (`[Key.Ctrl, 'a']`), copy, or paste.
 *
 * :::
 *
 * @param {String|String[]} value  The sequence of keys to type. An array or string must be provided.
 * @see https://w3c.github.io/webdriver/#dispatching-actions
 * @example https://github.com/webdriverio/example-recipes/blob/355434bdef13d29608d6d5fbfbeaa034c8a2aa74/keys/keys.js#L1-L17
 *
 */
export async function keys (
    this: WebdriverIO.Browser,
    value: string | string[]
): Promise<void> {
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
    if (!this.isIOS){
        keyAction.pause(10)
    }
    keySequence.forEach((value) => keyAction.up(value))

    // pass true to skip release of keys as they are already released
    return keyAction.perform(true)
}

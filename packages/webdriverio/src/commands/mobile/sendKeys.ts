import type { UNICODE_CHARACTERS } from '@wdio/utils'

import { checkUnicode } from '../../utils/index.js'

/**
 *
 * Send a sequence of key strokes to the active mobile app via W3C WebDriver `performActions`
 * (`keyDown` + `keyUp` per character).
 *
 * Unlike `element.setValue()`, which sets text on a specific target element, or `browser.keys()`,
 * which presses all keys down before releasing them (designed for desktop modifier combinations),
 * `browser.sendKeys()` dispatches paired `keyDown` and `keyUp` actions sequentially for each
 * character. This is useful on iOS (`appium-xcuitest-driver`) and Android (`appium-uiautomator2-driver`)
 * when typing into custom inputs, PIN pads, or views that do not support `setValue` or split key chords.
 *
 * <example>
    :sendKeys.js
    import { Key } from 'webdriverio'

    it('should type text via W3C keyboard actions', async () => {
        // Focus the input element first if needed
        await $('~input-field').click()

        // Send a string character by character
        await browser.sendKeys('hello world')

        // Or send an array of characters and special keys
        await browser.sendKeys(['1', '2', '3', '4', Key.Enter])
    })
 * </example>
 *
 * @param {String|String[]} value  The sequence of keys to type. A string or array of strings must be provided.
 *
 * @support ["ios","android"]
 */
export async function sendKeys(
    this: WebdriverIO.Browser,
    value: string | string[]
): Promise<void> {
    const browser = this

    if (!browser.isMobile) {
        throw new Error('The `sendKeys` command is only available for mobile platforms.')
    }

    let keySequence: string[] = []

    if (typeof value === 'string') {
        keySequence = checkUnicode(value as keyof typeof UNICODE_CHARACTERS)
    } else if (Array.isArray(value)) {
        const charArray = value as (keyof typeof UNICODE_CHARACTERS)[]
        for (const charSet of charArray) {
            keySequence = keySequence.concat(checkUnicode(charSet))
        }
    } else {
        throw new Error('"sendKeys" command requires a string or array of strings as parameter')
    }

    if (keySequence.length === 0) {
        return
    }

    const keyAction = browser.action('key')
    for (const key of keySequence) {
        keyAction.down(key).up(key)
    }

    return keyAction.perform(true)
}

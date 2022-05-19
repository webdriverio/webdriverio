import { UNICODE_CHARACTERS } from '@wdio/utils'

import { checkUnicode } from '../../utils/index.js'
/**
 *
 * Send a sequence of key strokes to the active element. You can also use characters like
 * "Left arrow" or "Back space". WebdriverIO will take care of translating them into unicode
 * characters. You’ll find all supported characters [here](https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions).
 * To do that, the value has to correspond to a key from the table.
 *
 * Modifier like Ctrl, Shift, Alt and Meta will stay pressed so you need to trigger them again to release them.
 * Modifiying a click however requires you to use the WebDriver Actions API through the [performActions](https://webdriver.io/docs/api/webdriver#performactions) method.
 *
 * <example>
    :keys.js
    it('copies text out of active element', async () => {
        // copies text from an input element
        const input = await $('#username')
        await input.setValue('anonymous')

        await browser.keys(['Meta', 'a'])
        await browser.keys(['Meta', 'c'])
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
    const keyDownActions = keySequence.map((value) => ({ type: 'keyDown', value }))
    const keyUpActions = keySequence.map((value) => ({ type: 'keyUp', value }))

    return this.performActions([{
        type: 'key',
        id: 'keyboard',
        actions: [...keyDownActions, ...keyUpActions]
    }]).then(() => this.releaseActions())
}

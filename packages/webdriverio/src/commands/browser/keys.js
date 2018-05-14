/**
 *
 * Send a sequence of key strokes to the active element. You can also use characters like
 * "Left arrow" or "Back space". WebdriverIO will take care of translating them into unicode
 * characters. You’ll find all supported characters [here](https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions).
 * To do that, the value has to correspond to a key from the table.
 *
 * <example>
    :executeAsync.js
    it('sends keystrokes to active element', () => {
        // copies text from an input element
        const input = $('#username')
        input.setValue('anonymous')

        browser.keys(['Meta', 'a'])
        browser.keys(['Meta', 'c'])
    });
 * </example>
 *
 * @param {String|String[]} value  The sequence of keys to type. An array or string must be provided.
 * @see https://w3c.github.io/webdriver/#dispatching-actions
 *
 */

import { checkUnicode } from '../../utils'

export default function keys (value) {
    let keySequence = []

    /**
     * replace key with corresponding unicode character
     */
    if (typeof value === 'string') {
        keySequence = checkUnicode(value)
    } else if (value instanceof Array) {
        for (const charSet of value) {
            keySequence = keySequence.concat(checkUnicode(charSet))
        }
    } else {
        throw new Error(`"keys" command requires an string or array of strings as parameter`)
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
    }])
}

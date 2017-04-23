/**
 *
 * Send a sequence of key strokes to the active element. This command is similar to the
 * send keys command in every aspect except the implicit termination: The modifiers are
 * *not* released at the end of the call. Rather, the state of the modifier keys is kept
 * between calls, so mouse interactions can be performed while modifier keys are depressed.
 *
 * You can also use characters like "Left arrow" or "Back space". WebdriverIO will take
 * care of translating them into unicode characters. You’ll find all supported characters
 * [here](https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions).
 * To do that, the value has to correspond to a key from the table.
 *
 * @param {String|String[]} value  The sequence of keys to type. An array must be provided. The server should flatten the array items to a single string to be typed.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidkeys
 * @type protocol
 * @deprecated
 *
 */

import { UNICODE_CHARACTERS } from '../helpers/constants'
import depcrecateCommand from '../helpers/depcrecationWarning'
import { ProtocolError } from '../utils/ErrorHandler'

module.exports = function keys (value) {
    let key = []

    /**
     * replace key with corresponding unicode character
     */
    if (typeof value === 'string') {
        key = checkUnicode(value)
    } else if (value instanceof Array) {
        for (let charSet of value) {
            key = key.concat(checkUnicode(charSet))
        }
    } else {
        throw new ProtocolError('number or type of arguments don\'t agree with keys protocol command')
    }

    depcrecateCommand('keys')
    return this.requestHandler.create('/session/:sessionId/keys', {
        'value': key
    })
}

/*!
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
function checkUnicode (value) {
    return UNICODE_CHARACTERS.hasOwnProperty(value) ? [UNICODE_CHARACTERS[value]] : value.split('')
}

/**
 *
 * Send a sequence of key strokes to an element.
 *
 * @param {String} ID              ID of a WebElement JSON object to route the command to
 * @param {String|String[]} value  The sequence of keys to type. An array must be provided. The server should flatten the array items to a single string to be typed.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value
 * @type protocol
 *
 */

import unicodeChars from '../helpers/constants'
import ProtocolError from '../utils/ErrorHandler'

let elementIdValue = function (id, value) {
    if(typeof id !== 'string' && typeof id !== 'number') {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdValue protocol command')
    }

    /**
     * replace key with corresponding unicode character
     */
    if(typeof value === 'string') {
        key = checkUnicode(value)
    } else if(value instanceof Array) {
        value.forEach(function(charSet) {
            key = key.concat(checkUnicode(charSet))
        });
    } else {
        throw new ProtocolError('number or type of arguments don\'t agree with elementIdValue protocol command')
    }

    return this.requestHandler.create(`/session/:sessionId/element/${id}/value`, {
        'value': key
    })
}

/*!
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
function checkUnicode(value) {
    return unicodeChars.hasOwnProperty(value) ? [unicodeChars[value]] : value.split('')
}

export default elementIdValue

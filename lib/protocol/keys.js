/**
 *
 * Send a sequence of key strokes to the active element. This command is similar to the
 * send keys command in every aspect except the implicit termination: The modifiers are
 * *not* released at the end of the call. Rather, the state of the modifier keys is kept
 * between calls, so mouse interactions can be performed while modifier keys are depressed.
 *
 * You can also use unicode characters like Left arrow or Back space. WebdriverIO will take
 * care of translating them into unicode characters. You’ll find all supported characters
 * [here](https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/value).
 * To do that, the value has to correspond to a key from the table.
 *
 * @param {String|String[]} value  The sequence of keys to type. An array must be provided. The server should flatten the array items to a single string to be typed.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/keys
 * @type protocol
 *
 */

var unicodeChars = require('../utils/unicodeChars'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function keys (value) {

    var key = [];

    if(typeof value === 'string') {

        // replace key with corresponding unicode character
        key = checkUnicode(value);

    } else if(value instanceof Array) {

        value.forEach(function(charSet) {
            key = key.concat(checkUnicode(charSet));
        });

    } else {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with keys protocol command');
    }

    var data = {'value': key};

    return this.requestHandler.create(
        '/session/:sessionId/keys',
        data
    );
};

/*!
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
function checkUnicode(value) {
    return unicodeChars.hasOwnProperty(value) ? [unicodeChars[value]] : value.split('');
}

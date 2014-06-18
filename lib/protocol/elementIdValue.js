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

var unicodeChars = require('../utils/unicodeChars'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function elementIdValue (id, value) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof id !== 'string' && typeof id !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdValue protocol command'));
    }

    var path = '/session/:sessionId/element/:id/value',
        data = {},
        key = [];

    path = path.replace(/:id/gi, id);

    if(typeof value === 'string') {

        // replace key with corresponding unicode character
        key = checkUnicode(value);

    } else if(value instanceof Array) {

        value.forEach(function(charSet) {
            key = key.concat(checkUnicode(charSet));
        });

    } else {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with elementIdValue protocol command'));
    }

    data = {'value': key};

    this.requestHandler.create(path, data, callback);

};

/*!
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
function checkUnicode(value) {
    return unicodeChars.hasOwnProperty(value) ? [unicodeChars[value]] : value.split('');
}
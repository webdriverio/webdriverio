/**
 *
 * Send a sequence of key strokes to the active element. This command is similar to the
 * send keys command in every aspect except the implicit termination: The modifiers are
 * *not* released at the end of the call. Rather, the state of the modifier keys is kept
 * between calls, so mouse interactions can be performed while modifier keys are depressed.
 *
 * You can also use unicode characters like Left arrow or Back space. WebdriverIO will take
 * care of translating them into unicode characters. You’ll find all supported characters
 * [here](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidelementidvalue).
 * To do that, the value has to correspond to a key from the table.
 *
 * @param {String|String[]} value  The sequence of keys to type. An array must be provided. The server should flatten the array items to a single string to be typed.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessionidkeys
 * @type protocol
 *
 */

'use strict';

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var _helpersConstants = require('../helpers/constants');

var _utilsErrorHandler = require('../utils/ErrorHandler');

module.exports = function keys(value) {
    var key = [];

    /**
     * replace key with corresponding unicode character
     */
    if (typeof value === 'string') {
        key = checkUnicode(value);
    } else if (value instanceof Array) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = _getIterator(value), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var charSet = _step.value;

                key = key.concat(checkUnicode(charSet));
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator['return']) {
                    _iterator['return']();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    } else {
        throw new _utilsErrorHandler.ProtocolError('number or type of arguments don\'t agree with keys protocol command');
    }

    return this.requestHandler.create('/session/:sessionId/keys', {
        'value': key
    });
};

/*!
 * check for unicode character or split string into literals
 * @param  {String} value  text
 * @return {Array}         set of characters or unicode symbols
 */
function checkUnicode(value) {
    return _helpersConstants.UNICODE_CHARACTERS.hasOwnProperty(value) ? [_helpersConstants.UNICODE_CHARACTERS[value]] : value.split('');
}

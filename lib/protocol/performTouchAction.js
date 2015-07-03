/**
 *
 * Perform touch action
 *
 * @param {Object} touchAttr contains attributes of touch gesture (e.g. `element`, `x` and `y`)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#touchaction--multitouchaction
 * @type appium
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function performTouchAction(action) {

    if(typeof action !== 'object') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with performTouchAction protocol command');
    }

    var requestOptions = {
        path: '/session/:sessionId/touch/perform',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, action);

};
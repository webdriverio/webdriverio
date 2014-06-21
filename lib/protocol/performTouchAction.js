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

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof action !== 'object') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with performTouchAction protocol command'));
    }

    var requestOptions = {
        path: '/session/:sessionId/touch/perform',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, action, callback);

};
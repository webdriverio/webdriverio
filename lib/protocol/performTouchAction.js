/**
 *
 * Perform touch action (Appium specific command)
 *
 * ### Usage:
 *
 *     client.performTouchAction(action)
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
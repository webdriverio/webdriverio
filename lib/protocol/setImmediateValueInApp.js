/**
 *
 * set immediate value in app
 *
 * <example>
    :setImmediateValueInApp.js
    client.setImmediateValueInApp(id, value)
 * </example>
 *
 * @type appium
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setImmediateValueInApp(id, value) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if((typeof id !== 'string' && typeof id !== 'number') || typeof value === 'function') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with setImmediateValueInApp protocol command'));
    }

    var requestOptions = {
        path: '/session/:sessionId/appium/element/' + id + '/value',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, {value: value}, callback);

};
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

    if((typeof id !== 'string' && typeof id !== 'number') || typeof value === 'function') {
        throw new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with setImmediateValueInApp protocol command');
    }

    var requestOptions = {
        path: '/session/:sessionId/appium/element/' + id + '/value',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, {value: value});

};
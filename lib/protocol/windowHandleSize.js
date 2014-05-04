/**
 *
 * Protocol binding to get or change the size of the browser.
 *
 * ### Usage
 *
 *     // get the size of
 *     // a specified window
 *     client.windowHandleSize({dc30381e-e2f3-9444-8bf3-12cc44e8372a}, function(err,res) { .. });
 *     // the current window
 *     client.windowHandleSize(function(err,res) { ... });
 *
 *     // change the position of
 *     // a specified window
 *     client.windowHandleSize('{dc30381e-e2f3-9444-8bf3-12cc44e8372a}', {width: 800, height: 600});
 *     // the current window
 *     client.windowHandleSize({width: 800, height: 600});
 *
 * @param {String=} windowHandle the window to receive/change the size
 * @param {Object=} dimension    the new size of the window
 *
 * @returns {Object} the size of the window (`{width: number, height: number}`)
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/window/:windowHandle/size
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function windowHandleSize (windowHandle, size) {

    if(typeof windowHandle !== 'string') {
        windowHandle = 'current';
    }

    var data = {},
        requestOptions = {
            path: '/session/:sessionId/window/' + windowHandle + '/size',
            method: 'POST'
        };

    // check if arguments provide proper size parameter
    if(typeof size === 'object' && typeof size.x === 'number' && typeof size.y === 'number') {
        data = size;
    } else if(typeof windowHandle === 'object' && typeof windowHandle.x === 'number' && typeof windowHandle.y === 'number') {
        data = windowHandle;
    } else {
        // otherwise fall back to get operation
        requestOptions.method = 'GET';
    }

    this.requestHandler.create(
        requestOptions,
        data,
        arguments[arguments.length - 1]
    );
};

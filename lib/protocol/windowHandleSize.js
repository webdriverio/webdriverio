/**
 *
 * Protocol binding to get or change the size of the browser.
 *
 * ### Usage
 *
 *     // get the size of
 *     // a specified window
 *     client.windowHandleSize('dc30381e-e2f3-9444-8bf3-12cc44e8372a', function(err,res) { .. });
 *     // the current window
 *     client.windowHandleSize(function(err,res) { ... });
 *
 *     // change the position of
 *     // a specified window
 *     client.windowHandleSize('dc30381e-e2f3-9444-8bf3-12cc44e8372a', {width: 800, height: 600});
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

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof windowHandle === 'object' && windowHandle.width && windowHandle.height) {
        size = {
            width: windowHandle.width,
            height: windowHandle.height
        }
    }

    if(typeof windowHandle !== 'string') {
        windowHandle = 'current';
    }

    var path = '/session/:sessionId/window/' + windowHandle + '/size';

    if(typeof arguments[0] === 'function' && (typeof arguments[0] === 'string' && typeof arguments[1] === 'function')) {

        /**
         * get window size
         */

        return this.requestHandler.create(path, callback);

    }


    /**
     * otherwise change window size
     */

    if(typeof size.width !== 'number' && typeof size.height !== 'number') {
        return callback(new ErrorHandler.ProtocolError('number or type of arguments don\'t agree with windowHandleSize protocol command'));
    }

    return this.requestHandler.create(path, size, callback);


};

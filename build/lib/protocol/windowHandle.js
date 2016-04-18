/**
 * Retrieve the current window handle.
 *
 * <example>
    :windowHandleAsync.js
    client
        .url('http://webdriver.io')
        .windowHandle().then(function(handle) {
            console.log(handle);
            // outputs something like the following:
            //  {
            //      state: 'success',
            //      sessionId: 'e6782264-9eb1-427b-9250-d8302ac35161',
            //      hCode: 988127308,
            //      value: 'CDwindow-849D79B1-5CCB-4A1D-A217-5BA809D935F3',
            //      class: 'org.openqa.selenium.remote.Response',
            //      status: 0
            //  }
        });
 * </example>
 *
 * @returns {String} the current window handle
 *
 * @see https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handle
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var windowHandle = function windowHandle() {
    return this.requestHandler.create('/session/:sessionId/window_handle');
};

exports['default'] = windowHandle;
module.exports = exports['default'];

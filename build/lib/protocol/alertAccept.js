/**
 *
 * Accepts the currently displayed alert dialog. Usually, this is equivalent to
 * clicking on the 'OK' button in the dialog.
 *
 * <example>
    :alertAcceptAsync.js
    // accept a dialog box if is opened
    client.alertText().then(function(res) {
        if (res != null) {
            return this.alertAccept()
        }
    });

    :alertAcceptSync.js
    it('demonstrate the alertAccept command', function () {
        if (browser.alertText()) {
            browser.alertAccept();
        }
        // ...
    });
 * </example>
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/accept_alert
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var alertAccept = function alertAccept() {
    var requestOptions = {
        path: '/session/:sessionId/accept_alert',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);
};

exports['default'] = alertAccept;
module.exports = exports['default'];

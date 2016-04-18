/**
 *
 * Dismisses the currently displayed alert dialog. For confirm() and prompt()
 * dialogs, this is equivalent to clicking the 'Cancel' button. For alert()
 * dialogs, this is equivalent to clicking the 'OK' button.
 *
 * <example>
    :alertDismissAsync.js
    // close a dialog box if is opened
    client.alertText().then(function(res) {
        if (res != null) {
            this.alertDismiss()
        }
    });

    :alertAcceptSync.js
    it('demonstrate the alertDismiss command', function () {
        if (browser.alertText()) {
            browser.alertDismiss();
        }
        // ...
    });
 * </example>
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/dismiss_alert
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var alertDismiss = function alertDismiss() {
    var requestOptions = {
        path: '/session/:sessionId/dismiss_alert',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);
};

exports['default'] = alertDismiss;
module.exports = exports['default'];

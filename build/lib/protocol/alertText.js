/**
 *
 * Gets the text of the currently displayed JavaScript alert(), confirm(), or prompt() dialog.
 *
 * <example>
    :alertTextAsync.js
    // close a dialog box if is opened
    client.alertText().then(function(res) {
        if (res != null) {
            this.alertDismiss()
        }
    });

    :alertTextSync.js
    it('demonstrate the alertDismiss command', function () {
        if (browser.alertText()) {
            browser.alertDismiss();
        }
        // ...
    });
 * </example>
 *
 * @param {String=} text  Keystrokes to send to the prompt() dialog.
 * @returns {String}      The text of the currently displayed alert.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/alert_text
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var alertText = function alertText(text) {
    var requestOptions = '/session/:sessionId/alert_text';
    var data = {};

    if (typeof text === 'string') {
        requestOptions = {
            path: requestOptions,
            method: 'POST'
        };

        data = { text: text };
    }

    return this.unify(this.requestHandler.create(requestOptions, data), {
        extractValue: true
    });
};

exports['default'] = alertText;
module.exports = exports['default'];

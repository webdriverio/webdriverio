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
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#accept-alert
 * @type protocol
 *
 */

let alertAccept = function () {
    // ToDo change path to new route
    // according to Webdriver specification: /session/{session id}/alert/accept
    let requestOptions = {
        path: '/session/:sessionId/accept_alert',
        method: 'POST'
    }

    return this.requestHandler.create(requestOptions)
}

export default alertAccept

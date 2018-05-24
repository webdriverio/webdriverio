/**
 *
 * Dismisses the currently displayed alert dialog. For confirm() and prompt()
 * dialogs, this is equivalent to clicking the 'Cancel' button. For alert()
 * dialogs, this is equivalent to clicking the 'OK' button.
 *
 * <example>
    :alertAccept.js
    it('demonstrate the alertDismiss command', function () {
        try {
            browser.alertDismiss();
        } catch (e) {
            // no alert found
        }
        // ...
    });
 * </example>
 *
 * @throws {RuntimeError}   If no alert is present. The seleniumStack.type parameter will equal 'NoAlertOpenError'.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dismiss-alert
 * @type protocol
 *
 */

export default function alertDismiss () {
    const requestOptions = {
        path: '/session/:sessionId/dismiss_alert',
        method: 'POST'
    }

    return this.requestHandler.create(requestOptions).catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (err.message.match(/did not match a known command/)) {
            requestOptions.path = '/session/:sessionId/alert/dismiss'
            return this.requestHandler.create(requestOptions)
        }

        throw err
    })
}

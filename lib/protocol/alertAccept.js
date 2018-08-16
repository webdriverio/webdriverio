/**
 *
 * Accepts the currently displayed alert dialog. Usually, this is equivalent to
 * clicking on the 'OK' button in the dialog.
 *
 * <example>
    :alertAccept.js
    it('demonstrate the alertAccept command', function () {
        try {
            browser.alertAccept();
        } catch (e) {
            // no alert found
        }
        // ...
    });
 * </example>
 *
 * @throws {RuntimeError}   If no alert is present. The seleniumStack.type parameter will equal 'NoAlertOpenError'.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#accept-alert
 * @type protocol
 *
 */

import { isUnknownCommand } from '../helpers/utilities'

export default function alertAccept () {
    const requestOptions = {
        path: '/session/:sessionId/accept_alert',
        method: 'POST'
    }

    return this.requestHandler.create(requestOptions).catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (isUnknownCommand(err)) {
            requestOptions.path = '/session/:sessionId/alert/accept'
            return this.requestHandler.create(requestOptions)
        }

        throw err
    })
}

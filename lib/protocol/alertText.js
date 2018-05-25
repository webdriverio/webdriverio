/**
 *
 * Gets the text of the currently displayed JavaScript alert(), confirm(), or prompt() dialog.
 *
 * <example>
    :alertText.js
    it('demonstrate the alertText command', function () {
        let alert = browser.alertText();
        expect(alert).toEqual('There are unsaved changes on the page.');
        // ...
    });
 * </example>
 *
 * @param {String=} text  Keystrokes to send to the prompt() dialog.
 * @return {String}      The text of the currently displayed alert.
 * @throws {RuntimeError}   If no alert is present. The seleniumStack.type parameter will equal 'NoAlertOpenError'.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#get-alert-text
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#send-alert-text
 * @type protocol
 *
 */

let alertText = function (text) {
    const requestOptions = {
        path: '/session/:sessionId/alert_text',
        method: 'GET'
    }
    const data = {}

    if (typeof text === 'string') {
        requestOptions.method = 'POST'
        data.text = text
    }

    const request = this.requestHandler.create(requestOptions, data).catch((err) => {
        /**
         * jsonwire command not supported try webdriver endpoint
         */
        if (err.message.match(/did not match a known command/)) {
            requestOptions.path = '/session/:sessionId/alert/text'
            return this.requestHandler.create(requestOptions, data)
        }

        throw err
    })

    return this.unify(request, {
        extractValue: true
    })
}

export default alertText

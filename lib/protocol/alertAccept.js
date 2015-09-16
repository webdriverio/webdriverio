/**
 *
 * Accepts the currently displayed alert dialog. Usually, this is equivalent to
 * clicking on the 'OK' button in the dialog.
 *
 * <example>
    :alertAccept.js
    // accept a dialog box if is opened
    client.alertText( function( err, res ) {
        if ( res != null ) {
            this.alertAccept()
        }
    });
 * </example>
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/accept_alert
 * @type protocol
 *
 */

let alertAccept = function () {
    let requestOptions = {
        path: '/session/:sessionId/accept_alert',
        method: 'POST'
    }

    return this.requestHandler.create(requestOptions)
}

export default alertAccept

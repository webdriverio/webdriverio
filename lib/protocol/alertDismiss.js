/**
 *
 * Dismisses the currently displayed alert dialog. For confirm() and prompt()
 * dialogs, this is equivalent to clicking the 'Cancel' button. For alert()
 * dialogs, this is equivalent to clicking the 'OK' button.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/dismiss_alert
 * @type protocol
 *
 */

module.exports = function alertDismiss () {

    var requestOptions = {
        path: '/session/:sessionId/dismiss_alert',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, arguments[arguments.length - 1]);

};

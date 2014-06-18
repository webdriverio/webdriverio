/**
 *
 * Accepts the currently displayed alert dialog. Usually, this is equivalent to
 * clicking on the 'OK' button in the dialog.
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/accept_alert
 * @type protocol
 *
 */

module.exports = function alertAccept () {

    var requestOptions = {
        path: '/session/:sessionId/accept_alert',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, arguments[arguments.length - 1]);

};

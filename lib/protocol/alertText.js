/**
 *
 * Gets the text of the currently displayed JavaScript alert(), confirm(), or prompt() dialog.
 *
 * @param {String=} text  Keystrokes to send to the prompt() dialog.
 * @returns {String}      The text of the currently displayed alert.
 * @callbackParameter error, response
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/alert_text
 * @type protocol
 *
 */

module.exports = function alertText (text) {

    var requestOptions = '/session/:sessionId/alert_text',
        data = {};

    if(typeof text === 'string') {

        requestOptions = {
            path: requestOptions,
            method: 'POST'
        };

        data = { text: text };

    }

    return this.requestHandler.create(requestOptions, data);

};

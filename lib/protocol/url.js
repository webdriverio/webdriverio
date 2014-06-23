/**
 *
 * Protocol binding to load or get the URL of the browser.
 *
 * <example>
    :url.js
    // Retrieve the URL of the current page.
    client.url(function(err,res) { ... });

    // navigate to a new URL
    client.url('http://webdriver.io');
 * </example>
 *
 * @param {String=} url  the URL to navigate to
 * @returns {String}     the current URL
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/url
 * @type protocol
 *
 */

module.exports = function url (uri) {

    var data = {};

    /*!
     * parameter check
     */
    if (typeof uri === 'string') {
        data.url = uri;
    }

    this.requestHandler.create(
        '/session/:sessionId/url',
        data,
        arguments[arguments.length - 1]
    );
};
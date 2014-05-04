/**
 *
 * Protocol binding to load or get the URL of the browser.
 *
 * ### Usage
 *
 *     // Retrieve the URL of the current page.
 *     client.url(function(err,res) { ... });
 *
 *     // navigate to a new URL
 *     client.url('http://webdriver.io');
 *
 * @param {String=} url  the URL to navigate to
 * @returns {String}     the current URL
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/url
 *
 */

module.exports = function url (url) {

    var data = {};

    /*!
     * parameter check
     */
    if (typeof url === 'string') {
        data.url = url;
    }

    this.requestHandler.create(
        '/session/:sessionId/url',
        data,
        arguments[arguments.length - 1]
    );
};


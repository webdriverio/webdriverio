/**
 *
 * Get the url of current opened website.
 *
 * <example>
    :getUrl.js
    client
        .url('http://webdriver.io')
        .getUrl().then(function(url) {
            console.log(url);
            // outputs the following:
            // "http://webdriver.io"
        });
 * </example>
 *
 * @returns {String} current page url
 * @uses protocol/url
 * @type property
 *
 */

module.exports = function getUrl () {
    return this.unify(this.url(), {
        extractValue: true
    });
};

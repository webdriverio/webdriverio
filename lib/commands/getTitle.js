/**
 *
 * Get the title of current opened website.
 *
 * <example>
    :getTitle.js
    client
        .url('http://webdriver.io')
        .getTitle().then(function(title) {
            console.log(title);
            // outputs the following:
            // "WebdriverIO - Selenium 2.0 javascript bindings for nodejs"
        });
 * </example>
 *
 * @returns {String} current page title
 * @uses protocol/title
 * @type property
 *
 */

module.exports = function getTitle () {
    return this.unify(this.title(), {
        extractValue: true
    });
};
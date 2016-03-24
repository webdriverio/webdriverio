/**
 *
 * Get the title of current opened website.
 *
 * <example>
    :getTitleAsync.js
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

let getTitle = function () {
    return this.unify(this.title(), {
        extractValue: true
    })
}

export default getTitle

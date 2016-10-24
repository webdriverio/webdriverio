/**
 *
 * Get the title of current opened website. This command only works for browser environments or on mobile
 * devices with webview enabled (hybrid tests).
 *
 * <example>
    :getTitle.js
    it('should get the title of the document', function () {
        browser.url('http://webdriver.io');

        var title = browser.getTitle()
        console.log(title);
        // outputs the following:
        // "WebdriverIO - Selenium 2.0 javascript bindings for nodejs"
    });
 * </example>
 *
 * @alias browser.getTitle
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

/**
 *
 * Get the url of current opened website.
 *
 * <example>
    :getUrlAsync.js
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

let getUrl = function () {
    return this.unify(this.url(), {
        extractValue: true
    })
}

export default getUrl

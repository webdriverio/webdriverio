/**
 *
 * Get source code of the page.
 *
 * <example>
    :getSourceAsync.js
    client
        .url('http://webdriver.io')
        .getSource().then(function(source) {
            console.log(source); // outputs: "<!DOCTYPE html>\n<title>Webdriver.io</title>..."
        });
 * </example>
 *
 * @returns {String} source code of current website
 * @uses protocol/source
 * @type property
 *
 */

let getSource = function () {
    return this.unify(this.source(), {
        extractValue: true
    })
}

export default getSource

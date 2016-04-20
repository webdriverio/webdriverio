/**
 *
 * Get the current page source.
 *
 * @returns {String} The current page source.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get-page-source
 * @type protocol
 *
 */

let source = function () {
    return this.requestHandler.create('/session/:sessionId/source')
}

export default source

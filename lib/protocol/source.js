/**
 *
 * Get the current page source.
 *
 * @return {String} The current page source.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#get-page-source
 * @type protocol
 *
 */

export default function source () {
    return this.requestHandler.create('/session/:sessionId/source')
}

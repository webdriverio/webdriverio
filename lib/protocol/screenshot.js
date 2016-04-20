/**
 *
 * Take a screenshot of the current viewport. To get the screenshot of the whole page
 * use the action command `saveScreenshot`
 *
 * @returns {String} screenshot   The screenshot as a base64 encoded PNG.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-take-screenshot
 * @type protocol
 *
 */

let screenshot = function () {
    return this.requestHandler.create('/session/:sessionId/screenshot')
}

export default screenshot

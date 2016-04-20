/**
 *
 * Get the element on the page that currently has focus. The element will be returned as a WebElement JSON object.
 *
 * @returns {String} A WebElement JSON object for the active element.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-get-active-element
 * @type protocol
 *
 */

let elementActive = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/element/active',
        method: 'POST'
    })
}

export default elementActive

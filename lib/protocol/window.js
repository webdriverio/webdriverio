/**
 *
 * Protocol binding to handle with tabs in the browser.
 *
 * <example>
    :window.js
    // change focus to another window
    // using window handle
    browser.window('{dc30381e-e2f3-9444-8bf3-12cc44e8372a}');

    // using tab name attribute
    browser.window('my tab');

    // close the current window
    browser.window();
 * </example>
 *
 * @param {String=} windowHandle the window to change focus to
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-switch-to-window
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-close-window
 * @type protocol
 *
 */

let window = function (windowHandle) {
    let data = {}
    let requestOptions = {
        path: '/session/:sessionId/window',
        method: 'DELETE'
    }

    if (typeof windowHandle === 'string') {
        data = { name: windowHandle }
        requestOptions.method = 'POST'
    }

    return this.requestHandler.create(requestOptions, data)
}

export default window

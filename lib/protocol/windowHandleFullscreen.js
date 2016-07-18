/**
 *
 * The Fullscreen Window command invokes the window manager-specific “full screen” operation,
 * if any, on the window containing the current top-level browsing context. This typically
 * increases the window to the size of the physical display and can hide browser UI elements
 * such as toolbars.
 *
 * Note: this command was recently added to the official Webdriver protocol and might not be
 * working with current Selenium driver.
 *
 * @see  https://w3c.github.io/webdriver/webdriver-spec.html#dfn-fullscreen-window
 * @type protocol
 *
 */

let windowHandleMaximize = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/window/fullscreen',
        method: 'POST'
    })
}

export default windowHandleMaximize

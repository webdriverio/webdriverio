/**
 *
 * Retrieve the current window handle.
 *
 * <example>
    :getCurrentTabId.js
    it('should return the current tab id', function () {
        browser.url('http://webdriver.io')

        var tabId = browser.getCurrentTabId()
        console.log(tabId)
        // outputs something like the following:
        // "CDwindow-C43FB686-949D-4232-828B-583398FBD0C0"
    })
 * </example>
 *
 * @alias browser.getCurrentTabId
 * @return {String} the window handle URL of the current focused window
 * @uses protocol/windowHandle
 * @type window
 *
 */

let getCurrentTabId = function () {
    return this.unify(this.windowHandle(), {
        extractValue: true
    })
}

export default getCurrentTabId

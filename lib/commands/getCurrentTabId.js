/**
 *
 * Retrieve the current window handle.
 *
 * <example>
    :getCurrenteTabId.js
    client
        .url('http://webdriver.io')
        .getCurrentTabId().then(function(tabid) {
            console.log(tabid);
            // outputs something like the following:
            // "CDwindow-C43FB686-949D-4232-828B-583398FBD0C0"
        });
 * </example>
 *
 * @alias browser.getCurrentTabId
 * @returns {String} the window handle URL of the current focused window
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

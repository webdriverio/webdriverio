/**
 *
 * Retrieve the current window handle.
 *
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

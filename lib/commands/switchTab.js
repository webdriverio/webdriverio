/**
 *
 * Switch focus to a particular tab / window handle.
 *
 * @alias browser.switchTab
 * @param {String=} windowHandle window handle URL to focus on (if no handle was specified the command switches to the first available one)
 * @uses protocol/window, window/getTabIds, window/switchTab
 * @type window
 *
 */

let switchTab = function (windowHandle) {
    /*!
     * parameter check
     */
    if (typeof windowHandle !== 'string') {
        windowHandle = null
    }

    if (windowHandle) {
        return this.window(windowHandle)
    }

    return this.windowHandles().then((tabIds) => {
        if (tabIds && tabIds.value && tabIds.value.length) {
            return this.switchTab(tabIds.value[0])
        }
    })
}

export default switchTab

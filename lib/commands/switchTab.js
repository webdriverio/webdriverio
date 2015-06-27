/**
 *
 * Switch focus to a particular tab / window handle.
 *
 * @param {String=} windowHandle window handle URL to focus on (if no handle was specified the command switches to the first available one)
 *
 * @uses protocol/window, window/getTabIds, window/switchTab
 * @type window
 *
 */

module.exports = function switchTab (windowHandle) {

    /*!
     * parameter check
     */
    if(typeof windowHandle !== 'string') {
        windowHandle = null;
    }

    if(windowHandle) {
        return this.window(windowHandle);
    }

    return this.windowHandles().then(function(tabIds) {
        if(tabIds && tabIds.length) {
            return this.switchTab(tabIds[0]);
        }
    });

};
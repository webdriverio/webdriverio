/**
 *
 * Either retrieve a JSON hash of all the currently specified settings or update
 * the current setting on the device.
 *
 * <example>
    :settingsAsync.js
    // get current settings
    browser.settings().then(function(settings) {
        console.log(settings);
    })

    // update setting on the device
    browser.settings({
        cyberdelia: 'open'
    })
    .settings().then(function(settings) {
        console.log(settings.cyberdelia); // returns 'open'
    })
 * </example>
 *
 * @type mobile
 *
 */

let settings = function (settings) {
    const settingsRoute = '/session/:sessionId/appium/settings'

    /**
     * get current settings
     */
    if (!settings) {
        return this.requestHandler.create(settingsRoute)
    }

    return this.requestHandler.create({
        path: settingsRoute,
        method: 'POST'
    }, { settings })
}

export default settings

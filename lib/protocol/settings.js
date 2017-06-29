/**
 *
 * Either retrieve a JSON hash of all the currently specified settings or update the current setting on the device.
 *
 * <example>
    :settings.js
    it('should update/get settinsg on the device', function () {
        // update setting on the device
        browser.settings({ cyberdelia: 'open' });

        // get current settings
        var settings = browser.settings()
        console.log(settings.cyberdelia); // returns 'open'
    });
 * </example>
 *
 * @type mobile
 * @param {Object=}  settings  key/value pairs defining settings on the device
 * @return {Object} current settings (only if method was called without parameters)
 *
 */

export default function settings (settings) {
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

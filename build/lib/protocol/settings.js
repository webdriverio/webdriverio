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

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var settings = function settings(_settings) {
    var settingsRoute = '/session/:sessionId/appium/settings';

    /**
     * get current settings
     */
    if (!_settings) {
        return this.requestHandler.create(settingsRoute);
    }

    return this.requestHandler.create({
        path: settingsRoute,
        method: 'POST'
    }, { settings: _settings });
};

exports['default'] = settings;
module.exports = exports['default'];

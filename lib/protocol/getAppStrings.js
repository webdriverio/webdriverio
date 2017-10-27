/**
 *
 * Get all defined Strings from an app for the default language.
 *
 * @param {String} language  strings language code
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#app-strings
 * @type mobile
 * @for android
 *
 */

export default function getAppStrings (language) {
    const requestOptions = {
        path: '/session/:sessionId/appium/app/strings',
        method: 'POST'
    }

    return this.requestHandler.create(requestOptions, { language })
}

/**
 *
 * Get all defined Strings from an app for the default language.
 *
 * @param {String} language  strings language code
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#app-strings
 * @type mobile
 * @for android
 *
 */

let getAppStrings = function (language) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/strings',
        method: 'POST'
    }, {
        language: language
    })
}

export default getAppStrings

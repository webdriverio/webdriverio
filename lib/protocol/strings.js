/**
 *
 * Returns application strings of the application in a specific language.
 *
 * <example>
    :stringsAsync.js
    it('should return app strings for Android application', function () {
        var appStrings = browser.strings();
        console.log(appStrings); // outputs all app strings

        var russianAppStrings = browser.strings('ru')
        console.log(russianAppStrings); // outputs all russian app strings (if available)
    });
 * </example>
 *
 * @param {String} language  if set it returns app strings only for that specific language
 *
 * @see https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#app-strings
 * @type mobile
 * @for android
 *
 */

export default function strings (language) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/strings',
        method: 'POST'
    }, { language })
}

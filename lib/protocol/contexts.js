/**
 *
 * list all available contexts
 *
 * @see http://appium.io/slate/en/v1.1.0/?javascript#automating-hybrid-ios-apps
 * @see https://github.com/admc/wd/blob/master/lib/commands.js#L279
 * @type mobile
 * @for android, ios
 *
 */

let contexts = function () {
    return this.requestHandler.create('/session/:sessionId/contexts')
}

export default contexts

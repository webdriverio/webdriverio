/**
 *
 * list all available contexts
 *
 * @see http://appium.io/slate/en/v1.1.0/?javascript#automating-hybrid-ios-apps, https://github.com/admc/wd/blob/master/lib/commands.js#L279
 * @type appium
 *
 */

module.exports = function contexts () {

    return this.requestHandler.create(
        '/session/:sessionId/contexts'
    );

};
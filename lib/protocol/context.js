/**
 *
 * list all available contexts
 *
 * @see http://appium.io/slate/en/v1.1.0/?javascript#automating-hybrid-ios-apps, https://github.com/admc/wd/blob/master/lib/commands.js#L279
 * @type appium
 *
 */

module.exports = function context (id) {

    var requestOptions = {
        path: '/session/:sessionId/context',
        method: 'GET'
    };

    var data = {};

    if(typeof id === 'string') {
        requestOptions.method = 'POST';
        data.name = id;
    }

    this.requestHandler.create(requestOptions, data, arguments[arguments.length - 1]);

};
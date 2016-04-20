/**
 *
 * Retrieve current context or switch to the specified context
 *
 * @param {String=} id the context to switch to
 *
 * @see http://appium.io/slate/en/v1.1.0/?javascript#automating-hybrid-ios-apps
 * @see https://github.com/admc/wd/blob/master/lib/commands.js#L279
 * @type mobile
 * @for android, ios
 *
 */

let context = function (id) {
    let requestOptions = {
        path: '/session/:sessionId/context',
        method: 'GET'
    }

    let data = {}

    if (typeof id === 'string') {
        requestOptions.method = 'POST'
        data.name = id
    }

    return this.requestHandler.create(requestOptions, data)
}

export default context

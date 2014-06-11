/**
 *
 * Return a single element or an elements array depending on
 * selector (Appium specific command)
 *
 * ### Usage:
 *
 *     client.complexFindInApp(intent, path)
 *
 */

module.exports = function complexFindInApp(selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/app/complex_find',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, {selector: selector}, callback);

};
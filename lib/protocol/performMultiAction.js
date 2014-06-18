/**
 *
 * Perform touch action (Appium specific command)
 *
 * ### Usage:
 *
 *     client.performMultiAction(multiTouchAction)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#touchaction--multitouchaction
 * @type protocol
 *
 */

module.exports = function performMultiAction(multiTouchAction) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    if(typeof multiTouchAction !== 'object') {
        multiTouchAction = {};
    }

    var requestOptions = {
        path: '/session/:sessionId/touch/multi/perform',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, multiTouchAction, callback);

};
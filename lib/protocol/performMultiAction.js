/**
 *
 * Perform multi touch action
 *
 * @param {Object} touchAttr contains attributes of touch gesture (e.g. `element`, `x` and `y`)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#touchaction--multitouchaction
 * @type appium
 *
 */

module.exports = function performMultiAction(multiTouchAction) {

    if(typeof multiTouchAction !== 'object') {
        multiTouchAction = {};
    }

    var requestOptions = {
        path: '/session/:sessionId/touch/multi/perform',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, multiTouchAction);

};
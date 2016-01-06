/**
 * Performs multiple touch actions. The action object is an array and its
 * objects have to contain the action name (longPress, press, tap, wait,
 * moveTo, release) and additional information about either the element, x/y
 * coordinates or touch counts.
 *
 * <example>
    :simpleDragAndDrop.js
    browser.touchPerform([
        { action: 'press', type: { x: 100, y: 250 }},
        { action: 'moveTo', type: { x: 300, y: 100 }},
        { action: 'release' }
    ]);
 * </example>
 *
 * @param {Object} actions  touch action as object or object[] with attributes like touchCount, x, y, duration
 *
 * @see  https://github.com/appium/node-mobile-json-wire-protocol/blob/master/docs/protocol-methods.md#mobile-json-wire-protocol-endpoints
 * @type mobile
 * @for android, ios
 *
 */

let touchMultiPerform = function (actions) {
    return this.requestHandler.create({
        path: '/session/:sessionId/touch/multi/perform',
        method: 'POST'
    }, { actions })
}

export default touchMultiPerform

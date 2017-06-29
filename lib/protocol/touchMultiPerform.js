/**
 * Performs multiple touch actions. The action object is an array and its
 * objects have to contain the action name (longPress, press, tap, wait,
 * moveTo, release) and additional information about either the element, x/y
 * coordinates or touch counts.
 *
 * <example>
    :simpleDragAndDrop.js
    browser.touchMultiPerform([
        { action: 'press', options: { x: 100, y: 250 }},
        { action: 'moveTo', options: { x: 300, y: 100 }},
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

export default function touchMultiPerform (actions) {
    return this.requestHandler.create({
        path: '/session/:sessionId/touch/multi/perform',
        method: 'POST'
    }, { actions })
}

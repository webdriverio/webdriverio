/**
 *
 * The Touch Action API provides the basis of all gestures that can be automated in Appium.
 * It is currently only available to native apps and can not be used to interact with webapps.
 * At its core is the ability to chain together _ad hoc_ individual actions, which will then be
 * applied to an element in the application on the device. The basic actions that can be used are:
 *
 * - press (pass selector or (x,y) or both)
 * - longPress (pass selector or (x,y) or both)
 * - tap (pass selector or (x,y) or both)
 * - moveTo (pass selector or (x,y) or both)
 * - wait (pass ms (as milliseconds))
 * - release (no arguments)
 *
 * If you use the touchAction command with a selector you don't need to pass the selector to each
 * action. It will be propagated by the internally (if no x or y parameters are given).
 *
 * <example>
    :touchAction.js
    it('should do a touch gesture', function () {
        const screen = $('//UITextbox');

        // simple touch action on element
        browser.touchAction({
            action: 'tap',
            element: screen
        });

        // simple touch action x y variables
        // tap location is 30px right and 20px down relative from the viewport
        browser.touchAction({
            action: 'tap',
            x: 30,
            y:20
        })

        // simple touch action x y variables
        // tap location is 30px right and 20px down relative from the center of the element
        browser.touchAction({
            action: 'tap',
            x: 30,
            y:20,
            element: screen
        })

        // multi action on an element
        // drag&drop from position 200x200 down 100px
        browser.touchAction([
            { action: 'press', x: 200, y: 200 },
            { action: 'moveTo', x: 0, y: 100 },
            'release'
        ])
    });
 * </example>
 *
 * @param {String|Object[]} action    action to execute
 *
 * @see https://saucelabs.com/blog/appium-sauce-labs-bootcamp-chapter-2-touch-actions
 * @type mobile
 * @for android, ios
 * @uses mobile/performTouchAction, mobile/performMultiAction
 *
 */

import { touchAction as touchActionCommand } from '../constant'

export default function touchAction (...args) {
    return touchActionCommand.apply(this, args)
}

/**
 *
 * The Touch Action API provides the basis of all gestures that can be automated in Appium.
 * It is currently only available to native apps and can not be used to interact with webapps.
 * At its core is the ability to chain together _ad hoc_ individual actions, which will then be
 * applied to an element in the application on the device. The basic actions that can be used are:
 *
 * - press (pass element or (x,y) or both)
 * - longPress (pass element or (x,y) or both)
 * - tap (pass element or (x,y) or both)
 * - moveTo (pass absolute x,y coordinates)
 * - wait (pass ms (as milliseconds))
 * - release (no arguments)
 *
 * <example>
    :touchAction.js
    it('should do a touch gesture', function () {
        const screen = $('//UITextbox');

        // simple touch action on element
        screen.touchAction('tap');

        // simple touch action using selector and x y variables
        // tap location is 30px right and 20px down relative from the center of the element
        screen.touchAction({
            action: 'tap', x: 30, y:20
        })

        // multi action on an element (drag&drop)
        screen.touchAction([
            'press',
            { action: 'moveTo', x: 200, y: 300 },
            'release'
        ])

        // drag&drop to element
        const otherElement = $('//UIAApplication[1]/UIAElement[2]')
        screen.touchAction([
            'press',
            { action: 'moveTo', element: otherElement },
            'release'
        ])
    });
 * </example>
 *
 * @param {TouchActions} action    action to execute
 *
 * @see https://saucelabs.com/blog/appium-sauce-labs-bootcamp-chapter-2-touch-actions
 * @for android, ios
 *
 */

import { touchAction as touchActionCommand } from '../constant'

export default function touchAction (...args) {
    return touchActionCommand.apply(this, args)
}

import { touchAction as touchActionCommand } from '../constant.js'
import type { TouchActions } from '../../types.js'

/**
 *
 * The Touch Action API provides the basis of all gestures that can be automated in Appium.
 * It is currently only available to native apps and can not be used to interact with webapps.
 * At its core is the ability to chain together _ad hoc_ individual actions, which will then be
 * applied to an element in the application on the device. The basic actions that can be used are:
 *
 * - press (pass element or (`x`, `y`) or both)
 * - longPress (pass element or (`x`, `y`) or both)
 * - tap (pass element or (`x`, `y`) or both)
 * - moveTo (pass absolute `x`, `y` coordinates)
 * - wait (pass `ms` (as milliseconds))
 * - release (no arguments)
 *
 * <example>
    :touchAction.js
    it('should do a touch gesture', async () => {
        const screen = await $('//UITextbox');

        // simple touch action on element
        await browser.touchAction({
            action: 'tap',
            element: screen
        });

        // simple touch action x y variables
        // tap location is 30px right and 20px down relative from the viewport
        await browser.touchAction({
            action: 'tap',
            x: 30,
            y:20
        })

        // simple touch action x y variables
        // tap location is 30px right and 20px down relative from the center of the element
        await browser.touchAction({
            action: 'tap',
            x: 30,
            y:20,
            element: screen
        })

        // multi action on an element
        // drag&drop from position 200x200 down 100px on the screen
        await browser.touchAction([
            { action: 'press', x: 200, y: 200 },
            { action: 'moveTo', x: 200, y: 300 },
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
export function touchAction (
    this: WebdriverIO.Browser,
    actions: TouchActions
) {
    return touchActionCommand.call(this, actions)
}

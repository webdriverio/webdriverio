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
        screen.touchAction('tap');

        // simple touch action using selector and x y variables
        // tap location is 30px right and 20px down relative from the center of the element
        screen.touchAction({
            action: 'tap', x: 30, y:20
        })

        // multi action on an element (drag&drop)
        screen.touchAction([
            'press',
            { action: 'moveTo', x: 200, y: 0 },
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
 * @param {String|Object[]} action    action to execute
 *
 * @see https://saucelabs.com/blog/appium-sauce-labs-bootcamp-chapter-2-touch-actions
 * @type mobile
 * @for android, ios
 * @uses mobile/performTouchAction, mobile/performMultiAction
 *
 */

const TOUCH_ACTIONS = ['press', 'longPress', 'tap', 'moveTo', 'wait', 'release']
const POS_ACTIONS = TOUCH_ACTIONS.slice(0, 4)
const ACCEPTED_OPTIONS = ['x', 'y', 'element']

export default function touchAction (actions) {
    if (!Array.isArray(actions)) {
        actions = [actions]
    }

    const formattedAction = formatArgs(this, actions)
    const protocolCommand = Array.isArray(actions[0]) ? ::this.multiTouchPerform : ::this.touchPerform
    formattedAction.forEach((params) => validateParameters(params))
    return protocolCommand(formattedAction)
}

let formatArgs = function (scope, actions) {
    return actions.map((action) => {
        if (Array.isArray(action)) {
            return formatArgs(scope, action)
        }

        if (typeof action === 'string') {
            action = { action }
        }

        const formattedAction = { action: action.action, options: {} }

        /**
         * don't propagate for actions that don't require element options
         */
        if (POS_ACTIONS.includes(action.action)) {
            formattedAction.options.element = action.element && typeof action.element.elementId === 'string'
                ? action.element.elementId
                : scope.elementId
        }

        if (isFinite(action.x)) formattedAction.options.x = action.x
        if (isFinite(action.y)) formattedAction.options.y = action.y
        if (action.ms) formattedAction.options.ms = action.ms

        /**
         * remove options property if empty
         */
        if (Object.keys(formattedAction.options).length === 0) {
            delete formattedAction.options
        }

        return formattedAction
    })
}

/**
 * Make sure action has proper options before sending command to Appium.
 *
 * @param  {Object} params  touchAction parameters
 * @return null
 */
const validateParameters = (params) => {
    const options = Object.keys(params.options || {})
    if (params.action === 'release' && options.length !== 0) {
        throw new Error(
            'action "release" doesn\'t accept any options ' +
            `("${options.join('", "')}" found)`
        )
    }

    if (
        params.action === 'wait' &&
        (options.includes('x') || options.includes('y'))
    ) {
        throw new Error('action "wait" doesn\'t accept x or y options')
    }

    if (POS_ACTIONS.includes(params.action)) {
        for (const option in params.options) {
            if (!ACCEPTED_OPTIONS.includes(option)) {
                throw new Error(`action "${params.action}" doesn't accept "${option}" as option`)
            }
        }

        if (options.length === 0) {
            throw new Error(
                `Touch actions like "${params.action}" need at least some kind of ` +
                'position information like "element", "x" or "y" options, you\'ve none given.'
            )
        }
    }
}

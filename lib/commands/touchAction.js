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
        var screen = $('//UITextbox');

        // simple touch action on element
        screen.touchAction('tap');
        // same as
        browser.touchAction('//UITextbox', 'tap')

        // simple touch action using x y variables
        browser.touchAction({
            actions: 'tap', x: 300, y:200
        })

        // simple touch action using selector and x y variables
        // tap location is 30px right and 20px down relative from the center of the element
        browser.touchAction({
            actions: 'tap', x: 30, y:20, selector: '//UIAApplication[1]/UIAElement[2]'
        })

        // multi action on an element (drag&drop)
        screen.touchAction([
            'press',
            { action: 'moveTo', x: 200, y: 0 },
            'release'
        ])
        // same as
        browser.touchAction('//UITextbox', [
            'press',
            { action: 'moveTo', x: 200, y: 0},
            'release'
        ])

        // drag&drop to element
        screen.touchAction([
            'press',
            { action: 'moveTo', selector: '//UIAApplication[1]/UIAElement[2]' },
            'release'
        ]))
    });

    :multiTouchAction.js
    it('should do a multitouch gesture', function () {
        // drag&drop with two fingers 200px down
        browser.touchAction([
            [{action: 'press', x:  10, y: 10}, { action: 'moveTo', x: 0, y: 200 }, 'release'],
            [{action: 'press', x: 100, y: 10}, { action: 'moveTo', x: 0, y: 200 }, 'release']]
        ])
    })
 * </example>
 *
 * @param {String} selector  selector to execute the touchAction on
 * @param {String} action    action to execute
 *
 * @see https://saucelabs.com/blog/appium-sauce-labs-bootcamp-chapter-2-touch-actions
 * @type mobile
 * @for android, ios
 * @uses mobile/performTouchAction, mobile/performMultiAction
 *
 */

const TOUCH_ACTIONS = ['press', 'longPress', 'tap', 'moveTo', 'wait', 'release']
const POS_ACTIONS = TOUCH_ACTIONS.slice(0, -2)
const ACCEPTED_OPTIONS = ['x', 'y', 'selector', 'element']

export default function touchAction (selector, actions) {
    if (typeof selector !== 'string' || TOUCH_ACTIONS.indexOf(selector) > -1) {
        actions = selector
        selector = this.lastResult
    }

    if (!Array.isArray(actions)) {
        actions = [actions]
    }

    /**
     * check if multiAction
     */
    if (Array.isArray(actions[0])) {
        actions = formatArgs(selector, actions)
        return Promise.all(getSelectors.call(this, actions, true)).then((jsonElements) => {
            actions = replaceSelectorsById(actions, jsonElements)
            return this.performMultiAction({ actions })
        })
    }

    actions = formatArgs(selector, actions)
    return Promise.all(getSelectors.call(this, actions)).then((jsonElements) => {
        actions = replaceSelectorsById(actions, jsonElements)
        return this.performTouchAction({ actions })
    })
}

/**
 * helper to determine if action has proper option arguments
 * ('press', 'longPress', 'tap', 'moveTo' need at least some kind of position information)
 * @param  {String}  action  name of action
 * @param  {Object}  options action options
 * @return {Boolean}         True if don't need any options or has a position option
 */
let hasValidActionOptions = function (action, options) {
    return POS_ACTIONS.indexOf(action) < 0 || (POS_ACTIONS.indexOf(action) > -1 && Object.keys(options).length > 0)
}

let formatArgs = function (selector, actions) {
    return actions.map((action) => {
        if (Array.isArray(action)) {
            return formatArgs(selector, action)
        }

        const formattedAction = { action: action.action, options: {} }

        /**
         * propagate selector or element to options object
         */
        if (
            selector &&
            // selector is given as string `e.g. browser.touchAction(selector, 'tap')`
            typeof selector === 'string' &&
            // don't propagate for actions that don't require element options
            POS_ACTIONS.indexOf(typeof action === 'string' ? action : formattedAction.action) > -1 &&
            // don't propagate if user has x and y set
            !(isFinite(action.x) && isFinite(action.y))
        ) {
            formattedAction.options.selector = selector
        } else if (
            selector &&
            // selector is given by previous command
            // e.g. $(selector).touchAction('tap')
            selector.value &&
            // don't propagate for actions that don't require element options
            POS_ACTIONS.indexOf(typeof action === 'string' ? action : formattedAction.action) > -1 &&
            // don't propagate if user has x and y set
            !(isFinite(action.x) && isFinite(action.y))
        ) {
            formattedAction.options.element = selector.value.ELEMENT
        }

        if (typeof action === 'string') {
            if (!hasValidActionOptions(action, formattedAction.options)) {
                throw new Error(
                    `Touch action "${action}" doesn't have proper options. Make sure certain actions like ` +
                    `${POS_ACTIONS.join(', ')} have position options like "selector", "x" or "y".`
                )
            }

            formattedAction.action = action

            /**
             * remove options property if empyt
             */
            if (Object.keys(formattedAction.options).length === 0) {
                delete formattedAction.options
            }

            return formattedAction
        }

        if (isFinite(action.x)) formattedAction.options.x = action.x
        if (isFinite(action.y)) formattedAction.options.y = action.y
        if (action.ms) formattedAction.options.ms = action.ms

        if (action.selector && POS_ACTIONS.indexOf(formattedAction.action) > -1) {
            formattedAction.options.selector = action.selector
        }

        if (action.element) {
            formattedAction.options.element = action.element
            delete formattedAction.options.selector
        }

        /**
         * remove options property if empyt
         */
        if (Object.keys(formattedAction.options).length === 0) {
            delete formattedAction.options
        }

        /**
         * option check
         * make sure action has proper options before sending command to Appium
         */
        if (formattedAction.action === 'release' && formattedAction.options) {
            throw new Error(
                'action "release" doesn\'t accept any options ' +
                `("${Object.keys(formattedAction.options).join('", "')}" found)`
            )
        } else if (
            formattedAction.action === 'wait' &&
            (Object.keys(formattedAction.options).indexOf('x') > -1 || Object.keys(formattedAction.options).indexOf('y') > -1)
        ) {
            throw new Error('action "wait" doesn\'t accept x, y options')
        } else if (POS_ACTIONS.indexOf(formattedAction.action) > -1) {
            for (const option in formattedAction.options) {
                if (ACCEPTED_OPTIONS.indexOf(option) === -1) {
                    throw new Error(`action "${formattedAction.action}" doesn't accept "${option}" as option`)
                }
            }

            if (Object.keys(formattedAction.options || {}).length === 0) {
                throw new Error(
                    `Touch actions like "${formattedAction.action}" need at least some kind of ` +
                    'position information like "selector", "x" or "y" options, you\'ve none given.'
                )
            }
        }

        return formattedAction
    })
}

let getSelectors = function (actions, isMultiAction = false) {
    let queriedSelectors = []

    /**
     * flatten actions array
     */
    if (isMultiAction) {
        actions = [].concat.apply([], actions)
    }

    return actions
        /**
         * map down to list of selectors
         */
        .map((action) => action.options && action.options.selector)
        /**
         * filter actions without selector and unique selectors
         */
        .filter((selector) => {
            const res = Boolean(selector) && queriedSelectors.indexOf(selector) === -1
            queriedSelectors.push(selector)
            return res
        })
        /**
         * call element command on selectors
         */
        .map((selector) => this.element(selector))
}

/**
 * replaces selector action properties with element ids after they got fetched
 * @param  {Object[]} actions  list of actions
 * @param  {Object[]} elements list of fetched elements
 * @return {Object[]}          list of actions with proper element ids
 */
let replaceSelectorsById = function (actions, elements) {
    return actions.map((action) => {
        if (Array.isArray(action)) {
            return replaceSelectorsById(action, elements)
        }

        if (!action.options || !action.options.selector) {
            return action
        }

        elements.forEach((element) => {
            if (action.options.selector === element.selector) {
                action.options.element = element.value.ELEMENT
                delete action.options.selector
            }
        })

        return action
    })
}

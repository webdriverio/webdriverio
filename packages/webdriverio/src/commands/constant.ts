import type { TouchAction, TouchActions } from '../types.js'

/**
 * Constants around commands
 */
const TOUCH_ACTIONS = ['press', 'longPress', 'tap', 'moveTo', 'wait', 'release']
const POS_ACTIONS = TOUCH_ACTIONS.slice(0, 4)
const ACCEPTED_OPTIONS = ['x', 'y', 'element']

interface FormattedTouchAction extends Omit<TouchAction, 'element'> {
    element?: string
}

interface FormattedActions {
    action: string
    options?: FormattedTouchAction
}

export const formatArgs = function (
    scope: WebdriverIO.Browser | WebdriverIO.Element,
    actions: TouchActions[]
): FormattedActions[] {
    return actions.map((action: TouchAction) => {
        if (Array.isArray(action)) {
            return formatArgs(scope, action) as any
        }

        if (typeof action === 'string') {
            action = { action }
        }

        const formattedAction: FormattedActions = {
            action: action.action,
            options: {} as FormattedTouchAction
        }

        /**
         * don't propagate for actions that don't require element options
         */
        const actionElement = action.element && typeof (action.element as any as WebdriverIO.Element).elementId === 'string'
            ? (action.element as any as WebdriverIO.Element).elementId
            : (scope as WebdriverIO.Element).elementId
        if (POS_ACTIONS.includes(action.action) && formattedAction.options && actionElement) {
            formattedAction.options.element = actionElement
        }

        if (formattedAction.options && typeof action.x === 'number' && isFinite(action.x)) {
            formattedAction.options.x = action.x
        }
        if (formattedAction.options && typeof action.y === 'number' && isFinite(action.y)) {
            formattedAction.options.y = action.y
        }
        if (formattedAction.options && action.ms) {
            formattedAction.options.ms = action.ms
        }

        /**
         * remove options property if empty
         */
        if (formattedAction.options && Object.keys(formattedAction.options).length === 0) {
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
export const validateParameters = (params: FormattedActions) => {
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

export const touchAction = function (
    this: WebdriverIO.Browser | WebdriverIO.Element,
    actions: TouchActions
) {
    if (!this.multiTouchPerform || !this.touchPerform) {
        throw new Error('touchAction can be used with Appium only.')
    }
    if (!Array.isArray(actions)) {
        actions = [actions as TouchAction]
    }

    const formattedAction = formatArgs(this, actions)
    const protocolCommand = Array.isArray(actions[0])
        // cast old JSONWP
        ? this.multiTouchPerform.bind(this) as unknown as (actions: object[]) => Promise<void>
        : this.touchPerform.bind(this)
    formattedAction.forEach((params) => validateParameters(params))
    return protocolCommand(formattedAction)
}

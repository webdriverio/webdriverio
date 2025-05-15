import { type remote } from 'webdriver'

import type { KeyActionType } from './base.js'
import BaseAction from './base.js'

const buttonNumbers = [0, 1, 2] as const
const buttonNames = ['left', 'middle', 'right'] as const
export const buttonValue = [...buttonNumbers, ...buttonNames] as const
export type ButtonNames = 'left' | 'middle' | 'right'
export type Button = 0 | 1 | 2

const ORIGIN_DEFAULT: remote.InputOrigin = 'viewport'
const BUTTON_DEFAULT: Button = 0
const POINTER_TYPE_DEFAULT: KeyActionType = 'mouse'

type PointerActionUpParams = {
    /**
     * The button to press (e.g. 0 for left, 1 for middle or 2 for right)
     * @default 0
     */
    button: Button | ButtonNames
}
const UP_PARAM_DEFAULTS: PointerActionUpParams = {
    button: BUTTON_DEFAULT
} as PointerActionUpParams

const PARAM_DEFAULTS = {
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    altitudeAngle: 0,
    azimuthAngle: 0
}
type PointerActionMoveParams = Omit<remote.InputPointerMoveAction, 'type' | 'origin'> & { origin?: 'viewport' | 'pointer' | WebdriverIO.Element }
type PointerActionParams = remote.InputPointerCommonProperties

function mapButton(params: PointerActionUpParams | PointerActionParams | ButtonNames | Button): number {
    const buttons = {
        left: 0,
        middle: 1,
        right: 2
    }
    if (typeof params === 'number') {
        return params
    }
    if (typeof params === 'string') {
        return buttons[params]
    }
    if ('button' in params) {
        return mapButton(params.button)
    }
    return BUTTON_DEFAULT
}

export default class PointerAction extends BaseAction {
    parameters: remote.InputPointerParameters
    actions: remote.InputPointerSourceAction[] = []

    constructor (instance: WebdriverIO.Browser, contextId: string, parameters?: remote.InputPointerParameters) {
        super(instance, contextId, 'pointer')
        this.parameters = parameters || { pointerType: POINTER_TYPE_DEFAULT }
    }

    /**
     * Pauses the action sequence for the specified duration.
     */
    pause(duration: number) {
        this.actions.push({ type: 'pause', duration })
        return this
    }

    /**
     * Creates an action for moving the pointer `x` and `y` pixels from the specified
     * `origin`. The `origin` may be defined as the pointers current position (e.g. "pointer"),
     * the viewport (e.g. "viewport") or the center of a specific element.
     * @param params PointerActionMoveParams
     */
    move (params: PointerActionMoveParams): PointerAction
    move (x: number, y: number): PointerAction
    move (params: PointerActionMoveParams | number, y?: number) {
        const origin: remote.InputOrigin | undefined = typeof params === 'object'
            ? typeof params.origin === 'string'
                ? params.origin
                : typeof params.origin === 'object'
                    ? { type: 'element', element: { sharedId: params.origin.elementId } }
                    : undefined
            : ORIGIN_DEFAULT

        const action: remote.InputPointerMoveAction = {
            type: 'pointerMove',
            duration: 100,
            origin,
            x: typeof params === 'number' ? params : (params as PointerActionMoveParams).x || 0,
            y: typeof y === 'number' ? y : (params as PointerActionMoveParams).y || 0
        }

        this.actions.push(action)
        return this
    }

    /**
     * Creates an action to release a single key.
     * @param params PointerActionUpParams
     */
    up (button?: Button): PointerAction
    up (button?: ButtonNames): PointerAction
    up (button?: PointerActionUpParams): PointerAction
    up (params: PointerActionUpParams | ButtonNames | Button = UP_PARAM_DEFAULTS) {
        const action: remote.InputPointerUpAction = {
            type: 'pointerUp',
            button: mapButton(params)
        }
        this.actions.push(action)
        return this
    }

    /**
     * Creates an action to press a single key
     * @param params PointerActionParams
     */
    down (button?: Button): PointerAction
    down (button?: ButtonNames): PointerAction
    down (params?: PointerActionParams): PointerAction
    down (params: PointerActionParams | Button | ButtonNames = {}) {
        const action: remote.InputPointerDownAction = {
            type: 'pointerDown',
            button: mapButton(params),
            ...PARAM_DEFAULTS,
            ...(typeof params === 'object' ? params : {})
        }

        this.actions.push(action)
        return this
    }
}

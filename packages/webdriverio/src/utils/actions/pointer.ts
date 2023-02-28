/* eslint-disable no-dupe-class-members */
import type { ElementReference } from '@wdio/protocols'
import type { BaseActionParams, KeyActionType } from './base.js'
import BaseAction from './base.js'
import type { ChainablePromiseElement } from '../../types.js'

export type ButtonNames = 'left' | 'middle' | 'right'
export type Button = 0 | 1 | 2
export type Origin = 'pointer' | 'viewport'

const ORIGIN_DEFAULT: Origin = 'viewport'
const BUTTON_DEFAULT: Button = 0
const POINTER_TYPE_DEFAULT: KeyActionType = 'mouse'

interface PointerActionUpParams {
    /**
     * The button to press (e.g. 0 for left, 1 for middle or 2 for right)
     * @default 0
     */
    button: Button
}
const UP_PARAM_DEFAULTS = {
    button: BUTTON_DEFAULT as Button
}

const PARAM_DEFAULTS = {
    ...UP_PARAM_DEFAULTS,
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
const MOVE_PARAM_DEFAULTS = {
    x: 0,
    y: 0,
    duration: 100,
    origin: ORIGIN_DEFAULT as (Origin | ElementReference | ChainablePromiseElement<WebdriverIO.Element> | WebdriverIO.Element)
}

type PointerActionParams = Partial<typeof PARAM_DEFAULTS> & Partial<PointerActionUpParams>
type PointerActionMoveParams = Partial<typeof MOVE_PARAM_DEFAULTS> & PointerActionParams

export default class PointerAction extends BaseAction {
    constructor (instance: WebdriverIO.Browser, params: BaseActionParams = {}) {
        if (!params.parameters) {
            params.parameters = { pointerType: POINTER_TYPE_DEFAULT }
        }

        super(instance, 'pointer', params)
    }

    /**
     * Creates an action for moving the pointer `x` and `y` pixels from the specified
     * `origin`. The `origin` may be defined as the pointers current position (e.g. "pointer"),
     * the viewport (e.g. "viewport") or the center of a specific element.
     * @param params PointerActionMoveParams
     */
    move (params: PointerActionMoveParams): PointerAction
    move (x: number, y: number): PointerAction
    move (params: PointerActionMoveParams | number = {}, y?: number) {
        const seq = {
            type: 'pointerMove',
            // default params
            ...PARAM_DEFAULTS,
            ...UP_PARAM_DEFAULTS,
            ...MOVE_PARAM_DEFAULTS,
        }

        if (typeof params === 'number') {
            Object.assign(seq, { x: params, y })
        } else if (params) {
            Object.assign(seq, params)
        }

        this.sequence.push(seq)
        return this
    }

    /**
     * Creates an action to release a single key.
     * @param params PointerActionUpParams
     */
    up (button?: ButtonNames): PointerAction
    up (params?: PointerActionUpParams): PointerAction
    up (params: PointerActionUpParams | ButtonNames = UP_PARAM_DEFAULTS) {
        this.sequence.push({
            type: 'pointerUp',
            button: typeof params === 'string'
                ? params === 'right' ? 2 : (params === 'middle' ? 1 : 0)
                : params.button
        })
        return this
    }

    /**
     * Creates an action to press a single key
     * @param params PointerActionParams
     */
    down (button?: ButtonNames): PointerAction
    down (params?: PointerActionParams): PointerAction
    down (params: PointerActionParams | ButtonNames = {}) {
        this.sequence.push({
            type: 'pointerDown',
            ...PARAM_DEFAULTS,
            ...(typeof params === 'string'
                ? { button: params === 'right' ? 2 : (params === 'middle' ? 1 : 0) }
                : params
            )
        })
        return this
    }

    /**
     * An action that cancels this pointer's current input.
     */
    cancel () {
        this.sequence.push({ type: 'pointerCancel' })
        return this
    }
}

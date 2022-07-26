import { ElementReference } from '@wdio/protocols'
import BaseAction, { BaseActionParams } from './base'

export type Button = 0 | 1 | 2
export type Origin = 'pointer' | 'viewport'

const ORIGIN_DEFAULT: Origin = 'viewport'
const BUTTON_DEFAULT: Button = 0
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
const MOVE_PARAM_DEFAULTS = {
    x: 0,
    y: 0,
    duration: 100,
    origin: ORIGIN_DEFAULT as (Origin | ElementReference)
}
const UP_PARAM_DEFAULTS = {
    button: BUTTON_DEFAULT as Button
}
type PointerActionUpParams = Partial<typeof UP_PARAM_DEFAULTS>
type PointerActionParams = Partial<typeof PARAM_DEFAULTS> & PointerActionUpParams
type PointerActionMoveParams = Partial<typeof MOVE_PARAM_DEFAULTS> & PointerActionParams

export default class PointerAction extends BaseAction {
    constructor (instance: WebdriverIO.Browser, params?: BaseActionParams) {
        super(instance, 'pointer', params)
    }

    move (params: PointerActionMoveParams = { ...PARAM_DEFAULTS, ...UP_PARAM_DEFAULTS, ...MOVE_PARAM_DEFAULTS }) {
        this.sequence.push({ type: 'pointerMove', ...params })
        return this
    }

    up (params: PointerActionUpParams = UP_PARAM_DEFAULTS) {
        this.sequence.push({ type: 'pointerUp', button: params.button })
        return this
    }

    down (params: PointerActionParams = PARAM_DEFAULTS) {
        this.sequence.push({ type: 'pointerDown', ...params })
        return this
    }

    cancel () {
        this.sequence.push({ type: 'pointerCancel' })
        return this
    }
}

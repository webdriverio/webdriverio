import BaseAction, { BaseActionParams } from './base'

interface ScrollParams {
    /**
     * starting x coordinate
     */
    x: number
    /**
     * starting y coordinate
     */
    y: number
    /**
     * Delta X to scroll to target
     */
    deltaX: number
    /**
     * Delta Y to scroll to target
     */
    deltaY: number
    /**
     * element origin
     */
    origin: WebdriverIO.Element
    /**
     * duration ratio be the ratio of time delta and duration
     */
    duration: number
}

export default class WheelAction extends BaseAction {
    constructor(instance: WebdriverIO.Browser, params?: BaseActionParams) {
        super(instance, 'wheel', params)
    }

    /**
     * Scrolls a page via the coordinates given
     */
    scroll(params?: Partial<ScrollParams>) {
        this.sequence.push({ type: 'scroll', ...params })
        return this
    }
}

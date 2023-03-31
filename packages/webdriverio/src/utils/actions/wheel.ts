import type { BaseActionParams } from './base.js'
import BaseAction from './base.js'
import type { ChainablePromiseElement } from '../../types.js'

export interface ScrollParams {
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
    origin?: WebdriverIO.Element | ChainablePromiseElement<WebdriverIO.Element>
    /**
     * duration ratio be the ratio of time delta and duration
     */
    duration: number
}

const DEFAULT_SCROLL_PARAMS: ScrollParams = {
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    duration: 0
}

export default class WheelAction extends BaseAction {
    constructor(instance: WebdriverIO.Browser, params?: BaseActionParams) {
        super(instance, 'wheel', params)
    }

    /**
     * Scrolls a page to given coordinates or origin.
     */
    scroll(params?: Partial<ScrollParams>) {
        this.sequence.push({ type: 'scroll', ...DEFAULT_SCROLL_PARAMS, ...params })
        return this
    }
}

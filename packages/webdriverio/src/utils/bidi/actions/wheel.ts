import { type remote } from 'webdriver'

import BaseAction from './base.js'

type ScrollParams = Pick<remote.InputWheelScrollAction, 'x' | 'y' | 'deltaX' | 'deltaY' | 'duration'>
const DEFAULT_SCROLL_PARAMS: ScrollParams = {
    x: 0,
    y: 0,
    deltaX: 0,
    deltaY: 0,
    duration: 0
}

export default class WheelAction extends BaseAction {
    actions: remote.InputWheelSourceAction[] = []
    parameters = undefined

    constructor(instance: WebdriverIO.Browser, contextId: string) {
        super(instance, contextId, 'wheel')
    }

    /**
     * Scrolls a page to given coordinates or origin.
     */
    scroll(params?: Partial<ScrollParams>) {
        this.actions.push({ type: 'scroll', ...DEFAULT_SCROLL_PARAMS, ...params })
        return this
    }

    /**
     * Pauses the action sequence for the specified duration.
     */
    pause(duration: number) {
        this.actions.push({ type: 'pause', duration })
        return this
    }
}

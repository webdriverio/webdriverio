import { type remote } from 'webdriver'

import BaseAction from './base.js'

export default class NoneAction extends BaseAction {
    actions: remote.InputNoneSourceAction[] = []
    parameters = undefined

    constructor(instance: WebdriverIO.Browser, contextId: string) {
        super(instance, contextId, 'none')
    }

    /**
     * Pauses the action sequence for the specified duration.
     */
    pause(duration: number) {
        this.actions.push({ type: 'pause', duration })
        return this
    }
}

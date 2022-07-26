import BaseAction, { BaseActionParams } from './base'

export default class KeyAction extends BaseAction {
    constructor (instance: WebdriverIO.Browser, params?: BaseActionParams) {
        super(instance, 'key', params)
    }

    up (value: string) {
        this.sequence.push({ type: 'keyUp', value })
        return this
    }

    down (value: string) {
        this.sequence.push({ type: 'keyDown', value })
        return this
    }

    cancel () {
        this.sequence.push({ type: 'pointerCancel' })
        return this
    }
}

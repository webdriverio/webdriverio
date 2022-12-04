import BaseAction, { BaseActionParams } from './base.js'
import type { Browser } from '../../types'

export default class KeyAction extends BaseAction {
    constructor (instance: Browser<'async'>, params?: BaseActionParams) {
        super(instance, 'key', params)
    }

    /**
     * Generates a key up action.
     * @param value key value
     */
    up (value: string) {
        this.sequence.push({ type: 'keyUp', value })
        return this
    }

    /**
     * Generates a key down action.
     * @param value key value
     */
    down (value: string) {
        this.sequence.push({ type: 'keyDown', value })
        return this
    }
}

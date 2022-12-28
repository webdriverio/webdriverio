import os from 'node:os'
import type { Capabilities } from '@wdio/types'

import type { BaseActionParams } from './base.js'
import BaseAction from './base.js'
import { Key } from '../../constants.js'

export default class KeyAction extends BaseAction {
    constructor (instance: WebdriverIO.Browser, params?: BaseActionParams) {
        super(instance, 'key', params)
    }

    #sanitizeKey (value: string) {
        if (typeof value !== 'string') {
            throw new Error(`Invalid type for key input: "${typeof value}", expected a string!`)
        }

        const platformName = (this.instance.capabilities as Capabilities.Capabilities).platformName
        const isMac = (
            // check capabilities first
            platformName && platformName.match(/mac(\s)*os/i) ||
            // if not set, expect we run locally
            os.type().match(/darwin/i)
        )

        if (value === Key.Ctrl) {
            return isMac ? Key.Command : Key.Control
        }

        if (value.length > 1) {
            throw new Error(`Your key input contains more than one character: "${value}", only one is allowed though!`)
        }

        return value
    }

    /**
     * Generates a key up action.
     * @param value key value
     */
    up (value: string) {
        this.sequence.push({ type: 'keyUp', value: this.#sanitizeKey(value) })
        return this
    }

    /**
     * Generates a key down action.
     * @param value key value
     */
    down (value: string) {
        this.sequence.push({ type: 'keyDown', value: this.#sanitizeKey(value) })
        return this
    }
}

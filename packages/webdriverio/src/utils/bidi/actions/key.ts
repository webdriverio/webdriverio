import { type remote } from 'webdriver'

import BaseAction from './base.js'
import { environment } from '../../../environment.js'
import { Key } from '../../../constants.js'

export default class KeyAction extends BaseAction {
    actions: remote.InputKeySourceAction[] = []
    parameters = undefined

    constructor (instance: WebdriverIO.Browser, contextId: string) {
        super(instance, contextId, 'key')
    }

    #sanitizeKey (value: string) {
        if (typeof value !== 'string') {
            throw new Error(`Invalid type for key input: "${typeof value}", expected a string!`)
        }

        const platformName = (this.instance.capabilities as WebdriverIO.Capabilities).platformName
        const isMac = (
            // check capabilities first
            platformName && platformName.match(/mac(\s)*os/i) ||
            // if not set, expect we run locally
            (this.instance.options.hostname?.match(/0\.0\.0\.0|127\.0\.0\.1|local/i) && environment.value.osType().match(/darwin/i))
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
     * Pauses the action sequence for the specified duration.
     */
    pause(duration: number) {
        this.actions.push({ type: 'pause', duration })
        return this
    }

    /**
     * Generates a key up action.
     * @param value key value
     */
    up (value: string) {
        this.actions.push({ type: 'keyUp', value: this.#sanitizeKey(value) })
        return this
    }

    /**
     * Generates a key down action.
     * @param value key value
     */
    down (value: string) {
        this.actions.push({ type: 'keyDown', value: this.#sanitizeKey(value) })
        return this
    }
}

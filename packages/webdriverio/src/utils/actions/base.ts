import { ELEMENT_KEY } from '../../constants.js'

export type ActionType = 'key' | 'pointer' | 'wheel'
export type KeyActionType = 'mouse' | 'pen' | 'touch'
export interface ActionParameters {
    pointerType?: KeyActionType
}
export interface BaseActionParams {
    id?: string,
    parameters?: ActionParameters
}

let actionIds = 0

export default class BaseAction {
    #id: string
    #type: ActionType
    #parameters: ActionParameters
    #instance: WebdriverIO.Browser
    protected sequence: any[] = []

    constructor (
        protected instance: WebdriverIO.Browser,
        type: ActionType,
        params?: BaseActionParams
    ) {
        this.#instance = instance
        this.#id = params?.id || `action${++actionIds}`
        this.#type = type
        this.#parameters = params?.parameters || {}
    }

    toJSON () {
        return {
            id: this.#id,
            type: this.#type,
            parameters: this.#parameters,
            actions: this.sequence
        }
    }

    /**
     * Inserts a pause action for the specified device, ensuring it idles for a tick.
     * @param duration idle time of tick
     */
    pause (duration: number) {
        this.sequence.push({ type: 'pause', duration })
        return this
    }

    /**
     * Perform action sequence
     * @param skipRelease set to true if `releaseActions` command should not be invoked
     */
    async perform (skipRelease = false) {
        /**
         * transform chainable / not resolved elements into WDIO elements
         */
        for (const seq of this.sequence) {
            /**
             * continue if we don't deal with origin or elements within
             * origin at all
             */
            if (!seq.origin || typeof seq.origin === 'string') {
                continue
            }

            /**
             * resolve promise element
             */
            if (typeof seq.origin.then === 'function') {
                await seq.origin.waitForExist()
                seq.origin = await seq.origin
            }

            if (!seq.origin[ELEMENT_KEY]) {
                throw new Error(`Couldn't find element for "${seq.type}" action sequence`)
            }

            seq.origin = { [ELEMENT_KEY]: seq.origin[ELEMENT_KEY] }
        }

        await this.#instance.performActions([this.toJSON()])
        if (!skipRelease) {
            await this.#instance.releaseActions()
        }
    }
}

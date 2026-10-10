import { ELEMENT_KEY } from 'webdriver'
import type { remote } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'
import { getBrowserObject } from '@wdio/utils'

import { foreignContextId, isBrowsingContext } from '../../session/browsingContext.js'

export type ActionType = 'key' | 'pointer' | 'wheel'
export type KeyActionType = 'mouse' | 'pen' | 'touch'
export interface ActionParameters {
    pointerType?: KeyActionType
}
export interface BaseActionParams {
    id?: string,
    parameters?: ActionParameters
}

interface Sequence {
    type: string
    duration?: number
    origin?: (ElementReference | WebdriverIO.Element | 'pointer' | 'viewport') & { then?: Function }
    value?: string
}

/**
 * Separate counters for each action type to ensure W3C WebDriver compliance.
 * According to the spec, each input source ID must always map to the same action type
 * throughout the session duration.
 */
let keyActionIds = 0
let pointerActionIds = 0
let wheelActionIds = 0

export default class BaseAction {
    #id: string
    #type: ActionType
    #parameters: ActionParameters
    #instance: WebdriverIO.Browser | WebdriverIO.BrowsingContext
    protected sequence: Sequence[] = []

    constructor(
        protected instance: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
        type: ActionType,
        params?: BaseActionParams
    ) {
        this.#instance = instance

        /**
         * Generate type-specific IDs to prevent conflicts when mixing action types.
         * This ensures compliance with W3C WebDriver spec which requires each input
         * source ID to consistently map to the same action type.
         */
        if (params?.id) {
            this.#id = params.id
        } else {
            switch (type) {
            case 'key':
                this.#id = `key${++keyActionIds}`
                break
            case 'pointer':
                this.#id = `pointer${++pointerActionIds}`
                break
            case 'wheel':
                this.#id = `wheel${++wheelActionIds}`
                break
            default:
                this.#id = `action${type}`
            }
        }

        this.#type = type
        this.#parameters = params?.parameters || {}
    }

    toJSON() {
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
    pause(duration: number) {
        this.sequence.push({ type: 'pause', duration })
        return this
    }

    /**
     * Perform action sequence
     * @param skipRelease set to true if `releaseActions` command should not be invoked
     */
    async perform(skipRelease = false) {
        /**
         * transform chainable / not resolved elements into WDIO elements
         */
        let originContext: string | undefined
        for (const seq of this.sequence) {
            /**
             * continue if we don't deal with origin or elements within
             * origin at all
             */
            if (!seq.origin || typeof seq.origin === 'string') {
                continue
            }

            /**
             * resolve promise element, and wait for a loaded element that wasn't
             * on the page when it was looked up, as a command of the element does
             */
            const origin = seq.origin as WebdriverIO.Element
            if (typeof seq.origin.then === 'function' || (typeof origin.waitForExist === 'function' && !origin.elementId)) {
                await origin.waitForExist()
                seq.origin = await seq.origin
            }

            const foreign = await foreignContextId(seq.origin as WebdriverIO.Element)
            if (foreign) {
                originContext = foreign
            }

            if (!seq.origin[ELEMENT_KEY]) {
                throw new Error(`Couldn't find element for "${seq.type}" action sequence`)
            }

            seq.origin = { [ELEMENT_KEY]: seq.origin[ELEMENT_KEY] }
        }

        const browser = getBrowserObject(this.#instance)
        const sequence = [this.toJSON()]
        const contextId = isBrowsingContext(this.#instance) ? this.#instance.contextId : originContext
        if (contextId) {
            const actions = sequence.map((source) => ({
                ...source,
                actions: source.actions.map((action) => {
                    /**
                     * A pointer move into another navigable starts from the last
                     * top-level position. The default 100ms interpolation crosses
                     * the frame and fires mouse events an in-frame action does not.
                     * An instant move lands on the element. A chosen duration stays.
                     */
                    const instant = action.type === 'pointerMove' && action.duration === 100
                        ? { ...action, duration: 0 }
                        : action
                    const origin = (instant as { origin?: ElementReference }).origin
                    if (!origin || typeof origin !== 'object' || !(ELEMENT_KEY in origin)) {
                        return instant
                    }
                    return {
                        ...instant,
                        origin: {
                            type: 'element' as const,
                            element: { sharedId: origin[ELEMENT_KEY] }
                        }
                    }
                })
            }))
            await browser.inputPerformActions({
                context: contextId,
                actions: actions as remote.InputSourceActions[]
            })
            if (!skipRelease) {
                await browser.inputReleaseActions({ context: contextId })
            }
            return
        }

        await browser.performActions(sequence)
        if (!skipRelease) {
            await browser.releaseActions()
        }
    }
}

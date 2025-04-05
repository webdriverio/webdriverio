import { type remote } from 'webdriver'

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

export default abstract class BaseAction {
    abstract actions: remote.InputSourceActions['actions']
    abstract parameters?: remote.InputPointerParameters

    #contextId: string
    #id: string
    #type: remote.InputSourceActions['type']
    #instance: WebdriverIO.Browser

    constructor (
        protected instance: WebdriverIO.Browser,
        contextId: string,
        type: remote.InputSourceActions['type'],
    ) {
        this.#instance = instance
        this.#contextId = contextId
        this.#id = `action${++actionIds}`
        this.#type = type
    }

    toJSON (): remote.InputSourceActions {
        return this.#type === 'pointer'
            ? {
                id: this.#id,
                type: this.#type,
                actions: this.actions as remote.InputPointerSourceAction[],
                parameters: this.parameters
            }
            : {
                id: this.#id,
                type: this.#type,
                actions: this.actions
            } as remote.InputSourceActions
    }

    /**
     * Perform action sequence
     * @param skipRelease set to true if `releaseActions` command should not be invoked
     */
    async perform (skipRelease = false) {
        await this.#instance.inputPerformActions({
            actions: [this.toJSON()],
            context: this.#contextId
        })

        if (!skipRelease) {
            await this.#instance.inputReleaseActions({
                context: this.#contextId
            })
        }
    }
}

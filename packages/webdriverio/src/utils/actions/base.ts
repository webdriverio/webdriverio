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

    pause (duration: number) {
        this.sequence.push({ type: 'pause', duration })
        return this
    }

    /**
     * Perform action sequence
     * @param skipRelease set to true if `releaseActions` command should not be invoked
     */
    async perform (skipRelease = false) {
        await this.#instance.performActions([this.toJSON()])
        if (!skipRelease) {
            await this.#instance.releaseActions()
        }
    }
}

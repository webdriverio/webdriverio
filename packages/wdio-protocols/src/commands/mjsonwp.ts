import type { Context } from '../types'

// mjsonwp types
export default interface MjsonwpCommands {
    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#webviews-and-other-contexts
     *
     */
    getContext(): Context

    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#webviews-and-other-contexts
     *
     */
    switchContext(name: string): void

    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#webviews-and-other-contexts
     *
     */
    getContexts(): Context[]

    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md#mobile-json-wire-protocol-endpoints
     *
     */
    getPageIndex(): string

    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#device-modes
     *
     */
    getNetworkConnection(): number

    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#device-modes
     *
     */
    setNetworkConnection(type: number): void

    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#touch-gestures
     *
     */
    touchPerform(actions: object[]): void

    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/SeleniumHQ/mobile-spec/blob/master/spec-draft.md#touch-gestures
     *
     */
    multiTouchPerform(actions: object[], elementId: object[]): void

    /**
     * Mjsonwp Protocol Command
     *
     * No description available, please see reference link.
     * @ref https://github.com/appium/appium-base-driver/blob/master/docs/mjsonwp/protocol-methods.md#mobile-json-wire-protocol-endpoints
     *
     */
    receiveAsyncResponse(status: string, value: string): void
}

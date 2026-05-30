
import { HookState } from '../states/hookState.js'
import { TestFrameworkState } from '../states/testFrameworkState.js'
import TrackedInstance from './trackedInstance.js'
import type TrackedContext from './trackedContext.js'

const now = new Date()

export default class TestFrameworkInstance extends TrackedInstance {
    testFrameworks: Array<string>
    testFrameworksVersions: Record<string, string>
    #currentTestState: State
    #currentHookState: State
    #lastTestState: State
    #lastHookState: State
    #createdAt: string

    /**
   * create TestFrameworkInstance
   * @param {TrackedContext} context
   * @param {Array} testFrameworks
   * @param {Map} testFrameworksVersions
   * @param {TestFrameworkState} testFrameworkState
   * @param {HookState} hookState
   */
    constructor(context: TrackedContext, testFrameworks: Array<string>, testFrameworksVersions: Record<string, string>, testFrameworkState: State, hookState: State) {
        super(context)
        this.testFrameworks = testFrameworks
        this.testFrameworksVersions = testFrameworksVersions
        this.#currentTestState = testFrameworkState
        this.#currentHookState = hookState
        this.#lastTestState = TestFrameworkState.NONE
        this.#lastHookState = HookState.NONE
        this.#createdAt = now.toLocaleString()
    }

    /**
   * get CurrentTestState of instance
   * @returns {*} - returns TestFramework State
   */
    getCurrentTestState() {
        return this.#currentTestState
    }

    /**
   * set CurrentTestState of instance
   * @param {TestFrameworkState} currentTestState - Set Current TestFramework State
   */
    setCurrentTestState(currentTestState: State) {
        this.setLastTestState(this.#currentTestState)
        this.#currentTestState = currentTestState
    }

    /**
   * get CurrentHookState of instance
   * @returns {HookState} - return current hook state.
   */
    getCurrentHookState() {
        return this.#currentHookState
    }

    /**
   * set CurrentHookState of instance
   * @param {HookState} currentHookState - set current hook state.
   */
    setCurrentHookState(currentHookState: State) {
        this.setLastHookState(this.#currentHookState)
        this.#currentHookState = currentHookState
    }

    /**
   * get LastTestState of instance
   * @returns {TestFrameworkState} - return last test framework state
   */
    getLastTestState() {
        return this.#lastTestState
    }

    /**
   * set LastTestState of instance
   * @param {TestFrameworkState} lastTestState - set last test framework state
   */
    setLastTestState(lastTestState: State) {
        this.#lastTestState = lastTestState
    }

    /**
   * get LastHookState of instance
   * @returns {HookState} get last hook state
   */
    getLastHookState() {
        return this.#lastHookState
    }

    /**
   * set LastHookState of instance
   * @param {HookState} lastHookState - returns late hook state
   */
    setLastHookState(lastHookState: State) {
        this.#lastHookState = lastHookState
    }

    /**
   * get CreatedAt of instance
   * @returns {string} - return created time
   */
    getCreatedAt() {
        return this.#createdAt
    }

}

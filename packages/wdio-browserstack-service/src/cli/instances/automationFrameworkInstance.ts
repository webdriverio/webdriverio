import type TrackedContext from './trackedContext.js'

import TrackedInstance from './trackedInstance.js'

/**
 * Class representing an automation framework instance
 * @extends TrackedInstance
 */
export default class AutomationFrameworkInstance extends TrackedInstance {
    frameworkName: string
    frameworkVersion: string
    state: State

    constructor(context: TrackedContext, frameworkName: string, frameworkVersion: string, state: State) {
        super(context)
        this.frameworkName = frameworkName
        this.frameworkVersion = frameworkVersion
        this.state = state
    }

    /**
   * Get the framework name
   * @returns {string} The name of the automation framework
   */
    getFrameworkName() {
        return this.frameworkName
    }

    /**
   * Get the framework version
   * @returns {string} The version of the automation framework
   */
    getFrameworkVersion() {
        return this.frameworkVersion
    }

    /**
   * Get the current state
   * @returns {AutomationFrameworkState} The current state of the automation framework
   */
    getState() {
        return this.state
    }

    /**
   * Set the current state
   * @param {AutomationFrameworkState} state - The new state to set
   */
    setState(state: State) {
        this.state = state
    }
}

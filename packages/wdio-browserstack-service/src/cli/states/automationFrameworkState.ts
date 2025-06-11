/**
 * Enum representing different states of an automation framework
 * @readonly
 * @enum {Object}
 */
export const AutomationFrameworkState = Object.freeze({
    /**
   * Initial state, no session created
   */
    NONE: {
        value: 0,
        toString() {
            return 'AutomationFrameworkState.NONE'
        }
    },

    /**
   * Framework instance is being created
   */
    CREATE: {
        value: 1,
        toString() {
            return 'AutomationFrameworkState.CREATE'
        }
    },

    /**
   * Framework is executing tests
   */
    EXECUTE: {
        value: 2,
        toString() {
            return 'AutomationFrameworkState.EXECUTE'
        }
    },

    /**
   * Framework is idle, not executing any tests
   */
    IDLE: {
        value: 3,
        toString() {
            return 'AutomationFrameworkState.IDLE'
        }
    },

    /**
   * Framework is shutting down
   */
    QUIT: {
        value: 4,
        toString() {
            return 'AutomationFrameworkState.QUIT'
        }
    }
})

/**
 * Get state by value
 *
 * @param {number} value - The numeric value of the state
 * @returns {Object|undefined} The state object or undefined if not found
 */
export const fromValue = function(value: number) {
    return Object.values(AutomationFrameworkState).find(state => state.value === value)
}

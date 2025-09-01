/**
 * Enum representing different states of a hook
 * @readonly
 * @enum {Object}
 */
export const HookState = Object.freeze({
    /**
     * No hook, initial state
     */
    NONE: {
        value: 0,
        toString() {
            return 'HookState.NONE'
        }
    },

    /**
     * Pre-execution hook
     */
    PRE: {
        value: 1,
        toString() {
            return 'HookState.PRE'
        }
    },

    /**
     * Post-execution hook
     */
    POST: {
        value: 2,
        toString() {
            return 'HookState.POST'
        }
    }
})

/**
   * Get hook state by value
   *
   * @param {number} value - The numeric value of the hook state
   * @returns {Object|undefined} The hook state object or undefined if not found
   */
export const fromValue = function(value: number) {
    return Object.values(HookState).find(state => state.value === value)
}

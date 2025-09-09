
/**
 * Enum representing different states of an automation framework
 * @readonly
 * @enum {Object}
 */
export const TestFrameworkState = Object.freeze({
    /**
     * Initial state, no session created
     */
    NONE: {
        value: 0,
        toString() {
            return 'TestFrameworkState.NONE'
        }
    },
    /**
     * Framework instance is being beforeAll
     */
    BEFORE_ALL: {
        value: 1,
        toString() {
            return 'TestFrameworkState.BEFORE_ALL'
        }
    },
    /**
     * Framework is in log state
     */
    LOG: {
        value: 2,
        toString() {
            return 'TestFrameworkState.LOG'
        }
    },
    /**
     * Framework is in setup fixture state
     */
    SETUP_FIXTURE: {
        value: 3,
        toString() {
            return 'TestFrameworkState.SETUP_FIXTURE'
        }
    },
    /**
     * Framework is in init test
     */
    INIT_TEST: {
        value: 4,
        toString() {
            return 'TestFrameworkState.INIT_TEST'
        }
    },
    /**
     * Framework is in beforeEach
     */
    BEFORE_EACH: {
        value: 5,
        toString() {
            return 'TestFrameworkState.BEFORE_EACH'
        }
    },
    /**
     * Framework is in afterEach
     */
    AFTER_EACH: {
        value: 6,
        toString() {
            return 'TestFrameworkState.AFTER_EACH'
        }
    },
    /**
     * Framework is test executing
     */
    TEST: {
        value: 7,
        toString() {
            return 'TestFrameworkState.TEST'
        }
    },
    /**
     * Framework is in step state
     */
    STEP: {
        value: 8,
        toString() {
            return 'TestFrameworkState.STEP'
        }
    },
    /**
     * Framework is log reporting state
     */
    LOG_REPORT: {
        value: 9,
        toString() {
            return 'TestFrameworkState.LOG_REPORT'
        }
    },
    /**
     * Framework is in afterAll state
     */
    AFTER_ALL: {
        value: 10,
        toString() {
            return 'TestFrameworkState.AFTER_ALL'
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
    return Object.values(TestFrameworkState).find(state => state.value === value)
}

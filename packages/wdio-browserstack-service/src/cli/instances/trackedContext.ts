export default class TrackedContext {
    #id: string
    #threadId: number
    #processId: number
    #type: string

    /**
   * Create TrackedContext
   * @param {number} string - string Id for context - VERIFY
   * @param {number} threadId- Integer Thread Id for context
   * @param {number} processId - Integer Process Id for context
   * @param {string} type
   */
    constructor(id: string, threadId: number, processId: number, type: string) {
        this.#id = id
        this.#threadId = threadId
        this.#processId = processId
        this.#type = type
    }

    /**
   * get TrackedContext thread id
   * @returns {number} - return thread id of context
   */
    getThreadId() {
        return this.#threadId
    }

    /**
   * get TrackedContext process id
   * @returns {number} - return process id of context
   */
    getProcessId() {
        return this.#processId
    }

    /**
   * get TrackedContext id
   * @returns {string} - returns context id
   */
    getId() {
        return this.#id
    }

    /**
   * get TrackedContext type
   * @returns {string}
   */
    getType() {
        return this.#type
    }

}

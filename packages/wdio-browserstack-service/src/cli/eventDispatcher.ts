/**
 * EventDispatcher - Singleton class for event handling
 */
class EventDispatcher {

    static #instance: EventDispatcher|null = null
    observers: Record<string, Function[]>

    constructor() {
        this.observers = {}
    }

    /**
   * Get the EventDispatcher singleton instance
   * @returns {EventDispatcher} The singleton instance
   */
    static getInstance() {
        if (!EventDispatcher.#instance) {
            EventDispatcher.#instance = new EventDispatcher()
        }
        return EventDispatcher.#instance
    }

    /**
   * Add event observer
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
    registerObserver(hookRegistryKey: string, callback: Function) {
        if (!this.observers[hookRegistryKey]) {
            this.observers[hookRegistryKey] = []
        }

        this.observers[hookRegistryKey].push(callback)
    }

    /**
   * Notify registered observers on an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
    async notifyObserver(event: string, args: unknown) {
        if (this.observers[event]) {
            for (const callback of this.observers[event]) {
                await callback(args)
            }
            return
        }
    }
}

// Create the singleton instance
export const eventDispatcher = EventDispatcher.getInstance()

// Object.freeze to prevent modification of the instance
Object.freeze(eventDispatcher)

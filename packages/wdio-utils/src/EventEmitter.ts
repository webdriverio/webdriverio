export type EventMap = Record<string, any[]>
export type EventKey<T extends EventMap> = string & keyof T
export type EventListener<T extends EventMap, K extends EventKey<T>> =
    (...args: T[K]) => void

export class EventEmitter<T extends EventMap> {
    #listeners: Map<EventKey<T>, Set<EventListener<T, any>>>

    private channelName: string
    private channel: BroadcastChannel
    private maxListeners: number

    constructor(channelName: string = 'default-channel') {
        this.channelName = channelName
        this.channel = new BroadcastChannel(channelName)
        this.#listeners = new Map()
        this.maxListeners = 10

        // Listen for broadcast messages
        this.channel.onmessage = (event: MessageEvent) => {
            const { eventName, args } = event.data as {
                eventName: EventKey<T>
                args: T[EventKey<T>]
            }
            this.#executeListeners(eventName, args)
        }
    }

    addListener<K extends EventKey<T>>(
        eventName: K,
        listener: EventListener<T, K>
    ): this {
        return this.on(eventName, listener)
    }

    on<K extends EventKey<T>>(
        eventName: K,
        listener: EventListener<T, K>
    ): this {
        if (!this.#listeners.has(eventName)) {
            this.#listeners.set(eventName, new Set())
        }

        const listeners = this.#listeners.get(eventName)!

        if (listeners.size >= this.maxListeners) {
            console.warn(
                `MaxListenersExceededWarning: Possible memory leak detected. ${listeners.size} ${eventName} listeners added.`
            )
        }

        listeners.add(listener as EventListener<T, any>)
        return this
    }

    once<K extends EventKey<T>>(
        eventName: K,
        listener: EventListener<T, K>
    ): this {
        const onceWrapper: EventListener<T, K> & { originalListener?: EventListener<T, K> } =
            ((...args: T[K]) => {
                this.removeListener(eventName, onceWrapper)
                listener.apply(this, args)
            })

        onceWrapper.originalListener = listener
        return this.on(eventName, onceWrapper)
    }

    removeListener<K extends EventKey<T>>(
        eventName: K,
        listener: EventListener<T, K> & { originalListener?: EventListener<T, K> }
    ): this {
        if (!this.#listeners.has(eventName)) {
            return this
        }

        const listeners = this.#listeners.get(eventName)!
        if (listener.originalListener) {
            // Handle once() wrapper removal
            for (const l of listeners) {
                const typedL = l as EventListener<T, K> & { originalListener?: EventListener<T, K> }
                if (typedL.originalListener === listener.originalListener) {
                    listeners.delete(l)
                    break
                }
            }
        } else {
            listeners.delete(listener as EventListener<T, any>)
        }

        if (listeners.size === 0) {
            this.#listeners.delete(eventName)
        }

        return this
    }

    /**
     * Add the off method as an alias for removeListener
     */
    off<K extends EventKey<T>>(
        eventName: K,
        listener: EventListener<T, K> & { originalListener?: EventListener<T, K> }
    ): this {
        return this.removeListener(eventName, listener)
    }

    removeAllListeners(eventName?: EventKey<T>): this {
        if (eventName) {
            this.#listeners.delete(eventName)
        } else {
            this.#listeners.clear()
        }
        return this
    }

    emit<K extends EventKey<T>>(eventName: K, ...args: T[K]): boolean {
        // Broadcast the event to all windows/tabs
        this.channel.postMessage({ eventName, args })

        // Execute local listeners
        this.#executeListeners(eventName, args)

        return this.#listeners.has(eventName)
    }

    #executeListeners<K extends EventKey<T>>(
        eventName: K,
        args: T[K]
    ): void {
        if (!this.#listeners.has(eventName)) {
            return
        }

        const listeners = this.#listeners.get(eventName)!
        for (const listener of listeners) {
            try {
                listener.apply(this, args)
            } catch (error) {
                console.error('Error in event listener:', error)
            }
        }
    }

    listenerCount(eventName: EventKey<T>): number {
        return this.#listeners.has(eventName) ? this.#listeners.get(eventName)!.size : 0
    }

    // Add the listeners method that returns a copy of the array of listeners
    listeners<K extends EventKey<T>>(eventName: K): EventListener<T, K>[] {
        const listeners = this.#listeners.get(eventName)
        if (!listeners) {
            return []
        }

        return Array.from(listeners).map(listener => {
            const typedListener = listener as EventListener<T, K> & { originalListener?: EventListener<T, K> }
            // If it's a once() wrapper, return the original listener
            return (typedListener.originalListener || typedListener) as EventListener<T, K>
        })
    }

    // Keep rawListeners separate as it returns the wrappers for once() listeners
    rawListeners<K extends EventKey<T>>(eventName: K): EventListener<T, K>[] {
        return Array.from(this.#listeners.get(eventName) || []) as EventListener<T, K>[]
    }

    eventNames(): EventKey<T>[] {
        return Array.from(this.#listeners.keys())
    }

    setMaxListeners(n: number): this {
        this.maxListeners = n
        return this
    }

    getMaxListeners(): number {
        return this.maxListeners
    }

    prependListener<K extends EventKey<T>>(
        eventName: K,
        listener: EventListener<T, K>
    ): this {
        const existing = this.rawListeners(eventName)
        this.removeAllListeners(eventName)
        this.on(eventName, listener)
        for (const l of existing) {
            this.on(eventName, l)
        }
        return this
    }

    prependOnceListener<K extends EventKey<T>>(
        eventName: K,
        listener: EventListener<T, K>
    ): this {
        const onceWrapper: EventListener<T, K> & { originalListener?: EventListener<T, K> } =
            ((...args: T[K]) => {
                this.removeListener(eventName, onceWrapper)
                listener.apply(this, args)
            })
        onceWrapper.originalListener = listener
        return this.prependListener(eventName, onceWrapper)
    }

    close(): void {
        this.channel.close()
        this.removeAllListeners()
    }
}

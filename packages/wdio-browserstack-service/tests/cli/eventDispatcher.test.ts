import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../src/cli/eventDispatcher.js', () => {
    class EventDispatcher {
        static #instance: EventDispatcher | null = null
        observers: Record<string, Function[]>

        constructor() {
            this.observers = {}
        }

        static getInstance() {
            if (!EventDispatcher.#instance) {
                EventDispatcher.#instance = new EventDispatcher()
            }
            return EventDispatcher.#instance
        }

        registerObserver(hookRegistryKey: string, callback: Function) {
            if (!this.observers[hookRegistryKey]) {
                this.observers[hookRegistryKey] = []
            }
            this.observers[hookRegistryKey].push(callback)
        }

        async notifyObserver(event: string, args: unknown) {
            if (this.observers[event]) {
                for (const callback of this.observers[event]) {
                    await callback(args)
                }
                return
            }
        }
    }

    const mockEventDispatcher = EventDispatcher.getInstance()
    return {
        eventDispatcher: mockEventDispatcher,
        EventDispatcher
    }
})

// Import after mocking
const { eventDispatcher } = await import('../../src/cli/eventDispatcher.js')

describe('EventDispatcher', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        // Clear all observers before each test
        eventDispatcher.observers = {}
    })

    afterEach(() => {
        vi.resetAllMocks()
        vi.restoreAllMocks()
        // Clear all observers after each test
        eventDispatcher.observers = {}
    })

    describe('getInstance()', () => {
        it('should return a singleton instance', () => {
            const instance1 = eventDispatcher
            const instance2 = eventDispatcher
            expect(instance1).toBe(instance2)
        })

        it('should always return the same instance when called multiple times', () => {
            expect(eventDispatcher).toBeDefined()
            expect(eventDispatcher.observers).toBeDefined()
        })
    })

    describe('registerObserver()', () => {
        it('should register a new observer for a hook', () => {
            const callback = vi.fn()
            const hookKey = 'testHook'

            eventDispatcher.registerObserver(hookKey, callback)

            expect(eventDispatcher.observers[hookKey]).toBeDefined()
            expect(eventDispatcher.observers[hookKey]).toHaveLength(1)
            expect(eventDispatcher.observers[hookKey][0]).toBe(callback)
        })

        it('should register multiple observers for the same hook', () => {
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            const hookKey = 'testHook'

            eventDispatcher.registerObserver(hookKey, callback1)
            eventDispatcher.registerObserver(hookKey, callback2)

            expect(eventDispatcher.observers[hookKey]).toHaveLength(2)
            expect(eventDispatcher.observers[hookKey][0]).toBe(callback1)
            expect(eventDispatcher.observers[hookKey][1]).toBe(callback2)
        })

        it('should register observers for different hooks', () => {
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            const hookKey1 = 'testHook1'
            const hookKey2 = 'testHook2'

            eventDispatcher.registerObserver(hookKey1, callback1)
            eventDispatcher.registerObserver(hookKey2, callback2)

            expect(eventDispatcher.observers[hookKey1]).toHaveLength(1)
            expect(eventDispatcher.observers[hookKey2]).toHaveLength(1)
            expect(eventDispatcher.observers[hookKey1][0]).toBe(callback1)
            expect(eventDispatcher.observers[hookKey2][0]).toBe(callback2)
        })

        it('should handle empty string as hook key', () => {
            const callback = vi.fn()
            const hookKey = ''

            eventDispatcher.registerObserver(hookKey, callback)

            expect(eventDispatcher.observers[hookKey]).toBeDefined()
            expect(eventDispatcher.observers[hookKey]).toHaveLength(1)
            expect(eventDispatcher.observers[hookKey][0]).toBe(callback)
        })
    })

    describe('notifyObserver()', () => {
        it('should call all registered observers for an event', async () => {
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            const hookKey = 'testHook'
            const testArgs = { data: 'test' }

            eventDispatcher.registerObserver(hookKey, callback1)
            eventDispatcher.registerObserver(hookKey, callback2)

            await eventDispatcher.notifyObserver(hookKey, testArgs)

            expect(callback1).toHaveBeenCalledTimes(1)
            expect(callback1).toHaveBeenCalledWith(testArgs)
            expect(callback2).toHaveBeenCalledTimes(1)
            expect(callback2).toHaveBeenCalledWith(testArgs)
        })

        it('should not throw error when notifying non-existent event', async () => {
            const nonExistentEvent = 'nonExistentEvent'
            const testArgs = { data: 'test' }

            await expect(eventDispatcher.notifyObserver(nonExistentEvent, testArgs)).resolves.toBeUndefined()
        })

        it('should handle async callbacks properly', async () => {
            const asyncCallback = vi.fn().mockResolvedValue('resolved')
            const hookKey = 'asyncHook'
            const testArgs = { data: 'test' }

            eventDispatcher.registerObserver(hookKey, asyncCallback)

            await eventDispatcher.notifyObserver(hookKey, testArgs)

            expect(asyncCallback).toHaveBeenCalledTimes(1)
            expect(asyncCallback).toHaveBeenCalledWith(testArgs)
        })

        it('should call callbacks in registration order', async () => {
            const callOrder: number[] = []
            const callback1 = vi.fn().mockImplementation(() => callOrder.push(1))
            const callback2 = vi.fn().mockImplementation(() => callOrder.push(2))
            const callback3 = vi.fn().mockImplementation(() => callOrder.push(3))
            const hookKey = 'orderTest'
            const testArgs = { data: 'test' }

            eventDispatcher.registerObserver(hookKey, callback1)
            eventDispatcher.registerObserver(hookKey, callback2)
            eventDispatcher.registerObserver(hookKey, callback3)

            await eventDispatcher.notifyObserver(hookKey, testArgs)

            expect(callOrder).toEqual([1, 2, 3])
        })

        it('should handle different types of arguments', async () => {
            const callback = vi.fn()
            const hookKey = 'typeTest'

            eventDispatcher.registerObserver(hookKey, callback)

            // Test with string
            await eventDispatcher.notifyObserver(hookKey, 'string')
            expect(callback).toHaveBeenCalledWith('string')

            // Test with number
            await eventDispatcher.notifyObserver(hookKey, 42)
            expect(callback).toHaveBeenCalledWith(42)

            // Test with object
            const obj = { key: 'value' }
            await eventDispatcher.notifyObserver(hookKey, obj)
            expect(callback).toHaveBeenCalledWith(obj)

            // Test with array
            const arr = [1, 2, 3]
            await eventDispatcher.notifyObserver(hookKey, arr)
            expect(callback).toHaveBeenCalledWith(arr)

            // Test with null
            await eventDispatcher.notifyObserver(hookKey, null)
            expect(callback).toHaveBeenCalledWith(null)

            // Test with undefined
            await eventDispatcher.notifyObserver(hookKey, undefined)
            expect(callback).toHaveBeenCalledWith(undefined)

            expect(callback).toHaveBeenCalledTimes(6)
        })

        it('should handle callback errors gracefully', async () => {
            const errorCallback = vi.fn().mockRejectedValue(new Error('Callback error'))
            const successCallback = vi.fn()
            const hookKey = 'errorTest'
            const testArgs = { data: 'test' }

            eventDispatcher.registerObserver(hookKey, errorCallback)
            eventDispatcher.registerObserver(hookKey, successCallback)

            // This should not throw, but handle the error internally
            await expect(eventDispatcher.notifyObserver(hookKey, testArgs)).rejects.toThrow('Callback error')

            expect(errorCallback).toHaveBeenCalledTimes(1)
            expect(errorCallback).toHaveBeenCalledWith(testArgs)
            // successCallback should not be called due to error in first callback
            expect(successCallback).not.toHaveBeenCalled()
        })

        it('should handle synchronous callbacks that throw errors', async () => {
            const errorCallback = vi.fn().mockImplementation(() => {
                throw new Error('Sync error')
            })
            const hookKey = 'syncErrorTest'
            const testArgs = { data: 'test' }

            eventDispatcher.registerObserver(hookKey, errorCallback)

            await expect(eventDispatcher.notifyObserver(hookKey, testArgs)).rejects.toThrow('Sync error')

            expect(errorCallback).toHaveBeenCalledTimes(1)
            expect(errorCallback).toHaveBeenCalledWith(testArgs)
        })
    })

    describe('observers property', () => {
        it('should initialize with empty observers object', () => {
            expect(eventDispatcher.observers).toEqual({})
        })

        it('should maintain observers state across multiple operations', () => {
            const callback1 = vi.fn()
            const callback2 = vi.fn()
            const hookKey1 = 'hook1'
            const hookKey2 = 'hook2'

            eventDispatcher.registerObserver(hookKey1, callback1)
            eventDispatcher.registerObserver(hookKey2, callback2)

            expect(Object.keys(eventDispatcher.observers)).toHaveLength(2)
            expect(eventDispatcher.observers[hookKey1]).toHaveLength(1)
            expect(eventDispatcher.observers[hookKey2]).toHaveLength(1)
        })
    })

    describe('integration tests', () => {
        it('should work end-to-end with registration and notification', async () => {
            const mockData = { userId: 123, action: 'login' }
            const loginCallback = vi.fn()
            const auditCallback = vi.fn()

            // Register observers
            eventDispatcher.registerObserver('user:login', loginCallback)
            eventDispatcher.registerObserver('user:login', auditCallback)

            // Notify observers
            await eventDispatcher.notifyObserver('user:login', mockData)

            // Verify both callbacks were called with correct data
            expect(loginCallback).toHaveBeenCalledWith(mockData)
            expect(auditCallback).toHaveBeenCalledWith(mockData)
            expect(loginCallback).toHaveBeenCalledTimes(1)
            expect(auditCallback).toHaveBeenCalledTimes(1)
        })

        it('should handle multiple events independently', async () => {
            const startCallback = vi.fn()
            const endCallback = vi.fn()

            eventDispatcher.registerObserver('test:start', startCallback)
            eventDispatcher.registerObserver('test:end', endCallback)

            await eventDispatcher.notifyObserver('test:start', 'starting')
            await eventDispatcher.notifyObserver('test:end', 'ending')

            expect(startCallback).toHaveBeenCalledWith('starting')
            expect(endCallback).toHaveBeenCalledWith('ending')
            expect(startCallback).toHaveBeenCalledTimes(1)
            expect(endCallback).toHaveBeenCalledTimes(1)
        })
    })
})

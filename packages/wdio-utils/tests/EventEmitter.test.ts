import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest'
import { EventEmitter } from '../src/EventEmitter.js'

type TestEvents = {
    'test': [data: string]
    'multiple': [arg1: number, arg2: string]
    'noArgs': []
}

describe('EventEmitter', () => {
    let emitter: EventEmitter<TestEvents>

    // Mock BroadcastChannel
    const mockPostMessage = vi.fn()
    const mockClose = vi.fn()
    let mockMessageCallback: (event: MessageEvent) => void

    beforeEach(() => {
        // Mock BroadcastChannel implementation
        (global as any).BroadcastChannel = class {
            constructor(public name: string) { }
            postMessage = mockPostMessage
            close = mockClose
            set onmessage(callback: (event: MessageEvent) => void) {
                mockMessageCallback = callback
            }
        }

        emitter = new EventEmitter<TestEvents>('test-channel')
    })

    afterEach(() => {
        emitter.close()
    })

    describe('on/addListener', () => {
        test('should add listener and emit events', () => {
            const listener = vi.fn()
            emitter.on('test', listener)

            emitter.emit('test', 'hello')

            expect(listener).toHaveBeenCalledWith('hello')
            expect(mockPostMessage).toHaveBeenCalledWith({
                eventName: 'test',
                args: ['hello']
            })
        })

        test('should support multiple arguments', () => {
            const listener = vi.fn()
            emitter.on('multiple', listener)

            emitter.emit('multiple', 42, 'test')

            expect(listener).toHaveBeenCalledWith(42, 'test')
        })

        test('should warn when exceeding maxListeners', () => {
            const consoleSpy = vi.spyOn(console, 'warn')

            // Add more listeners than the default max (10)
            for (let i = 0; i < 11; i++) {
                emitter.on('test', () => { })
            }

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('MaxListenersExceededWarning')
            )
        })
    })

    describe('once', () => {
        test('should only execute listener once', () => {
            const listener = vi.fn()
            emitter.once('test', listener)

            emitter.emit('test', 'first')
            emitter.emit('test', 'second')

            expect(listener).toHaveBeenCalledTimes(1)
            expect(listener).toHaveBeenCalledWith('first')
        })
    })

    describe('off/removeListener', () => {
        test('should remove listener', () => {
            const listener = vi.fn()
            emitter.on('test', listener)
            emitter.off('test', listener)

            emitter.emit('test', 'hello')

            expect(listener).not.toHaveBeenCalled()
        })

        test('should remove once listener', () => {
            const listener = vi.fn()
            emitter.once('test', listener)

            // Get the listeners to find the wrapper
            const wrappers = emitter.rawListeners('test')
            emitter.off('test', wrappers[0])

            emitter.emit('test', 'hello')

            expect(listener).not.toHaveBeenCalled()
        })
    })

    describe('removeAllListeners', () => {
        test('should remove all listeners for specific event', () => {
            const listener1 = vi.fn()
            const listener2 = vi.fn()

            emitter.on('test', listener1)
            emitter.on('test', listener2)
            emitter.on('multiple', vi.fn())

            emitter.removeAllListeners('test')
            emitter.emit('test', 'hello')

            expect(listener1).not.toHaveBeenCalled()
            expect(listener2).not.toHaveBeenCalled()
            expect(emitter.listenerCount('multiple')).toBe(1)
        })

        test('should remove all listeners when no event specified', () => {
            emitter.on('test', vi.fn())
            emitter.on('multiple', vi.fn())

            emitter.removeAllListeners()

            expect(emitter.eventNames()).toHaveLength(0)
        })
    })

    describe('listeners/rawListeners', () => {
        test('should return copy of listeners array', () => {
            const listener = vi.fn()
            emitter.on('test', listener)

            const listeners = emitter.listeners('test')
            const rawListeners = emitter.rawListeners('test')

            expect(listeners).toEqual([listener])
            expect(rawListeners).toEqual([listener])
            expect(listeners).not.toBe(rawListeners) // Different array instances
        })

        test('should handle once listeners differently', () => {
            const listener = vi.fn()
            emitter.once('test', listener)

            const listeners = emitter.listeners('test')
            const rawListeners = emitter.rawListeners('test')

            expect(listeners).toEqual([listener]) // Original function
            expect(rawListeners[0]).not.toBe(listener) // Wrapper function
            // @ts-expect-error property 'originalListener' doesn't exist on type
            expect(rawListeners[0].originalListener).toBe(listener)
        })
    })

    describe('prependListener', () => {
        test('should add listener to beginning of listeners array', () => {
            const listener1 = vi.fn()
            const listener2 = vi.fn()

            emitter.on('test', listener1)
            emitter.prependListener('test', listener2)

            const listeners = emitter.listeners('test')
            expect(listeners[0]).toBe(listener2)
            expect(listeners[1]).toBe(listener1)
        })
    })

    describe('prependOnceListener', () => {
        test('should add once listener to beginning of listeners array', () => {
            const listener1 = vi.fn()
            const listener2 = vi.fn()

            emitter.on('test', listener1)
            emitter.prependOnceListener('test', listener2)

            emitter.emit('test', 'hello')
            emitter.emit('test', 'world')

            expect(listener2).toHaveBeenCalledTimes(1)
            expect(listener2).toHaveBeenCalledWith('hello')
            expect(listener1).toHaveBeenCalledTimes(2)
        })
    })

    describe('BroadcastChannel integration', () => {
        test('should receive events from other windows/tabs', () => {
            const listener = vi.fn()
            emitter.on('test', listener)

            // Simulate message from another window/tab
            mockMessageCallback({
                data: {
                    eventName: 'test',
                    args: ['broadcast']
                }
            } as MessageEvent)

            expect(listener).toHaveBeenCalledWith('broadcast')
        })

        test('should close channel when close is called', () => {
            emitter.close()
            expect(mockClose).toHaveBeenCalled()
        })
    })

    describe('listenerCount and eventNames', () => {
        test('should return correct listener count', () => {
            emitter.on('test', vi.fn())
            emitter.on('test', vi.fn())

            expect(emitter.listenerCount('test')).toBe(2)
        })

        test('should return all event names', () => {
            emitter.on('test', vi.fn())
            emitter.on('multiple', vi.fn())

            expect(emitter.eventNames()).toEqual(
                expect.arrayContaining(['test', 'multiple'])
            )
        })
    })

    describe('maxListeners', () => {
        test('should update maxListeners value', () => {
            emitter.setMaxListeners(5)
            expect(emitter.getMaxListeners()).toBe(5)
            const consoleSpy = vi.spyOn(console, 'warn')

            // Add more listeners than the new max
            for (let i = 0; i < 6; i++) {
                emitter.on('test', () => {})
            }

            expect(consoleSpy).toHaveBeenCalled()
        })
    })
})

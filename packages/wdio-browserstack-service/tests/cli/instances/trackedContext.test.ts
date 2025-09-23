import { describe, it, expect, beforeEach } from 'vitest'
import TrackedContext from '../../../src/cli/instances/trackedContext.js'

describe('TrackedContext', () => {
    let trackedContext: TrackedContext
    const mockId = 'test-context-id'
    const mockThreadId = 12345
    const mockProcessId = 67890
    const mockType = 'test-type'

    beforeEach(() => {
        trackedContext = new TrackedContext(mockId, mockThreadId, mockProcessId, mockType)
    })

    describe('constructor', () => {
        it('should create TrackedContext instance with correct properties', () => {
            expect(trackedContext).toBeInstanceOf(TrackedContext)
        })

        it('should initialize with provided parameters', () => {
            const newContext = new TrackedContext('id-123', 111, 222, 'custom-type')

            expect(newContext.getId()).toBe('id-123')
            expect(newContext.getThreadId()).toBe(111)
            expect(newContext.getProcessId()).toBe(222)
            expect(newContext.getType()).toBe('custom-type')
        })
    })

    describe('getId', () => {
        it('should return the correct id', () => {
            expect(trackedContext.getId()).toBe(mockId)
        })

        it('should return different ids for different instances', () => {
            const context1 = new TrackedContext('id-1', 111, 222, 'type-1')
            const context2 = new TrackedContext('id-2', 111, 222, 'type-1')
            
            expect(context1.getId()).toBe('id-1')
            expect(context2.getId()).toBe('id-2')
            expect(context1.getId()).not.toBe(context2.getId())
        })
    })

    describe('getThreadId', () => {
        it('should return the correct thread id', () => {
            expect(trackedContext.getThreadId()).toBe(mockThreadId)
        })

        it('should handle zero and negative thread ids', () => {
            const context1 = new TrackedContext('id', 0, 222, 'type')
            const context2 = new TrackedContext('id', -1, 222, 'type')
            
            expect(context1.getThreadId()).toBe(0)
            expect(context2.getThreadId()).toBe(-1)
        })
    })

    describe('getProcessId', () => {
        it('should return the correct process id', () => {
            expect(trackedContext.getProcessId()).toBe(mockProcessId)
        })

        it('should handle zero and negative process ids', () => {
            const context1 = new TrackedContext('id', 111, 0, 'type')
            const context2 = new TrackedContext('id', 111, -1, 'type')
            
            expect(context1.getProcessId()).toBe(0)
            expect(context2.getProcessId()).toBe(-1)
        })
    })

    describe('getType', () => {
        it('should return the correct type', () => {
            expect(trackedContext.getType()).toBe(mockType)
        })

        it('should handle empty string type', () => {
            const context = new TrackedContext('id', 111, 222, '')
            expect(context.getType()).toBe('')
        })
    })

    describe('property immutability', () => {
        it('should not allow external modification of private properties', () => {
            // Verify that private properties are not directly accessible
            expect((trackedContext as any).id).toBeUndefined()
            expect((trackedContext as any).threadId).toBeUndefined()
            expect((trackedContext as any).processId).toBeUndefined()
            expect((trackedContext as any).type).toBeUndefined()
        })
    })

    describe('object equality and identity', () => {
        it('should create different instances with same parameters', () => {
            const context1 = new TrackedContext(mockId, mockThreadId, mockProcessId, mockType)
            const context2 = new TrackedContext(mockId, mockThreadId, mockProcessId, mockType)

            expect(context1).not.toBe(context2) // Different object references
            expect(context1.getId()).toBe(context2.getId()) // Same values
            expect(context1.getThreadId()).toBe(context2.getThreadId())
            expect(context1.getProcessId()).toBe(context2.getProcessId())
            expect(context1.getType()).toBe(context2.getType())
        })

        it('should maintain object identity', () => {
            const sameContext = trackedContext
            expect(trackedContext).toBe(sameContext)
        })
    })

    describe('multiple instances', () => {
        it('should handle multiple concurrent instances', () => {
            const contexts = []
            for (let i = 0; i < 3; i++) {
                contexts.push(new TrackedContext(`id-${i}`, i, i * 10, `type-${i}`))
            }

            contexts.forEach((context, index) => {
                expect(context.getId()).toBe(`id-${index}`)
                expect(context.getThreadId()).toBe(index)
                expect(context.getProcessId()).toBe(index * 10)
                expect(context.getType()).toBe(`type-${index}`)
            })
        })
    })
})
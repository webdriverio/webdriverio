import { describe, it, expect, beforeEach, vi } from 'vitest'
import TrackedInstance from '../../../src/cli/instances/trackedInstance.js'
import TrackedContext from '../../../src/cli/instances/trackedContext.js'

// Mock crypto and worker_threads
vi.mock('node:worker_threads', () => ({
    threadId: 111
}))

describe('TrackedInstance', () => {
    let trackedInstance: TrackedInstance
    let mockContext: TrackedContext

    beforeEach(() => {
        vi.resetAllMocks()
        mockContext = new TrackedContext('test-id', 111, 222, 'string')
        trackedInstance = new TrackedInstance(mockContext)
    })

    describe('constructor', () => {
        it('should create TrackedInstance with TrackedContext', () => {
            expect(trackedInstance).toBeInstanceOf(TrackedInstance)
            expect(trackedInstance.getContext()).toBe(mockContext)
            expect(trackedInstance.getAllData().size).toBe(0)
        })

        it('should accept different TrackedContext instances', () => {
            const customContext = new TrackedContext('custom-id', 333, 444, 'custom-type')
            const customInstance = new TrackedInstance(customContext)

            expect(customInstance.getContext()).toBe(customContext)
            expect(customInstance.getContext().getId()).toBe('custom-id')
        })
    })

    describe('ref method', () => {
        it('should return a number', () => {
            const refValue = trackedInstance.getRef()
            expect(refValue).toBe('test-id')
        })
    })

    describe('getContext method', () => {
        it('should return context with correct properties', () => {
            const context = trackedInstance.getContext()
            expect(context).toBe(mockContext)
            expect(context.getId()).toBe('test-id')
            expect(context.getThreadId()).toBe(111)
            expect(context.getProcessId()).toBe(222)
            expect(context.getType()).toBe('string')
        })

        it('should maintain context reference', () => {
            const context1 = trackedInstance.getContext()
            const context2 = trackedInstance.getContext()
            expect(context1).toBe(context2)
        })
    })

    describe('getAllData method', () => {
        it('should return empty data initially', () => {
            const data = trackedInstance.getAllData()
            expect(data.size).toBe(0)
        })

        it('should reflect changes made to data', () => {
            const data = trackedInstance.getAllData()
            data.set('test-key', 'test-value')

            expect(trackedInstance.getAllData().get('test-key')).toBe('test-value')
            expect(trackedInstance.getAllData().size).toBe(1)
        })
    })

    describe('getData method', () => {
        beforeEach(() => {
            trackedInstance.updateData('existing-key', 'existing-value')
            trackedInstance.updateData('number-key', 42)
            trackedInstance.updateData('null-key', null)
            trackedInstance.updateData('object-key', { nested: 'value' })
        })

        it('should return existing value for valid key', () => {
            expect(trackedInstance.getData('existing-key')).toBe('existing-value')
            expect(trackedInstance.getData('number-key')).toBe(42)
            expect(trackedInstance.getData('null-key')).toBeNull()
            expect(trackedInstance.getData('object-key')).toEqual({ nested: 'value' })
        })

        it('should return undefined for non-existing key', () => {
            expect(trackedInstance.getData('non-existing-key')).toBeUndefined()
        })
    })

    describe('updateMultipleEntries method', () => {
        it('should update multiple entries from object', () => {
            const updates = {
                'string': 'text',
                'number': 123,
                'boolean': true,
                'array': [1, 2, 3],
                'object': { prop: 'value' },
                'null': null,
                'undefined': undefined
            }

            trackedInstance.updateMultipleEntries(updates)

            expect(trackedInstance.getData('string')).toBe('text')
            expect(trackedInstance.getData('number')).toBe(123)
            expect(trackedInstance.getData('boolean')).toBe(true)
            expect(trackedInstance.getData('array')).toEqual([1, 2, 3])
            expect(trackedInstance.getData('object')).toEqual({ prop: 'value' })
            expect(trackedInstance.getData('null')).toBeNull()
            expect(trackedInstance.getData('undefined')).toBeUndefined()
            expect(trackedInstance.getAllData().size).toBe(7)
        })

        it('should handle empty object', () => {
            const initialSize = trackedInstance.getAllData().size
            trackedInstance.updateMultipleEntries({})
            expect(trackedInstance.getAllData().size).toBe(initialSize)
        })

        it('should overwrite existing values', () => {
            trackedInstance.updateData('existing', 'old-value')

            trackedInstance.updateMultipleEntries({
                'existing': 'new-value',
                'new-key': 'new-value'
            })

            expect(trackedInstance.getData('existing')).toBe('new-value')
            expect(trackedInstance.getData('new-key')).toBe('new-value')
        })

        it('should handle various data types', () => {
            const context = new TrackedContext('test-id', 123, 456, 'object')
            const instance = new TrackedInstance(context)

            // Test string data
            instance.updateData('stringKey', 'string value')
            expect(instance.getData('stringKey')).toBe('string value')

            // Test number data
            instance.updateData('numberKey', 42)
            expect(instance.getData('numberKey')).toBe(42)

            // Test boolean data
            instance.updateData('boolKey', true)
            expect(instance.getData('boolKey')).toBe(true)

            // Test object data
            const objValue = { nested: 'value' }
            instance.updateData('objKey', objValue)
            expect(instance.getData('objKey')).toBe(objValue)

            // Test array data
            const arrayValue = [1, 2, 3]
            instance.updateData('arrayKey', arrayValue)
            expect(instance.getData('arrayKey')).toBe(arrayValue)

            // Test null/undefined
            instance.updateData('nullKey', null)
            instance.updateData('undefinedKey', undefined)
            expect(instance.getData('nullKey')).toBe(null)
            expect(instance.getData('undefinedKey')).toBe(undefined)

            // Verify all data types stored correctly
            expect(instance.getAllData().size).toBe(7)
        })
    })

    describe('static createContext method', () => {
        it('should create TrackedContext with target as id', () => {
            const target = 'test-target'
            const id = '9805cbd60eb4f66728d5d19595992fa46a5b80a5fcf5ab49920bf0602cc65604' // hash of target
            const context = TrackedInstance.createContext(target)

            expect(context).toBeInstanceOf(TrackedContext)
            expect(context.getId()).toBe(id)
            expect(context.getThreadId()).toBe(111)
            expect(context.getProcessId()).toBe(process.pid)
            expect(context.getType()).toBe('string')
        })
    })

    describe('integration tests', () => {
        it('should work with createContext and instance creation', () => {
            const target = 'integration-target'
            const context = TrackedInstance.createContext(target)
            const instance = new TrackedInstance(context)

            expect(instance.getAllData().size).toBe(0)
            expect(instance.getContext()).toBe(context)
            expect(instance.getRef()).toBe(context.getId())
        })

        it('should maintain data independence between instances', () => {
            const context1 = TrackedInstance.createContext('target1')
            const context2 = TrackedInstance.createContext('target2')
            const instance1 = new TrackedInstance(context1)
            const instance2 = new TrackedInstance(context2)

            instance1.updateMultipleEntries({ 'key': 'value1' })
            instance2.updateMultipleEntries({ 'key': 'value2' })

            expect(instance1.getData('key')).toBe('value1')
            expect(instance2.getData('key')).toBe('value2')
            expect(instance1.getContext()).not.toBe(instance2.getContext())
            expect(instance1.getRef()).not.toBe(instance2.getRef())
        })

        it('should handle complex workflow', () => {
            const context = TrackedInstance.createContext('workflow-test')
            const instance = new TrackedInstance(context)

            // Add initial data
            instance.updateMultipleEntries({
                'status': 'initialized',
                'config': { setting: 'value' }
            })

            // Update some data
            instance.getAllData().set('status', 'running')

            // Verify final state
            expect(instance.getData('status')).toBe('running')
            expect(instance.getData('config')).toEqual({ setting: 'value' })
        })
    })
})
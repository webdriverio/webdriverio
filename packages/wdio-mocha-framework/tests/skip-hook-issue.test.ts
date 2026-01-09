import { describe, test, expect, vi } from 'vitest'

import { formatMessage } from '../src/common.js'

/**
 * Test for GitHub issue #14649
 * When this.skip() is called in a hook, the hook should not be marked as failed
 */
describe('formatMessage - Issue #14649: this.skip() in hooks', () => {
    test('should NOT include error for sync skip in before all hook', () => {
        // This is the error that Mocha throws when this.skip() is called
        const skipError = new Error('sync skip; aborting execution')

        const params = {
            type: 'test:fail', // Mocha emits 'fail' event when this.skip() is called in hooks
            payload: {
                title: '"before all" hook',
                parent: { title: 'Test Suite' },
                state: 'failed',
                duration: 5
            },
            err: skipError
        }

        const message = formatMessage(params as any)

        // FIXED behavior: skip errors should NOT be included as errors
        expect(message.type).toBe('hook:end')
        expect(message.error).toBeUndefined() // No error for skip
    })

    test('should NOT include error for async skip in before each hook', () => {
        // Async version of skip error
        const skipError = new Error('async skip; aborting execution')

        const params = {
            type: 'test:fail',
            payload: {
                title: '"before each" hook',
                parent: { title: 'Test Suite' },
                state: 'failed',
                duration: 10
            },
            err: skipError
        }

        const message = formatMessage(params as any)

        // FIXED behavior: skip errors should NOT be included as errors
        expect(message.type).toBe('hook:end')
        expect(message.error).toBeUndefined() // No error for skip
    })

    test('should NOT include error for skip in after all hook', () => {
        const skipError = new Error('sync skip; aborting execution')

        const params = {
            type: 'test:fail',
            payload: {
                title: '"after all" hook',
                parent: { title: 'Test Suite' }
            },
            err: skipError
        }

        const message = formatMessage(params as any)

        expect(message.type).toBe('hook:end')
        expect(message.error).toBeUndefined()
    })

    test('should properly include error for actual hook failures', () => {
        // Real error that should be included
        const realError = new Error('Connection refused')

        const params = {
            type: 'test:fail',
            payload: {
                title: '"before all" hook',
                parent: { title: 'Test Suite' },
                state: 'failed'
            },
            err: realError
        }

        const message = formatMessage(params as any)

        // Real errors SHOULD still be included
        expect(message.type).toBe('hook:end')
        expect(message.error).toBeDefined()
        expect(message.error?.message).toBe('Connection refused')
    })

    test('should include error for skip in non-hook context (regular test)', () => {
        // Skip in a regular test (not a hook) should still work normally
        const skipError = new Error('sync skip; aborting execution')

        const params = {
            type: 'test:fail',
            payload: {
                title: 'my test case', // Not a hook title
                parent: { title: 'Test Suite' }
            },
            err: skipError
        }

        const message = formatMessage(params as any)

        // For non-hook skip, error should still be included (this is handled elsewhere)
        expect(message.type).toBe('test:fail') // Not converted to hook:end
        expect(message.error).toBeDefined()
    })
})

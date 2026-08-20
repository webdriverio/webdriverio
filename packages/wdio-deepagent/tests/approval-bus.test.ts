import { describe, expect, it, vi } from 'vitest'
import {
    getPendingApproval,
    rejectPendingApprovals,
    requestApproval,
    submitApproval,
    subscribeApproval,
} from '../src/commands/ui/approvalBus.js'

const emptyRequest = { actionRequests: [] }

describe('approvalBus', () => {
    it('parks a request and resolves it on submit', async () => {
        const req = { actionRequests: [{ name: 'write_file', args: {}, description: 'x' }] }
        const promise = requestApproval(req)
        expect(getPendingApproval()?.request).toBe(req)
        submitApproval(true)
        await expect(promise).resolves.toBe(true)
        expect(getPendingApproval()).toBeNull()
    })

    it('resolves false on cancel', async () => {
        const promise = requestApproval(emptyRequest)
        submitApproval(false)
        await expect(promise).resolves.toBe(false)
    })

    it('rejects the pending promise on shutdown', async () => {
        const promise = requestApproval(emptyRequest)
        rejectPendingApprovals(new Error('repl closed — approval abandoned'))
        await expect(promise).rejects.toThrow('repl closed')
        expect(getPendingApproval()).toBeNull()
    })

    it('notifies subscribers on request and submit, and unsubscribes', () => {
        const listener = vi.fn()
        const unsubscribe = subscribeApproval(listener)
        requestApproval(emptyRequest)
        expect(listener).toHaveBeenCalledTimes(1)
        submitApproval(true)
        expect(listener).toHaveBeenCalledTimes(2)
        unsubscribe()
        requestApproval(emptyRequest)
        expect(listener).toHaveBeenCalledTimes(2)
        submitApproval(true) // settle so no pending leaks into later tests
    })

    it('no-ops on submit/reject when nothing is pending', async () => {
        const promise = requestApproval(emptyRequest)
        submitApproval(true) // settles the pending request
        await promise
        expect(() => submitApproval(true)).not.toThrow()
        expect(() => rejectPendingApprovals(new Error('x'))).not.toThrow()
        expect(getPendingApproval()).toBeNull()
    })
})

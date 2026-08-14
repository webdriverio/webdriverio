import type { TurnInterruptRequest } from '../turn.js'

export interface PendingApproval {
    request: TurnInterruptRequest
    resolve: (value: boolean) => void
    reject: (err: Error) => void
}

/**
 * Bridge between the langgraph event loop and the React tree.
 *
 * Interrupts fire synchronously inside the agent's run (outside React), so
 * `runStreamedTurn` resolves them by awaiting `requestApproval`, which parks
 * the promise here; the React tree renders `ApprovalPrompt` from
 * `getPendingApproval` and settles it with `submitApproval`. Exactly one
 * request is pending at a time — `runStreamedTurn` resolves interrupts
 * sequentially. Shutdown rejects any pending approval (mirrors
 * `createInterruptResolver`'s readline-close rejection).
 */
let pending: PendingApproval | null = null
const listeners = new Set<() => void>()

function notify(): void {
    for (const listener of listeners) {
        listener()
    }
}

export function requestApproval(request: TurnInterruptRequest): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        pending = { request, resolve, reject }
        notify()
    })
}

export function submitApproval(value: boolean): void {
    const current = pending
    if (!current) {
        return
    }
    pending = null
    current.resolve(value)
    notify()
}

export function rejectPendingApprovals(err: Error): void {
    const current = pending
    if (!current) {
        return
    }
    pending = null
    current.reject(err)
    notify()
}

export function getPendingApproval(): PendingApproval | null {
    return pending
}

export function subscribeApproval(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

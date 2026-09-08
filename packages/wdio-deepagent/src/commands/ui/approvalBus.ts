import type { TurnInterruptRequest } from '../turn.js'

export interface PendingApproval {
    request: TurnInterruptRequest
    resolve: (value: boolean) => void
    reject: (err: Error) => void
}

/**
 * Per-thread approval queue bridging the langgraph event loop and the React
 * tree. Created per harness threadId and passed as an explicit dep (from the
 * repl entry) — no module-global singleton, so concurrent harnesses never
 * share pending state. Interrupts fire synchronously inside the agent's run
 * (outside React), so `runStreamedTurn` resolves them by awaiting
 * `requestApproval`, which parks the promise here; the React tree renders
 * `ApprovalPrompt` from `getPendingApproval` and settles it with
 * `submitApproval`. Exactly one request is pending at a time —
 * `runStreamedTurn` resolves interrupts sequentially. Shutdown rejects any
 * pending approval (mirrors `createInterruptResolver`'s readline-close
 * rejection).
 */
export interface ApprovalQueue {
    requestApproval(request: TurnInterruptRequest): Promise<boolean>
    submitApproval(value: boolean): void
    rejectPendingApprovals(err: Error): void
    getPendingApproval(): PendingApproval | null
    subscribeApproval(listener: () => void): () => void
}

export function createApprovalQueue(): ApprovalQueue {
    let pending: PendingApproval | null = null
    const listeners = new Set<() => void>()

    function notify(): void {
        for (const listener of listeners) {
            listener()
        }
    }

    function settle(fn: (current: PendingApproval) => void): void {
        const current = pending
        if (!current) {
            return
        }
        pending = null
        fn(current)
        notify()
    }

    return {
        requestApproval(request: TurnInterruptRequest): Promise<boolean> {
            return new Promise<boolean>((resolve, reject) => {
                pending = { request, resolve, reject }
                notify()
            })
        },
        submitApproval(value: boolean): void {
            settle((current) => current.resolve(value))
        },
        rejectPendingApprovals(err: Error): void {
            settle((current) => current.reject(err))
        },
        getPendingApproval(): PendingApproval | null {
            return pending
        },
        subscribeApproval(listener: () => void): () => void {
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
            }
        },
    }
}

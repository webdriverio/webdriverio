const timeoutSignals = new WeakSet<AbortSignal>()
const timers = new WeakMap<AbortSignal, ReturnType<typeof setTimeout>>()

/**
 * Drop the timer armed by `createRequestSignal` once the attempt has settled.
 * A late timeout would abort a signal the request no longer uses.
 */
export function clearAbortTimer (signal?: AbortSignal | null) {
    if (!signal) {
        return
    }
    const timer = timers.get(signal)
    if (timer === undefined) {
        return
    }
    clearTimeout(timer)
    timers.delete(signal)
}

/**
 * True when `signal` was aborted because `connectionRetryTimeout` elapsed.
 * Chrome and Edge before 124 reject that abort as `AbortError` rather than
 * `TimeoutError`, and browsers before Chrome/Edge 103 and Safari 16 have no
 * `AbortSignal.timeout` at all.
 */
export function isConnectionTimeoutSignal (signal?: AbortSignal | null): boolean {
    return Boolean(signal && timeoutSignals.has(signal))
}

function unrefTimer (timer: ReturnType<typeof setTimeout>) {
    if (typeof timer === 'object' && timer !== null && 'unref' in timer && typeof timer.unref === 'function') {
        timer.unref()
    }
}

function timeoutReason (): DOMException {
    return new DOMException('The operation was aborted due to timeout', 'TimeoutError')
}

function abort (controller: AbortController, reason?: unknown) {
    if (controller.signal.aborted) {
        return
    }
    if (reason === undefined) {
        controller.abort()
        return
    }

    try {
        controller.abort(reason)
    } catch {
        controller.abort()
    }

    /**
     * Chrome and Edge before 98 ignore the reason passed to `abort()`.
     * Keep it readable for callers that inspect `signal.reason`.
     */
    if (!('reason' in controller.signal) || controller.signal.reason !== reason) {
        try {
            Object.defineProperty(controller.signal, 'reason', {
                configurable: true,
                value: reason
            })
        } catch {
            // The engine already stored a reason we cannot replace.
        }
    }
}

/**
 * Abort when `timeout` elapses or when `signal` aborts.
 *
 * `AbortSignal.timeout` and `AbortSignal.any` are missing on the browsers
 * the browser bundle still supports (Chrome 90, Edge 90, Firefox 90,
 * Safari 14.1), so this stays on `AbortController` and `setTimeout`.
 */
export function createRequestSignal (timeout: number, signal?: AbortSignal | null): AbortSignal {
    const controller = new AbortController()
    const timer = setTimeout(() => {
        timeoutSignals.add(controller.signal)
        abort(controller, timeoutReason())
    }, timeout)
    unrefTimer(timer)
    timers.set(controller.signal, timer)

    const onCallerAbort = () => {
        const reason = signal && 'reason' in signal ? signal.reason : undefined
        abort(controller, reason)
    }

    if (signal) {
        if (signal.aborted) {
            onCallerAbort()
            return controller.signal
        }
        signal.addEventListener('abort', onCallerAbort)
    }

    controller.signal.addEventListener('abort', () => {
        clearAbortTimer(controller.signal)
        signal?.removeEventListener('abort', onCallerAbort)
    })

    return controller.signal
}

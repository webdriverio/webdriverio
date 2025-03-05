/**
 * Polyfill for AbortSignal.any()
 *
 * Creates a new AbortSignal that aborts when any of the given signals abort.
 *
 * @param signals - An array of AbortSignal objects
 * @returns A new AbortSignal that aborts when any of the input signals abort
 */
if (!AbortSignal.any) {
    AbortSignal.any = function (signals: AbortSignal[]): AbortSignal {
        // Validate input
        if (!signals || !Array.isArray(signals)) {
            throw new TypeError('AbortSignal.any requires an array of AbortSignal objects')
        }

        // Create a new controller for our combined signal
        const controller = new AbortController()

        // If any signal is already aborted, abort immediately
        if (signals.some(signal => signal.aborted)) {
            controller.abort()
            return controller.signal
        }

        // Set up listeners for each signal
        const listeners = signals.map(signal => {
            const listener = () => {
                // When any signal aborts, abort our controller
                // and forward the abort reason if available
                if ('reason' in signal && signal.reason !== undefined) {
                    controller.abort(signal.reason)
                } else {
                    controller.abort()
                }

                // Clean up other listeners when one signal aborts
                cleanup()
            }

            signal.addEventListener('abort', listener)
            return { signal, listener }
        })

        // Function to remove all event listeners
        const cleanup = () => {
            listeners.forEach(({ signal, listener }) => {
                signal.removeEventListener('abort', listener)
            })
        }

        // Make sure to clean up if our combined signal is aborted
        controller.signal.addEventListener('abort', cleanup)

        return controller.signal
    }
}

/**
 * The `code` of errors that webdriverio throws, a short and stable key to check in code. A leaf
 * module without imports: commands and utils import it.
 */

/**
 * a wait (`waitUntil`, the `waitFor*` commands) that timed out: it tells a timeout from a
 * condition that failed, whatever the message
 */
export const WAIT_UNTIL_TIMEOUT = 'WAIT_UNTIL_TIMEOUT'

/**
 * the timeout error that a `Timer` creates (internal: `waitUntil` replaces it with its own
 * error). A condition that throws an error with the message "timeout", or a wait inside the
 * condition that timed out (`WAIT_UNTIL_TIMEOUT`), is not a timeout of this timer
 */
export const TIMER_TIMEOUT = 'TIMER_TIMEOUT'

/**
 * a command on a stale element that the lookup waited `waitforTimeout` for and did not find
 * again (the page removed it), see `utils/elementNotFound.ts`
 */
export const ELEMENT_NOT_FOUND_AGAIN = 'ELEMENT_NOT_FOUND_AGAIN'

/**
 * whether the value is an error with this code, as a type guard
 */
export function hasCode<C extends string>(err: unknown, code: C): err is Error & { code: C } {
    return err instanceof Error && (err as { code?: unknown }).code === code
}

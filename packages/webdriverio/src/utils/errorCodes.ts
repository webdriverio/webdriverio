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

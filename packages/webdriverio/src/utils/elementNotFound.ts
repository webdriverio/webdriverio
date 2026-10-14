/**
 * A leaf module without imports: `implicitWait`, the element middleware and `setValue`
 * import it.
 */

/**
 * The name of the error of a command on a stale element that the lookup waited
 * `waitforTimeout` for and did not find again (the page removed it). Its message is the
 * "element wasn't found" message of `implicitWait`, its `cause` the stale element error.
 * It is not a stale element error, so the outer layers of the command do not look for the
 * element (and wait) again.
 */
export const ELEMENT_NOT_FOUND_AGAIN = 'webdriverio(middleware): element was not found again'

/**
 * a registered symbol: another copy of webdriverio in the same process sees the flag
 */
const WAITED_FOR = Symbol.for('wdio:waitedFor')

/**
 * Flag the "element wasn't found" error of `implicitWait` when its wait for the element ended
 * without it, with a hidden property. An error that can not get it (frozen) is left as it is.
 */
export function markWaited(err: unknown) {
    if (err && typeof err === 'object' && Object.isExtensible(err)) {
        Object.defineProperty(err, WAITED_FOR, { value: true })
    }
}

/**
 * whether the error comes from a wait for the element that ended without it, see `markWaited`
 */
export function waitedFor(err: unknown): boolean {
    return Boolean(err && typeof err === 'object' && (err as { [WAITED_FOR]?: boolean })[WAITED_FOR] === true)
}

/**
 * whether the error is the one of a stale element that was not found again, see
 * `ELEMENT_NOT_FOUND_AGAIN`
 */
export function isElementNotFoundAgain(err: unknown): boolean {
    return Boolean(err && typeof err === 'object' && (err as { name?: unknown }).name === ELEMENT_NOT_FOUND_AGAIN)
}

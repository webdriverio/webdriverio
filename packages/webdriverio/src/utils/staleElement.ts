/**
 * A leaf module without imports: the element middleware, the element commands and the
 * `utils/index.ts` barrel import it.
 */

/**
 * Set on an error when `implicitWait` waited `waitforTimeout` for an element and did not
 * find it, also the wait of a parent while `refetchElement` finds the chain again. A
 * command runs other commands, on its element or on other elements, and each of them
 * has a layer of the element middleware: an outer layer throws a stale element error
 * with this mark at once instead of waiting again. A lookup that failed without that
 * wait (for example a parent that the page replaces again while the chain is found
 * again) has no mark, and an outer layer looks again.
 */
/**
 * a registered symbol: another copy of webdriverio in the same process sees the mark
 */
const NOT_FOUND_AGAIN = Symbol.for('wdio:notFoundAgain')

/**
 * a stale element error by its message, `false` for a value without a message
 */
export function isStaleElementError(err: unknown) {
    const message = (err as { message?: unknown } | null | undefined)?.message
    if (typeof message !== 'string') {
        return false
    }
    return (
        // Chrome
        message.includes('stale element reference') ||
        // Firefox
        message.includes('is no longer attached to the DOM') ||
        // Safari
        message.toLowerCase().includes('stale element found') ||
        // Chrome through JS execution
        message.includes('stale element not found in the current frame') ||
        // BIDI
        message.includes('belongs to different document') ||
        message.includes('no such node - The node with the reference')
    )
}

/**
 * a stale element error, by its name (the error of a driver) or its message. Any
 * object, also an error of another realm or a plain object with these properties
 */
export function isStaleError(err: unknown): boolean {
    if (!err || typeof err !== 'object') {
        return false
    }
    return (err as { name?: unknown }).name === 'stale element reference' || isStaleElementError(err)
}

/**
 * see `NOT_FOUND_AGAIN`. An error that can not get the mark (frozen) is left as it is.
 */
export function markNotFoundAgain(err: unknown) {
    if (err && typeof err === 'object' && Object.isExtensible(err)) {
        (err as { [NOT_FOUND_AGAIN]?: boolean })[NOT_FOUND_AGAIN] = true
    }
}

/**
 * whether a lookup already waited for the element of this error and did not find it,
 * see `NOT_FOUND_AGAIN`
 */
export function wasNotFoundAgain(err: unknown): boolean {
    return Boolean(err && typeof err === 'object' && (err as { [NOT_FOUND_AGAIN]?: boolean })[NOT_FOUND_AGAIN] === true)
}

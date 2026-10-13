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
const NOT_FOUND_AGAIN = Symbol('wdio:notFoundAgain')

export function isStaleElementError(err: Error) {
    return (
        // Chrome
        err.message.includes('stale element reference') ||
        // Firefox
        err.message.includes('is no longer attached to the DOM') ||
        // Safari
        err.message.toLowerCase().includes('stale element found') ||
        // Chrome through JS execution
        err.message.includes('stale element not found in the current frame') ||
        // BIDI
        err.message.includes('belongs to different document') ||
        err.message.includes('no such node - The node with the reference')
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
    const { name, message } = err as { name?: unknown, message?: unknown }
    return name === 'stale element reference' || (typeof message === 'string' && isStaleElementError(err as Error))
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

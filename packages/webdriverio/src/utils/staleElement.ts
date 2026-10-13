/**
 * A leaf module without imports: the element middleware, the element commands and the
 * `utils/index.ts` barrel import it.
 */

/**
 * Set on a stale element error when the element middleware looked for the element
 * again (with its parents) and did not find it. A command runs other commands on its
 * element or on other elements, and each of them has a middleware layer: an outer
 * layer throws a marked error at once instead of looking and waiting again.
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
 * a stale element error, by its name (the error of a driver) or its message.
 * `false` for a value that is not an `Error`
 */
export function isStaleError(err: unknown): err is Error {
    return err instanceof Error && typeof err.message === 'string' &&
        (err.name === 'stale element reference' || isStaleElementError(err))
}

export function markNotFoundAgain(err: Error) {
    (err as Error & { [NOT_FOUND_AGAIN]?: boolean })[NOT_FOUND_AGAIN] = true
}

/**
 * whether the element of this stale element error was already looked for again and
 * not found, see `NOT_FOUND_AGAIN`
 */
export function wasNotFoundAgain(err: unknown): err is Error {
    return err instanceof Error && (err as Error & { [NOT_FOUND_AGAIN]?: boolean })[NOT_FOUND_AGAIN] === true
}

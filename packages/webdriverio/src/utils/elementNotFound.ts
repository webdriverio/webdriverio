/**
 * A leaf module (it imports only the error codes): `implicitWait`, the element middleware,
 * `setValue` and `waitForStable` import it.
 *
 * The error of a command on a stale element that the lookup waited `waitforTimeout` for and
 * did not find again (the page removed it) is the "element wasn't found" error of
 * `implicitWait`, as in 9.31.9, with the code `ELEMENT_NOT_FOUND_AGAIN` and the stale element
 * error as its `cause`. It is not a stale element error, so the outer layers of the command do
 * not look for the element (and wait) again.
 */
import { ELEMENT_NOT_FOUND_AGAIN, hasCode } from './errorCodes.js'

export { ELEMENT_NOT_FOUND_AGAIN }

/**
 * local to this copy of webdriverio, as the record below: an element runs its commands in
 * the copy that made it
 */
const WAITED_FOR = Symbol('wdio:waitedFor')

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
export function isElementNotFoundAgain(err: unknown): err is Error & { code: typeof ELEMENT_NOT_FOUND_AGAIN } {
    return hasCode(err, ELEMENT_NOT_FOUND_AGAIN)
}

/**
 * the element of the chain whose lookup ended without it, for each error of `implicitWait`
 * in `refetchElement`
 */
const notFoundElements = new WeakMap<object, object>()

export function recordNotFound(err: unknown, el: object) {
    if (err && typeof err === 'object') {
        notFoundElements.set(err, el)
    }
}

export function notFoundElement(err: unknown): object | undefined {
    return err && typeof err === 'object' ? notFoundElements.get(err) : undefined
}

/**
 * Give the error of a stale element that was not found again its code, see
 * `ELEMENT_NOT_FOUND_AGAIN`, and its `cause`, the stale element error of the driver (when the
 * caller gives it). When the element that was not found is the element of the command, the
 * message names the command (the outer layers of the command name it in turn, so the message
 * names the command that the user called); the first line of the stack shows that message.
 */
export function nameNotFoundAgain(err: Error, el: object, commandName: string, cause?: unknown) {
    if (!Object.isExtensible(err)) {
        return
    }
    if (cause !== undefined) {
        const withCause: Error & { cause?: unknown } = err
        withCause.cause ??= cause
    }
    const firstLine = `${err.name}: ${err.message}`
    const withCode: Error & { code?: string } = err
    withCode.code = ELEMENT_NOT_FOUND_AGAIN
    if (notFoundElements.get(err) === el) {
        /**
         * a replacer function: `$` patterns of a replacement string would turn `$$` into `$`
         */
        err.message = err.message.replace(/^Can't call \S+ /, () => `Can't call ${commandName} `)
    }
    if (typeof err.stack === 'string' && err.stack.startsWith(firstLine)) {
        err.stack = `${err.name}: ${err.message}` + err.stack.slice(firstLine.length)
    }
}

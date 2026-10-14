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
 * Name the error of a stale element that was not found again, see `ELEMENT_NOT_FOUND_AGAIN`.
 * When the element that was not found is the element of the command, the message names the
 * command (the outer layers of the command name it in turn, so the message names the
 * command that the user called). The first line of the stack shows the new name and message.
 */
export function nameNotFoundAgain(err: Error, el: object, commandName: string) {
    if (!Object.isExtensible(err)) {
        return
    }
    const firstLine = `${err.name}: ${err.message}`
    err.name = ELEMENT_NOT_FOUND_AGAIN
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

/**
 * whether the error is the one of an item of a `$$()` list in `el` (the list of `el`, or of an
 * element in it) that was not found again: a command of `el` that finds its items again in a
 * new way (for example by their text) can run once more, see the element middleware
 */
export function isListItemNotFoundAgain(err: unknown, el: object): boolean {
    const item = notFoundElement(err) as { index?: number, parent?: object } | undefined
    if (!isElementNotFoundAgain(err) || item?.index === undefined) {
        return false
    }
    const seen = new Set<object>()
    for (let parent = item.parent as { parent?: object } | undefined; parent && !seen.has(parent); parent = parent.parent as { parent?: object } | undefined) {
        if (parent === el) {
            return true
        }
        seen.add(parent)
    }
    return false
}

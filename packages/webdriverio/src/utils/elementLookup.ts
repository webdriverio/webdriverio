/**
 * A leaf module without imports: the element middleware, `implicitWait` and the
 * `utils/index.ts` barrel import it.
 *
 * A command runs other commands on its element (`getText` runs `getElementText`), and each
 * of them has a layer of the element middleware. When the page removed the element, the
 * first lookup that waits `waitforTimeout` and does not find it marks the element; every
 * other layer of the element then throws its stale element error at once instead of
 * waiting again. The mark lives only while the element has an active layer, so the next
 * command on the element looks for it again.
 */

/**
 * the number of active middleware layers of each element
 */
const activeCommands = new WeakMap<object, number>()

/**
 * elements that a lookup waited for and did not find, see `markNotFound`
 */
const notFound = new WeakSet<object>()

/**
 * a registered symbol: another copy of webdriverio in the same process sees the flag
 */
const WAITED_FOR = Symbol.for('wdio:waitedFor')

/**
 * a middleware layer of the element starts
 */
export function enterCommand(el: object) {
    activeCommands.set(el, (activeCommands.get(el) ?? 0) + 1)
}

/**
 * a middleware layer of the element ends; with the last one the mark of the element goes
 */
export function leaveCommand(el: object) {
    const count = (activeCommands.get(el) ?? 0) - 1
    if (count > 0) {
        activeCommands.set(el, count)
        return
    }
    activeCommands.delete(el)
    notFound.delete(el)
}

/**
 * a lookup waited for the element and did not find it. Only while the element has an
 * active layer, so that a mark never outlives the command.
 */
export function markNotFound(el: object) {
    if (activeCommands.has(el)) {
        notFound.add(el)
    }
}

export function isMarkedNotFound(el: object): boolean {
    return notFound.has(el)
}

/**
 * Flag the "element wasn't found" error of a lookup that waited and did not find the
 * element, with a hidden property. An error that can not get it (frozen) is left as it is.
 */
export function markWaited(err: unknown) {
    if (err && typeof err === 'object' && Object.isExtensible(err)) {
        Object.defineProperty(err, WAITED_FOR, { value: true })
    }
}

/**
 * whether the error comes from a lookup that waited and did not find the element, see
 * `markWaited`
 */
export function waitedFor(err: unknown): boolean {
    return Boolean(err && typeof err === 'object' && (err as { [WAITED_FOR]?: boolean })[WAITED_FOR] === true)
}

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

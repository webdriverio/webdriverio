/**
 * A leaf module without imports: the element middleware, `implicitWait`, `waitUntil`,
 * `waitForStable`, `setValue` and the `utils/index.ts` barrel import it.
 *
 * A command runs other commands on its element (`getText` runs `getElementText`), and each
 * of them has a layer of the element middleware. When the page removed the element, the
 * first layer that waits `waitforTimeout` for it and does not find it records that on the
 * error that it throws. The outer layers of the element get this error and throw it at
 * once instead of waiting again. Any other stale error, for example of a script that got
 * the element after the page rendered it again, makes a layer look for the element again.
 */

/**
 * errors thrown by a layer that waited for its element and did not find it, with that element.
 * A weak reference: a reporter that keeps the error does not keep the element. The element is
 * alive while its layers run, which is when the record is read. Each copy of webdriverio has
 * its own records: the layers of another copy look again (one more wait)
 */
const gaveUp = new WeakMap<object, WeakRef<object>>()

/**
 * a registered symbol: another copy of webdriverio in the same process sees the flag
 */
const WAITED_FOR = Symbol.for('wdio:waitedFor')

/**
 * a layer of the element waited for it, did not find it and throws `err`. A value that is
 * not an object gets no record: the outer layers look for the element again.
 */
export function markGaveUp(err: unknown, el: object) {
    if (err && typeof err === 'object') {
        gaveUp.set(err, new WeakRef(el))
    }
}

/**
 * the element whose lookup gave up and threw `err`, or an error that `err` wraps as its `cause`
 */
function gaveUpElement(err: unknown): object | undefined {
    const seen = new Set<object>()
    while (err && typeof err === 'object' && !seen.has(err)) {
        const el = gaveUp.get(err)?.deref()
        if (el) {
            return el
        }
        seen.add(err)
        err = (err as { cause?: unknown }).cause
    }
    return undefined
}

/**
 * whether a layer of the element waited for it, did not find it and threw `err` (or the
 * `cause` of `err`)
 */
export function gaveUpFor(err: unknown, el: object): boolean {
    return gaveUpElement(err) === el
}

/**
 * give the record of `from` to `to`, an error that replaces it (e.g. the error of `waitUntil`)
 */
export function passOn(from: unknown, to: unknown) {
    const el = gaveUpElement(from)
    if (el) {
        markGaveUp(to, el)
    }
}

/**
 * the checks of webdriverio, whose lookup of a stale element does not wait for it: they look
 * again after an inner layer gave up, and answer at once. Exact names: a custom check can run
 * commands that wait for the element, and a `waitFor*` or `waitUntil` layer that looked again
 * would run the whole wait again
 */
const CORE_CHECKS = new Set(['isExisting', 'isDisplayed', 'isClickable'])

export function isCoreCheck(commandName: string): boolean {
    return CORE_CHECKS.has(commandName)
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

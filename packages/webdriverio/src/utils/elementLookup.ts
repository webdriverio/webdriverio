/**
 * A leaf module without imports: the element middleware, `implicitWait`, `setValue` and
 * the `utils/index.ts` barrel import it.
 *
 * A command runs other commands on its element (`getText` runs `getElementText`), and each
 * of them has a layer of the element middleware. When the page removed the element, the
 * first lookup that waits `waitforTimeout` and does not find it marks the layers of the
 * element that are active at that time: they throw their stale element error at once
 * instead of waiting again. A layer that starts later (the next poll of `waitUntil`, a
 * check after a caught failure, the next command) looks for the element again.
 */

/**
 * a layer of the element middleware
 */
export type Layer = object

/**
 * the active layers of each element
 */
const activeLayers = new WeakMap<object, Set<Layer>>()

/**
 * the layers that were active when a lookup waited for their element and did not find it
 */
const notFound = new WeakSet<Layer>()

/**
 * a registered symbol: another copy of webdriverio in the same process sees the flag
 */
const WAITED_FOR = Symbol.for('wdio:waitedFor')

/**
 * a middleware layer of the element starts
 */
export function enterCommand(el: object): Layer {
    const layer: Layer = {}
    const layers = activeLayers.get(el) ?? new Set<Layer>()
    layers.add(layer)
    activeLayers.set(el, layers)
    return layer
}

/**
 * a middleware layer of the element ends
 */
export function leaveCommand(el: object, layer: Layer) {
    const layers = activeLayers.get(el)
    layers?.delete(layer)
    if (layers?.size === 0) {
        activeLayers.delete(el)
    }
}

/**
 * a lookup waited for the element and did not find it: mark the layers of the element
 * that are active now, so that a mark never outlives a command
 */
export function markNotFound(el: object) {
    for (const layer of activeLayers.get(el) ?? []) {
        notFound.add(layer)
    }
}

/**
 * whether the layer was active when a lookup waited for the element and did not find it;
 * without a layer, whether an active layer of the element was
 */
export function isMarkedNotFound(el: object, layer?: Layer): boolean {
    if (layer) {
        return notFound.has(layer) && Boolean(activeLayers.get(el)?.has(layer))
    }
    return [...activeLayers.get(el) ?? []].some((active) => notFound.has(active))
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

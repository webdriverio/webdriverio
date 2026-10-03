import type { Session } from '../session.js'

/**
 * Key of the page-side record. A symbol from the global registry, so it
 * can't collide with page code and the snapshot script can read it.
 */
export const RECORDER_KEY = 'wdio.page'

/**
 * Runs in the page before any of its scripts (an init script) and records
 * what the DOM alone can't tell the snapshot:
 *
 * - every shadow root, including closed ones (`el.shadowRoot` is null for a
 *   closed root, so its content would be missing from the snapshot),
 * - every element that registers a click or pointer listener, so a `<span>`
 *   icon wired up with `addEventListener('click', …)` counts as clickable
 *   even without a role, an `onclick` attribute or a name.
 *
 * Self-contained: it is serialized into the page.
 */
export function pageRecorder () {
    const key = Symbol.for('wdio.page')
    const page = window as unknown as Record<symbol, { roots: WeakMap<Element, ShadowRoot>, clickable: WeakSet<EventTarget> } | undefined>
    if (page[key]) {
        return
    }
    const record = { roots: new WeakMap<Element, ShadowRoot>(), clickable: new WeakSet<EventTarget>() }
    Object.defineProperty(window, key, { value: record, configurable: true })

    const attachShadow = Element.prototype.attachShadow
    Element.prototype.attachShadow = function (this: Element, init: ShadowRootInit) {
        const root = attachShadow.call(this, init)
        record.roots.set(this, root)
        return root
    }
    const CLICK = new Set(['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend'])
    const addEventListener = EventTarget.prototype.addEventListener
    EventTarget.prototype.addEventListener = function (this: EventTarget, type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
        if (CLICK.has(type) && typeof Element !== 'undefined' && this instanceof Element) {
            record.clickable.add(this)
        }
        return addEventListener.call(this, type, listener, options)
    }
}

/**
 * Install the recorder for every page and frame the session loads from now
 * on. Needs WebDriver BiDi; without it snapshots fall back to open shadow
 * roots and `onclick` attributes.
 */
export async function installPageRecorder (session: Session) {
    if (!session.isWeb || session.applies.includes('M') || !session.isBidi || typeof session.browser.addInitScript !== 'function') {
        return
    }
    await session.browser.addInitScript(pageRecorder)
}

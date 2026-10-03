import { BIDI_MASK, ELEMENT_KEY, type remote } from 'webdriver'

import { Key } from '../constants.js'
import { getContextManager } from '../session/context.js'
import { contextIdValue, heldBrowsingContext } from '../session/browsingContext.js'
import { frameOffset } from './frameOffset.js'

/**
 * Classic WebDriver element endpoints only see the session's current
 * browsing context. An element found in another held context (a frame, or a
 * tab that is not the current one) has to be handled in its own document.
 *
 * `routeElementEndpoints` wraps those endpoints on every element object, so
 * each element command that is built on them works in any held context
 * without a branch of its own. Elements of the current context still go to
 * classic WebDriver unchanged.
 */

/**
 * The held context `scope` belongs to, when that is not the session's
 * current context.
 */
export async function foreignContext (scope: unknown): Promise<WebdriverIO.BrowsingContext | undefined> {
    const held = heldBrowsingContext(scope)
    if (!held) {
        return undefined
    }
    const current = contextIdValue(await getContextManager(held.browser).getCurrentContext())
    return held.contextId === current ? undefined : held
}

/**
 * An element argument for `execute`, resolved in the held context.
 */
const ref = (elementId: string) => ({ [ELEMENT_KEY]: elementId }) as unknown as HTMLElement

/**
 * Type `text` into an element with trusted key events in its own context.
 * `replace` selects the current content first, like `setValue`. Otherwise
 * the caret moves to the end, like Element Send Keys.
 */
export async function typeInContext (
    held: WebdriverIO.BrowsingContext,
    elementId: string,
    text: string,
    options: { replace: boolean, mask?: boolean }
) {
    await held.execute((el: HTMLElement, replace: boolean) => {
        el.focus()
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            if (replace) {
                el.select()
                return
            }
            try {
                el.setSelectionRange(el.value.length, el.value.length)
            } catch {
                // e.g. `type="email"` or `type="number"` have no selection API
            }
            return
        }
        const selection = el.ownerDocument.getSelection()
        const range = el.ownerDocument.createRange()
        range.selectNodeContents(el)
        if (!replace) {
            range.collapse(false)
        }
        selection?.removeAllRanges()
        selection?.addRange(range)
    }, ref(elementId), options.replace)

    /**
     * An empty `setValue` still has to clear the selected content.
     */
    const keys = text.length > 0 ? Array.from(text) : options.replace ? [Key.Backspace] : []
    if (keys.length === 0) {
        return
    }
    const browser = held.browser
    const params: remote.InputPerformActionsParameters = {
        context: held.contextId,
        actions: [{
            id: 'keyboard',
            type: 'key',
            actions: keys.flatMap((key) => [
                { type: 'keyDown' as const, value: key },
                { type: 'keyUp' as const, value: key }
            ])
        }]
    }
    if (options.mask) {
        Object.assign(params, { [BIDI_MASK]: true })
    }
    await browser.inputPerformActions(params)
    await browser.inputReleaseActions({ context: held.contextId })
}

/**
 * Elements that match `using`/`value` below the element, in document order.
 */
async function findInContext (
    held: WebdriverIO.BrowsingContext,
    elementId: string,
    using: string,
    value: string
): Promise<Record<string, string>[]> {
    const found = await held.execute((root: Element, using: string, value: string) => {
        const text = (el: Element) => ((el as HTMLElement).innerText ?? el.textContent ?? '').trim()
        if (using === 'xpath') {
            const result = root.ownerDocument.evaluate(value, root, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
            return Array.from({ length: result.snapshotLength }, (_, i) => result.snapshotItem(i))
                .filter((node): node is Element => node?.nodeType === Node.ELEMENT_NODE)
        }
        if (using === 'link text' || using === 'partial link text') {
            return Array.from(root.querySelectorAll('a')).filter((a) => (
                using === 'link text' ? text(a) === value : text(a).includes(value)
            ))
        }
        return Array.from(root.querySelectorAll(value))
    }, ref(elementId), using, value)
    /**
     * `execute` returns DOM nodes as element references.
     */
    return found as unknown as Record<string, string>[]
}

function noSuchElement (using: string, value: string) {
    const error = new Error(`no such element: Unable to locate element: {"method":"${using}","selector":"${value}"}`)
    error.name = 'no such element'
    return error
}

/**
 * Take Element Screenshot for an element of another held context: measure it
 * in its own document and clip a capture of the top-level context it is
 * shown in. BiDi only captures top-level contexts.
 */
async function screenshotInContext (held: WebdriverIO.BrowsingContext, elementId: string) {
    await held.execute((el: Element) => el.scrollIntoView({ block: 'nearest', inline: 'nearest' }), ref(elementId))
    const rect = await held.execute((el: Element) => {
        const { x, y, width, height } = el.getBoundingClientRect()
        return { x, y, width, height }
    }, ref(elementId))
    const { top, x, y } = held.isFrame ? await frameOffset(held) : { top: held, x: 0, y: 0 }
    /**
     * Clip against the whole document, so an element of a frame that reaches
     * past the bottom of the viewport is not cut off.
     */
    const scroll = await top.execute(() => ({ x: window.scrollX, y: window.scrollY }))
    const { data } = await held.browser.browsingContextCaptureScreenshot({
        context: top.contextId,
        origin: 'document',
        clip: { type: 'box', x: scroll.x + x + rect.x, y: scroll.y + y + rect.y, width: rect.width, height: rect.height }
    })
    return data
}

/**
 * Element Click. Clicking an `<option>` selects it (toggles it in a
 * `multiple` select) and fires `input`, and `change` when the selection
 * changed. Anything else gets a trusted pointer click after it (and every
 * frame around it) is scrolled into view.
 */
async function clickInContext (held: WebdriverIO.BrowsingContext, elementId: string) {
    const selectedOption = await held.execute((el: HTMLElement) => {
        el.scrollIntoView({ block: 'center', inline: 'center' })
        if (el.tagName.toLowerCase() !== 'option') {
            return false
        }
        const option = el as HTMLOptionElement
        const select = option.closest('select')
        if (!select || select.disabled || option.disabled) {
            return true
        }
        const before = option.selected
        select.focus()
        option.selected = select.multiple ? !option.selected : true
        select.dispatchEvent(new Event('input', { bubbles: true }))
        if (option.selected !== before) {
            select.dispatchEvent(new Event('change', { bubbles: true }))
        }
        return true
    }, ref(elementId))
    if (selectedOption) {
        return
    }
    await held.browser.inputPerformActions({
        context: held.contextId,
        actions: [{
            id: 'pointer',
            type: 'pointer',
            parameters: { pointerType: 'mouse' },
            actions: [
                { type: 'pointerMove', duration: 0, x: 0, y: 0, origin: { type: 'element', element: { sharedId: elementId } } },
                { type: 'pointerDown', button: 0 },
                { type: 'pointerUp', button: 0 }
            ]
        }]
    })
    /**
     * A click that navigates the top-level page destroys the frame before
     * the release. The gesture already landed; there is no context left to
     * release.
     */
    await held.browser.inputReleaseActions({ context: held.contextId }).catch((err: Error) => {
        if (!err.message.includes('no such frame')) {
            throw err
        }
    })
}

function unsupported (endpoint: string) {
    return async () => {
        throw new Error(
            `\`${endpoint}\` is not supported for an element of another browsing context: ` +
            'WebDriver BiDi has no equivalent. Run it on an element of the session\'s current context.'
        )
    }
}

type Endpoint = (held: WebdriverIO.BrowsingContext, elementId: string, ...args: never[]) => Promise<unknown>

/**
 * The classic element endpoints element commands are built on, implemented
 * in the element's own browsing context.
 */
export const FOREIGN_ELEMENT_ENDPOINTS: Record<string, Endpoint> = {
    async findElementFromElement (held, elementId, using: string, value: string) {
        const [first] = await findInContext(held, elementId, using, value)
        if (!first) {
            throw noSuchElement(using, value)
        }
        return first
    },
    findElementsFromElement: (held, elementId, using: string, value: string) => findInContext(held, elementId, using, value),
    isElementSelected: (held, elementId) => held.execute((el: Element) => {
        const tag = el.tagName.toLowerCase()
        if (tag === 'option') {
            return (el as HTMLOptionElement).selected
        }
        const type = tag === 'input' ? (el as HTMLInputElement).type : ''
        return (type === 'checkbox' || type === 'radio') && (el as HTMLInputElement).checked
    }, ref(elementId)),
    isElementEnabled: (held, elementId) => held.execute((el: Element) => !el.matches(':disabled'), ref(elementId)),
    getElementAttribute: (held, elementId, name: string) => held.execute(
        (el: Element, name: string) => el.getAttribute(name),
        ref(elementId), name
    ),
    getElementProperty: (held, elementId, name: string) => held.execute(
        (el: Element, name: string) => (el as unknown as Record<string, unknown>)[name],
        ref(elementId), name
    ),
    /**
     * Drivers report colors as `rgba(r, g, b, a)`, so `rgb()` gets an alpha of 1.
     */
    getElementCSSValue: async (held, elementId, name: string) => {
        const value = await held.execute(
            (el: Element, name: string) => getComputedStyle(el).getPropertyValue(name),
            ref(elementId), name
        ) as string
        return value.replace(/rgb\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)\)/g, 'rgba($1,$2,$3, 1)')
    },
    getElementText: (held, elementId) => held.execute((el: HTMLElement) => el.innerText, ref(elementId)),
    getElementTagName: (held, elementId) => held.execute((el: Element) => el.tagName.toLowerCase(), ref(elementId)),
    getElementRect: (held, elementId) => held.execute((el: Element) => {
        const rect = el.getBoundingClientRect()
        const view = el.ownerDocument.defaultView
        return {
            x: rect.x + (view?.scrollX ?? 0),
            y: rect.y + (view?.scrollY ?? 0),
            width: rect.width,
            height: rect.height
        }
    }, ref(elementId)),
    elementClick: (held, elementId) => clickInContext(held, elementId),
    /**
     * Element Clear: only an editable element (an enabled, writable text
     * control or a content-editable element), like the classic endpoint.
     * Focus, empty the value (through the native setter so framework value
     * tracking sees it), fire `input` and `change`, blur.
     */
    elementClear: (held, elementId) => held.execute((el: HTMLElement) => {
        const tag = el.tagName.toLowerCase()
        const textTypes = ['text', 'search', 'url', 'tel', 'email', 'password', 'date', 'month', 'week', 'time', 'datetime-local', 'number', 'range', 'color', 'file']
        const field = el as HTMLInputElement
        const isTextControl = tag === 'textarea' || (tag === 'input' && textTypes.includes(field.type))
        if (isTextControl ? (field.disabled || field.readOnly) : !el.isContentEditable) {
            throw new Error('invalid element state: the element is not editable, so it can not be cleared')
        }
        el.focus()
        if (el.isContentEditable) {
            el.innerHTML = ''
            el.dispatchEvent(new Event('input', { bubbles: true }))
        } else {
            const field = el as HTMLInputElement
            const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value')?.set
            if (setter) {
                setter.call(field, '')
            } else {
                field.value = ''
            }
            field.dispatchEvent(new Event('input', { bubbles: true }))
            field.dispatchEvent(new Event('change', { bubbles: true }))
        }
        el.blur()
    }, ref(elementId)).then(() => null),
    elementSendKeys: (held, elementId, text: string, runtime?: { mask?: boolean }) => typeInContext(held, elementId, String(text), {
        replace: false,
        mask: runtime?.mask
    }).then(() => null),
    takeElementScreenshot: (held, elementId) => screenshotInContext(held, elementId),
    getElementComputedRole: unsupported('getElementComputedRole'),
    getElementComputedLabel: unsupported('getElementComputedLabel')
}

/**
 * Route the classic element endpoints on an element's property descriptors:
 * an element of another held context goes to `FOREIGN_ELEMENT_ENDPOINTS`,
 * every other element to classic WebDriver as before.
 */
export function routeElementEndpoints (properties: PropertyDescriptorMap) {
    for (const [name, endpoint] of Object.entries(FOREIGN_ELEMENT_ENDPOINTS)) {
        const classic = properties[name]?.value
        if (typeof classic !== 'function') {
            continue
        }
        properties[name] = {
            ...properties[name],
            value: async function (this: WebdriverIO.Element, elementId: string, ...args: never[]) {
                const held = await foreignContext(this)
                if (held) {
                    return endpoint(held, elementId, ...args)
                }
                return classic.call(this, elementId, ...args)
            }
        }
    }
    return properties
}

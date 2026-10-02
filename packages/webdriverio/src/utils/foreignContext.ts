import { BIDI_MASK, ELEMENT_KEY, type remote } from 'webdriver'

import { getContextManager } from '../session/context.js'
import { contextIdValue, heldBrowsingContext } from '../session/browsingContext.js'
import { frameOffset } from './frameOffset.js'
import { GET_VISIBLE_TEXT } from './thirdParty/getVisibleText.js'

/**
 * Classic WebDriver element endpoints only see the session's current
 * browsing context, and WebDriver BiDi has no way to run them in another
 * one. An element found in another held context (a frame, or a tab that is
 * not the current one) is handled in its own document instead, the way a
 * BiDi client such as Puppeteer does it: BiDi commands where one exists
 * (`browsingContext.locateNodes`, `input.performActions`, `input.setFiles`,
 * `browsingContext.captureScreenshot`), and otherwise the steps of the
 * WebDriver spec in a script.
 *
 * `routeElementEndpoints` wraps those endpoints on every element object, so
 * each element command that is built on them works in any held context
 * without a branch of its own. Elements of the current context still go to
 * classic WebDriver unchanged.
 *
 * @see https://w3c.github.io/webdriver/#elements
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
const sharedRef = (elementId: string): remote.ScriptSharedReference => ({ sharedId: elementId })

/**
 * An error with the name and message format of the classic WebDriver error
 * code, so callers (and the stale/interactable retries) treat it the same.
 */
function driverError (code: string, message: string) {
    const error = new Error(`${code}: ${message}`)
    error.name = code
    return error
}

type ScriptFailure = { error: string, message: string }
const isFailure = (result: unknown): result is ScriptFailure => (
    Boolean(result) && typeof result === 'object' && typeof (result as ScriptFailure).error === 'string'
)
function throwOnFailure<T> (result: T | ScriptFailure): T {
    if (isFailure(result)) {
        throw driverError(result.error, result.message)
    }
    return result
}

/**
 * Bring an element into view and check that it can be interacted with,
 * following the WebDriver spec. Runs in the element's own document, so it
 * has to stay self-contained.
 *
 * - `click`: Element Click steps 3-6 on the element's container: no file
 *   inputs, scroll into view, `element not interactable` when it is still not
 *   in view, `element click intercepted` when another element is on top.
 * - `clear`: Element Clear: `invalid element state` when the element is not
 *   editable, scroll into view, `element not interactable` when not in view.
 * - `keys`: Element Send Keys: scroll the container into view, check it is
 *   keyboard-interactable, focus it, and put the caret at the end.
 * - `screenshot`: Take Element Screenshot: scroll into view.
 *
 * The spec's "in view" only looks at the element's own document. A held
 * frame may itself be clipped by its parent frames or scrolled out of the
 * top-level viewport. An `IntersectionObserver` without a root measures the
 * element against the top-level viewport through every frame (also across
 * origins), and when it is not fully visible there, the native
 * `scrollIntoView` centers it in every ancestor document, like chromedriver
 * scrolls frames for a click. A frame that does not render (e.g. throttled)
 * may never report, so that check gives up after a moment.
 *
 * @see https://w3c.github.io/webdriver/#dfn-scrolls-into-view
 * @see https://w3c.github.io/webdriver/#dfn-in-view
 * @see https://w3c.github.io/webdriver/#dfn-obscuring
 */
async function prepareInteraction (el: HTMLElement, mode: 'click' | 'clear' | 'keys' | 'screenshot', isFrame: boolean) {
    const describe = (node: Element) => {
        const html = node.outerHTML
        const end = html.indexOf('>')
        return end === -1 ? html : html.slice(0, end + 1)
    }
    const failure = (error: string, message: string) => ({ error, message })

    const isDisabled = (node: Element): boolean => {
        if (['option', 'optgroup'].includes(node.localName) && !(node as HTMLOptionElement).disabled) {
            const parent = node.parentElement?.closest('optgroup,select')
            return parent ? isDisabled(parent) : false
        }
        return node.matches(':disabled')
    }
    const isReadOnly = (node: Element) => (
        ['input', 'textarea'].includes(node.localName) && (node as HTMLInputElement).readOnly
    )
    const MUTABLE_INPUT_TYPES = ['color', 'date', 'datetime-local', 'email', 'file', 'month', 'number', 'password', 'range', 'search', 'tel', 'text', 'time', 'url', 'week']
    const isMutableFormControl = (node: Element) => (
        !isReadOnly(node) && !isDisabled(node) && (
            node.localName === 'textarea' ||
            (node.localName === 'input' && MUTABLE_INPUT_TYPES.includes((node as HTMLInputElement).type))
        )
    )
    const isEditingHost = (node: HTMLElement) => node.isContentEditable || node.ownerDocument.designMode === 'on'

    /**
     * The pointer-interactable paint tree at the element's in-view center point.
     */
    const paintTree = (node: Element): { tree: Element[], point?: { x: number, y: number } } => {
        if (!node.isConnected) {
            return { tree: [] }
        }
        const rects = Array.from(node.getClientRects())
        if (rects.length === 0) {
            return { tree: [] }
        }
        const rect = rects.find((r) => r.width > 0 && r.height > 0) || rects[0]
        const view = node.ownerDocument.defaultView!
        const left = Math.max(0, Math.min(rect.x, rect.x + rect.width))
        const right = Math.min(view.innerWidth, Math.max(rect.x, rect.x + rect.width))
        const top = Math.max(0, Math.min(rect.y, rect.y + rect.height))
        const bottom = Math.min(view.innerHeight, Math.max(rect.y, rect.y + rect.height))
        const point = { x: Math.floor((left + right) / 2), y: Math.floor((top + bottom) / 2) }
        const root = node.getRootNode() as Document | ShadowRoot
        return { tree: root.elementsFromPoint(point.x, point.y), point }
    }
    /**
     * In view: part of its own paint tree, as if its pointer events were not
     * disabled.
     */
    const isInView = (node: HTMLElement) => {
        const pointerEvents = node.style.pointerEvents
        const style = node.getAttribute('style')
        try {
            node.style.pointerEvents = 'auto'
            const { tree } = paintTree(node)
            const row = node as HTMLTableRowElement
            if (node.localName === 'tr' && row.cells?.length) {
                return tree.includes(row.cells[0])
            }
            return tree.includes(node)
        } finally {
            node.style.pointerEvents = pointerEvents
            if (style === null) {
                node.removeAttribute('style')
            } else if (node.getAttribute('style') !== style) {
                node.setAttribute('style', style)
            }
        }
    }
    const visibleInTopLevelViewport = (node: HTMLElement) => new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
            observer.disconnect()
            resolve(true)
        }, 100)
        const observer = new IntersectionObserver(([entry]) => {
            clearTimeout(timeout)
            observer.disconnect()
            resolve(entry.intersectionRatio >= 1)
        })
        observer.observe(node)
    })
    const scrollIntoView = async (node: HTMLElement) => {
        if (!isInView(node)) {
            node.scrollIntoView({ behavior: 'instant', block: 'end', inline: 'nearest' })
        }
        if (isFrame && !await visibleInTopLevelViewport(node)) {
            node.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' })
        }
    }

    const container = (['option', 'optgroup'].includes(el.localName) && el.closest('datalist,select') as HTMLElement) || el

    if (mode === 'screenshot') {
        await scrollIntoView(el)
        return null
    }

    if (mode === 'clear') {
        if (isReadOnly(el) || isDisabled(el) || !(isMutableFormControl(el) || isEditingHost(el))) {
            return failure('invalid element state', `Element ${describe(el)} is not editable, so it can not be cleared`)
        }
        await scrollIntoView(el)
        if (!isInView(el)) {
            return failure('element not interactable', `Element ${describe(el)} could not be scrolled into view`)
        }
        return null
    }

    if (mode === 'click') {
        if (el.localName === 'input' && (el as HTMLInputElement).type === 'file') {
            return failure('invalid argument', `Cannot click ${describe(el)}, use \`setValue()\` or \`addValue()\` to upload files`)
        }
        await scrollIntoView(container)
        if (!isInView(container)) {
            return failure('element not interactable', `Element ${describe(el)} could not be scrolled into view`)
        }
        const { tree, point } = paintTree(container)
        if (!tree[0] || !container.contains(tree[0])) {
            return failure(
                'element click intercepted',
                `Element ${describe(el)} is not clickable at point (${point?.x}, ${point?.y}). ` +
                `Other element would receive the click: ${tree[0] ? describe(tree[0]) : 'none'}`
            )
        }
        return null
    }

    /**
     * Element Send Keys. A file input skips the interactability checks
     * (`strictFileInteractability` is off by default).
     */
    if (el.localName === 'input' && (el as HTMLInputElement).type === 'file') {
        return null
    }
    await scrollIntoView(container)
    const doc = container.ownerDocument
    if (container !== doc.body && container !== doc.documentElement) {
        if (doc.activeElement !== container) {
            container.focus()
        }
        if (doc.activeElement !== container) {
            return failure('element not interactable', `Element ${describe(el)} is not reachable by keyboard`)
        }
    }
    return null
}

/**
 * Find Element(s) From Element in the element's own document. CSS, tag name
 * and XPath use `browsingContext.locateNodes` with the element as start
 * node. Link text compares the rendered text of each `<a>` below the
 * element, like the spec's link text strategies.
 *
 * @see https://w3c.github.io/webdriver/#locator-strategies
 */
async function findInContext (
    held: WebdriverIO.BrowsingContext,
    elementId: string,
    using: string,
    value: string,
    maxNodeCount?: number
): Promise<Record<string, string>[]> {
    if (using === 'link text' || using === 'partial link text') {
        return findLinksInContext(held, using, value, elementId, maxNodeCount)
    }

    const locator: remote.BrowsingContextLocator | undefined = using === 'css selector' || using === 'tag name'
        ? { type: 'css', value }
        : using === 'xpath'
            ? { type: 'xpath', value }
            : undefined
    if (!locator) {
        throw driverError('invalid argument', `Locator strategy "${using}" is not supported for an element of another browsing context`)
    }
    const { nodes } = await held.browser.browsingContextLocateNodes({
        context: held.contextId,
        locator,
        startNodes: [sharedRef(elementId)],
        ...(maxNodeCount ? { maxNodeCount } : {})
    })
    return nodes
        .filter((node) => node.sharedId)
        .map((node) => ({ [ELEMENT_KEY]: node.sharedId! }))
}

/**
 * The link text strategies of the spec in a held context: every `<a>` below
 * `elementId` (or in the document) whose rendered text, trimmed, equals or
 * contains `value`. The rendered text comes from the getVisibleText atom, so
 * a background tab that is not rendered still skips hidden text.
 *
 * @see https://w3c.github.io/webdriver/#link-text
 */
export async function findLinksInContext (
    held: WebdriverIO.BrowsingContext,
    using: 'link text' | 'partial link text',
    value: string,
    elementId?: string,
    maxNodeCount?: number
): Promise<Record<string, string>[]> {
    const found = await held.execute(
        `const getVisibleText = ${GET_VISIBLE_TEXT}
        const [root, partial, value] = arguments
        return Array.from((root || document).querySelectorAll('a')).filter((a) => {
            const text = getVisibleText(a).trim()
            return partial ? text.includes(value) : text === value
        })`,
        elementId ? ref(elementId) : null, using === 'partial link text', value
    )
    /**
     * `execute` returns DOM nodes as element references.
     */
    return (found as unknown as Record<string, string>[]).slice(0, maxNodeCount)
}

/**
 * Take Element Screenshot: scroll the element into view, measure it in its
 * own document and clip a capture of the top-level context it is shown in.
 * Chromium only captures top-level contexts.
 */
async function screenshotInContext (held: WebdriverIO.BrowsingContext, elementId: string) {
    await held.execute(prepareInteraction, ref(elementId), 'screenshot', held.isFrame)
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
 * Element Click. An `<option>` gets the synthetic events of the spec on its
 * container and is selected (toggled in a `multiple` select) unless it is
 * disabled. Anything else gets a trusted pointer move, down and up at its
 * in-view center point, through `input.performActions` in its context.
 *
 * @see https://w3c.github.io/webdriver/#element-click
 */
async function clickInContext (held: WebdriverIO.BrowsingContext, elementId: string) {
    throwOnFailure(await held.execute(prepareInteraction, ref(elementId), 'click', held.isFrame))

    const isOption = await held.execute((el: HTMLElement) => {
        if (el.localName !== 'option') {
            return false
        }
        const option = el as HTMLOptionElement
        const parent = (option.closest('datalist,select') as HTMLSelectElement | null) || option
        const fire = (type: string) => parent.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }))
        fire('mouseover')
        fire('mousemove')
        fire('mousedown')
        parent.focus()
        const disabled = option.matches(':disabled') || Boolean(option.closest('select')?.disabled)
        if (!disabled) {
            const previous = option.selected
            option.selected = (parent as HTMLSelectElement).multiple ? !option.selected : true
            parent.dispatchEvent(new Event('input', { bubbles: true }))
            if (!previous) {
                parent.dispatchEvent(new Event('change', { bubbles: true }))
            }
        }
        fire('mouseup')
        fire('click')
        return true
    }, ref(elementId))
    if (isOption) {
        return null
    }

    await held.browser.inputPerformActions({
        context: held.contextId,
        actions: [{
            id: 'pointer',
            type: 'pointer',
            parameters: { pointerType: 'mouse' },
            actions: [
                { type: 'pointerMove', duration: 0, x: 0, y: 0, origin: { type: 'element', element: sharedRef(elementId) } },
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
    return null
}

/**
 * Element Clear, with the events the drivers fire: a form control is
 * focused, emptied, gets `change` and is blurred. It is left alone when it
 * is already empty and valid. A content-editable element is focused,
 * emptied and blurred, without events.
 *
 * @see https://w3c.github.io/webdriver/#element-clear
 */
async function clearInContext (held: WebdriverIO.BrowsingContext, elementId: string) {
    throwOnFailure(await held.execute(prepareInteraction, ref(elementId), 'clear', held.isFrame))
    await held.execute((el: HTMLElement) => {
        if (el.isContentEditable || el.ownerDocument.designMode === 'on') {
            if (el.innerHTML === '') {
                return
            }
            el.focus()
            el.innerHTML = ''
            el.blur()
            return
        }
        const field = el as HTMLInputElement
        const isEmpty = field.type === 'file' ? !field.files?.length : field.value === ''
        if (field.validity.valid && isEmpty) {
            return
        }
        field.focus()
        field.value = ''
        field.dispatchEvent(new Event('change', { bubbles: true }))
        field.blur()
    }, ref(elementId))
    return null
}

/**
 * Element Send Keys. A file input gets the newline separated paths through
 * `input.setFiles`. A `date` or `time` input gets its value set, with `input`
 * and `change`, like geckodriver does for these non-typeable controls.
 * Otherwise the element is focused with the caret at the end (unless it
 * already has focus) and the text is typed with key actions in its context.
 *
 * @see https://w3c.github.io/webdriver/#element-send-keys
 */
async function sendKeysInContext (
    held: WebdriverIO.BrowsingContext,
    elementId: string,
    text: string,
    options: { mask?: boolean } = {}
) {
    const kind = await held.execute((el: HTMLElement) => {
        const input = el as HTMLInputElement
        if (el.localName !== 'input') {
            return 'text'
        }
        if (input.type === 'file') {
            return input.hasAttribute('multiple') ? 'files' : 'file'
        }
        return input.type === 'date' || input.type === 'time' ? 'value' : 'text'
    }, ref(elementId))

    if (kind === 'file' || kind === 'files') {
        const files = text.split('\n')
        if (files.length === 0 || files.some((file) => file === '')) {
            throw driverError('invalid argument', 'Expected one or more newline separated file paths')
        }
        if (kind === 'file' && files.length > 1) {
            throw driverError('invalid argument', 'The file input does not accept multiple files')
        }
        await held.browser.inputSetFiles({ context: held.contextId, element: sharedRef(elementId), files })
        return null
    }

    const hadFocus = await held.execute((el: HTMLElement) => el.ownerDocument.activeElement === el, ref(elementId))
    throwOnFailure(await held.execute(prepareInteraction, ref(elementId), 'keys', held.isFrame))

    if (kind === 'value') {
        throwOnFailure(await held.execute((el: HTMLInputElement, value: string) => {
            if (el.readOnly || el.disabled) {
                return { error: 'element not interactable', message: 'The element is not mutable' }
            }
            el.value = value
            el.dispatchEvent(new Event('input', { bubbles: true }))
            el.dispatchEvent(new Event('change', { bubbles: true }))
            return null
        }, ref(elementId) as HTMLInputElement, text))
        return null
    }

    if (!hadFocus) {
        await held.execute((el: HTMLElement) => {
            if (el.isContentEditable) {
                const selection = el.ownerDocument.getSelection()
                selection?.setPosition(el, el.childNodes.length)
                return
            }
            const field = el as HTMLInputElement
            if (typeof field.value === 'string') {
                try {
                    field.setSelectionRange(field.value.length, field.value.length)
                } catch {
                    // e.g. `type="email"` or `type="number"` have no selection API
                }
            }
        }, ref(elementId))
    }

    if (text.length === 0) {
        return null
    }
    const params: remote.InputPerformActionsParameters = {
        context: held.contextId,
        actions: [{
            id: 'keyboard',
            type: 'key',
            actions: Array.from(text).flatMap((key) => [
                { type: 'keyDown' as const, value: key },
                { type: 'keyUp' as const, value: key }
            ])
        }]
    }
    if (options.mask) {
        Object.assign(params, { [BIDI_MASK]: true })
    }
    await held.browser.inputPerformActions(params)
    await held.browser.inputReleaseActions({ context: held.contextId })
    return null
}

function unsupported (endpoint: string) {
    return async () => {
        throw new Error(
            `\`${endpoint}\` is not supported for an element of another browsing context: ` +
            'WebDriver BiDi has no equivalent. Run it on an element of the session\'s current context.'
        )
    }
}

/**
 * Boolean attributes per element, from the HTML spec. Get Element Attribute
 * returns `"true"` or `null` for these instead of the attribute value.
 * `hidden` and `itemscope` apply to every element but custom elements.
 *
 * @see https://w3c.github.io/webdriver/#get-element-attribute
 */
const BOOLEAN_ATTRIBUTES: Record<string, string[]> = {
    audio: ['autoplay', 'controls', 'loop', 'muted'],
    button: ['autofocus', 'disabled', 'formnovalidate'],
    details: ['open'],
    dialog: ['open'],
    fieldset: ['disabled'],
    form: ['novalidate'],
    iframe: ['allowfullscreen'],
    img: ['ismap'],
    input: ['autofocus', 'checked', 'disabled', 'formnovalidate', 'multiple', 'readonly', 'required'],
    ol: ['reversed'],
    optgroup: ['disabled'],
    option: ['disabled', 'selected'],
    script: ['async', 'defer'],
    select: ['autofocus', 'disabled', 'multiple', 'required'],
    textarea: ['autofocus', 'disabled', 'readonly', 'required'],
    track: ['default'],
    video: ['autoplay', 'controls', 'loop', 'muted']
}

type Endpoint = (held: WebdriverIO.BrowsingContext, elementId: string, ...args: never[]) => Promise<unknown>

/**
 * The classic element endpoints element commands are built on, implemented
 * in the element's own browsing context.
 */
export const FOREIGN_ELEMENT_ENDPOINTS: Record<string, Endpoint> = {
    async findElementFromElement (held, elementId, using: string, value: string) {
        const [first] = await findInContext(held, elementId, using, value, 1)
        if (!first) {
            throw driverError('no such element', `Unable to locate element: {"method":"${using}","selector":"${value}"}`)
        }
        return first
    },
    findElementsFromElement: (held, elementId, using: string, value: string) => findInContext(held, elementId, using, value),
    isElementSelected: (held, elementId) => held.execute((el: Element) => {
        if (el.localName === 'option') {
            return (el as HTMLOptionElement).selected
        }
        const type = el.localName === 'input' ? (el as HTMLInputElement).type : ''
        return (type === 'checkbox' || type === 'radio') && (el as HTMLInputElement).checked
    }, ref(elementId)),
    /**
     * An `<option>` or `<optgroup>` in a disabled `<optgroup>` or `<select>`
     * counts as disabled, like the drivers report it. An XML document has no
     * enabled form controls.
     */
    isElementEnabled: (held, elementId) => held.execute((el: Element) => {
        if (['text/xml', 'application/xml'].includes(el.ownerDocument.contentType)) {
            return false
        }
        const isDisabled = (node: Element): boolean => {
            if (['option', 'optgroup'].includes(node.localName) && !(node as HTMLOptionElement).disabled) {
                const parent = node.parentElement?.closest('optgroup,select')
                return parent ? isDisabled(parent) : false
            }
            return node.matches(':disabled')
        }
        return !isDisabled(el)
    }, ref(elementId)),
    getElementAttribute: (held, elementId, name: string) => held.execute(
        (el: Element, name: string, booleanAttributes: Record<string, string[]>) => {
            const isCustomElement = el.localName.includes('-')
            const isBoolean = ((name === 'hidden' || name === 'itemscope') && !isCustomElement) ||
                (booleanAttributes[el.localName] || []).includes(name)
            if (isBoolean) {
                return el.hasAttribute(name) ? 'true' : null
            }
            return el.getAttribute(name)
        },
        ref(elementId), name, BOOLEAN_ATTRIBUTES
    ),
    getElementProperty: (held, elementId, name: string) => held.execute(
        (el: Element, name: string) => {
            const value = (el as unknown as Record<string, unknown>)[name]
            return value === undefined ? null : value
        },
        ref(elementId), name
    ),
    /**
     * The computed value, or `""` in an XML document. chromedriver reports
     * colors as `rgba(r, g, b, a)`, so in Chromium `rgb()` gets an alpha of 1.
     */
    getElementCSSValue: async (held, elementId, name: string) => {
        const value = await held.execute(
            (el: Element, name: string) => (
                ['text/xml', 'application/xml'].includes(el.ownerDocument.contentType)
                    ? ''
                    : getComputedStyle(el).getPropertyValue(name)
            ),
            ref(elementId), name
        ) as string
        /**
         * `isChromium` misses a Chrome session whose capabilities have no
         * `goog:chromeOptions`, so the browser name counts as well.
         */
        const browserName = (held.browser.capabilities.browserName || '').toLowerCase()
        const isChromium = held.browser.isChromium || ['chrome', 'chromium', 'chrome-headless-shell', 'msedge', 'microsoftedge'].includes(browserName)
        return isChromium
            ? value.replace(/rgb\((\s*\d+\s*),(\s*\d+\s*),(\s*\d+\s*)\)/g, 'rgba($1,$2,$3, 1)')
            : value
    },
    getElementText: (held, elementId) => held.execute(
        `return (${GET_VISIBLE_TEXT}).apply(null, arguments)`,
        ref(elementId)
    ),
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
    elementClear: (held, elementId) => clearInContext(held, elementId),
    elementSendKeys: (held, elementId, text: string, runtime?: { mask?: boolean }) => sendKeysInContext(held, elementId, String(text), {
        mask: runtime?.mask
    }),
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

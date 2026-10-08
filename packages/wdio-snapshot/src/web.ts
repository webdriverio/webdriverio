import type { RoleRule } from '@wdio/utils'
import type { SnapshotCandidate, SnapshotNode, SnapshotRef } from './format.js'

export interface CollectOptions {
    roles: RoleRule[]
    /**
     * roles the `role/` selector accepts, other roles get no `role/`
     * candidate (`knownRoles()` of `@wdio/utils`)
     */
    knownRoles?: string[]
    counter: number
    all: boolean
    boxes: boolean
    /**
     * include resolved hrefs on links
     */
    urls?: boolean
    /**
     * the page may assign refs (false in child frames, whose elements cannot
     * be resolved from the top document). `'ephemeral'` numbers the refs from
     * `counter` and computes their candidates, but reads and writes nothing in
     * `window.__wdioSession`, so the ids resolve to nothing later.
     */
    assignRefs: boolean | 'ephemeral'
    /**
     * keep only what overlaps the viewport. Candidates are computed for refs
     * in it only. Fixed and sticky descendants of an element out of it stay.
     */
    viewport?: boolean
    /**
     * also compute `aria-label`, `type`, `class` and `xpath-text` candidates.
     * Costs extra page-side work per snapshot, so it is off by default.
     */
    extendedCandidates?: boolean
}

export interface CollectResult {
    tree: SnapshotNode
    counter: number
    refs: SnapshotRef[]
}

/**
 * Walks the DOM and returns an accessibility tree with refs (RFC §8.2).
 * Runs in the browser: it must not reference anything outside its body.
 */
/* c8 ignore start: runs in the browser */
export function collectInPage (opts: CollectOptions, scope?: Element | null): CollectResult {
    type Node = SnapshotNode
    const w = window as unknown as { __wdioSession?: { refs: Map<string, WeakRef<Element>>, ids: WeakMap<Element, string> } }
    const store = opts.assignRefs === 'ephemeral'
        ? undefined
        : w.__wdioSession || (w.__wdioSession = { refs: new Map(), ids: new WeakMap() })
    let counter = opts.counter
    const refs: SnapshotRef[] = []

    const INTERACTIVE = new Set(['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio', 'switch', 'combobox', 'listbox', 'option',
        'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'slider', 'spinbutton', 'treeitem'])
    const NAME_FROM_CONTENT = new Set(['button', 'link', 'heading', 'option', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
        'cell', 'gridcell', 'columnheader', 'rowheader', 'treeitem', 'tooltip', 'switch', 'checkbox', 'radio', 'legend', 'caption'])
    /** longest text that names a clickable element without a role; longer text is a card, not a label */
    const MAX_TEXT_NAME = 80
    const VALUE_ROLES = new Set(['textbox', 'searchbox', 'combobox', 'spinbutton', 'slider'])
    const FORM_CONTROLS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])
    const EDITABLE = 'input:not([type=hidden]),textarea,[contenteditable]:not([contenteditable=false]),[role=textbox],[role=searchbox]'
    const PRUNE = new Set(['generic', 'presentation', 'none'])
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'TITLE', 'SVG'])
    const BLOCK_TAGS = new Set(['TD', 'TH', 'TR', 'LI', 'DT', 'DD', 'P', 'DIV', 'SECTION', 'ARTICLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LABEL', 'BUTTON', 'OPTION', 'FIGCAPTION', 'BLOCKQUOTE', 'PRE'])
    const NAMED_REF_ROLES = new Set(['img', 'dialog', 'alertdialog', 'region', 'form', 'list', 'table', 'grid', 'tabpanel', 'menu', 'tree'])
    const SECTIONING = 'article,aside,main,nav,section'
    /** unique candidates a ref gets besides the positional last resort */
    const MAX_CANDIDATES = 3
    /** longest text of a `tag=text` candidate */
    const MAX_CANDIDATE_TEXT = 40
    /** longest context text after the hint of an unnamed control */
    const HINT_CONTEXT_LENGTH = 48
    /** longest intent text of a repeated control */
    const INTENT_LENGTH = 80
    const TEST_ATTRS = ['data-testid', 'data-test', 'data-qa']

    const collapse = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
    const truncate = (s: string) => s.length > 80 ? `${s.slice(0, 79)}…` : s

    function matchesConstraint (el: Element, c: string) {
        switch (c) {
        case 'scoped to the body element':
            return !el.parentElement?.closest(SECTIONING)
        case 'scoped to the main element':
            return Boolean(el.parentElement?.closest('main'))
        case 'scoped to a sectioning content element':
            return Boolean(el.parentElement?.closest('article,aside,nav,section'))
        case 'scoped to a sectioning root element other than body':
            return Boolean(el.parentElement?.closest('blockquote,details,dialog,fieldset,figure,td'))
        case 'direct descendant of ol':
            return el.parentElement?.tagName === 'OL'
        case 'direct descendant of ul':
            return el.parentElement?.tagName === 'UL'
        case 'direct descendant of menu':
            return el.parentElement?.tagName === 'MENU'
        case 'ancestor table element has table role':
            return !el.closest('[role=grid],[role=treegrid]')
        case 'ancestor table element has grid role':
        case 'ancestor table element has treegrid role':
            return Boolean(el.closest('[role=grid],[role=treegrid]'))
        default:
            return true
        }
    }

    function implicitRole (el: Element) {
        const tag = el.tagName.toLowerCase()
        for (const [ruleTag, attributes, constraints, role] of opts.roles) {
            if (ruleTag !== tag) {
                continue
            }
            const attrsMatch = attributes.every(([name, test]) => {
                const value = el.getAttribute(name)
                if (test === 'set') {
                    return value !== null
                }
                if (test === 'undefined') {
                    return value === null
                }
                if (test === '>1') {
                    return Number(value) > 1
                }
                const expected = test.slice(1)
                return name === 'type' ? (value || 'text').toLowerCase() === expected : value === expected
            })
            if (attrsMatch && (constraints.length === 0 || constraints.some((c) => matchesConstraint(el, c)))) {
                return role
            }
        }
        if (tag === 'input') {
            return 'textbox'
        }
        if (tag === 'p') {
            return 'paragraph'
        }
        if (tag === 'iframe' || tag === 'frame') {
            return 'iframe'
        }
        return 'generic'
    }

    function roleOf (el: Element) {
        const explicit = collapse(el.getAttribute('role')).split(' ')[0]
        return explicit || implicitRole(el)
    }

    function isUnrendered (el: Element, style?: CSSStyleDeclaration) {
        if ((el as HTMLElement).hidden || el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('inert')) {
            return true
        }
        const computed = style || getComputedStyle(el)
        return computed.display === 'none' || (computed as unknown as { contentVisibility?: string }).contentVisibility === 'hidden'
    }

    function isInvisible (el: Element, style?: CSSStyleDeclaration) {
        const visibility = (style || getComputedStyle(el)).visibility
        return visibility === 'hidden' || visibility === 'collapse'
    }

    function isHidden (el: Element) {
        return isUnrendered(el) || isInvisible(el)
    }

    function isZeroSize (el: Element) {
        if (getComputedStyle(el).display === 'contents') {
            return false
        }
        const rect = el.getBoundingClientRect()
        return rect.width === 0 || rect.height === 0
    }

    // shadow roots and click listeners recorded by the page recorder (recorder.ts)
    const recorded = (window as unknown as Record<symbol, { roots: WeakMap<Element, ShadowRoot>, clickable: WeakSet<EventTarget> } | undefined>)[Symbol.for('wdio.page')]
    function shadowRootOf (el: Element): ShadowRoot | null {
        return el.shadowRoot || recorded?.roots.get(el) || null
    }

    /**
     * Bot checks (PerimeterX) plant elements whose DOM properties are all
     * shadowed by properties of their own, so `tagName`, `getAttribute` and
     * the rest read `undefined`. Real elements get them from the prototype.
     * Such a decoy is no content: it is left out of the snapshot.
     */
    function isDecoy (node: globalThis.Node) {
        return Object.prototype.hasOwnProperty.call(node, 'tagName')
    }

    function childNodesOf (node: Element | ShadowRoot | Document): globalThis.Node[] {
        const el = node as Element
        const root = el.nodeType === 1 ? shadowRootOf(el) : null
        if (root) {
            return [...root.childNodes].filter((c) => !isDecoy(c))
        }
        if (el.tagName === 'SLOT') {
            const assigned = (el as HTMLSlotElement).assignedNodes()
            return (assigned.length ? assigned : [...el.childNodes]).filter((c) => !isDecoy(c))
        }
        return [...node.childNodes].filter((c) => !isDecoy(c))
    }

    function textContentOf (node: globalThis.Node, skipControls = false): string {
        if (node.nodeType === 3) {
            return node.textContent || ''
        }
        if (node.nodeType !== 1) {
            return ''
        }
        const el = node as Element
        if (SKIP_TAGS.has(el.tagName.toUpperCase()) || isHidden(el)) {
            return ''
        }
        if (skipControls && ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) {
            return ''
        }
        if (el.tagName === 'IMG') {
            return el.getAttribute('alt') || ''
        }
        const label = el.getAttribute('aria-label')
        if (label) {
            return label
        }
        const inline = getComputedStyle(el).display.startsWith('inline')
        const inner = childNodesOf(el).map((c) => textContentOf(c, skipControls)).join('')
        return inline ? inner : ` ${inner} `
    }

    /** the text of the elements `aria-labelledby` names, as they are (an svg `<title>` included) */
    function labelledBy (el: Element) {
        return (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).map((id) => {
            const ref = (el.getRootNode() as Document).getElementById?.(id) || document.getElementById(id)
            return ref?.textContent || ''
        }).join(' ')
    }

    function accessibleName (el: Element, role: string): string {
        const labelledBy = el.getAttribute('aria-labelledby')
        if (labelledBy) {
            const text = labelledBy.split(/\s+/).map((id) => {
                const ref = (el.getRootNode() as Document).getElementById?.(id) || document.getElementById(id)
                return ref ? textContentOf(ref) : ''
            }).join(' ')
            if (collapse(text)) {
                return collapse(text)
            }
        }
        const ariaLabel = collapse(el.getAttribute('aria-label'))
        if (ariaLabel) {
            return ariaLabel
        }
        const tag = el.tagName
        if (['INPUT', 'SELECT', 'TEXTAREA', 'METER', 'PROGRESS', 'OUTPUT'].includes(tag)) {
            const labels = (el as HTMLInputElement).labels
            if (labels && labels.length) {
                const text = collapse([...labels].map((l) => textContentOf(l, true)).join(' '))
                if (text) {
                    return text
                }
            }
            const type = (el as HTMLInputElement).type
            if (tag === 'INPUT' && ['submit', 'reset', 'button'].includes(type)) {
                return (el as HTMLInputElement).value || (type === 'submit' ? 'Submit' : type === 'reset' ? 'Reset' : '')
            }
        }
        if (tag === 'IMG' || tag === 'AREA' || (tag === 'INPUT' && (el as HTMLInputElement).type === 'image')) {
            const alt = collapse(el.getAttribute('alt'))
            if (alt) {
                return alt
            }
        }
        if (tag === 'FIELDSET') {
            const legend = el.querySelector(':scope > legend')
            if (legend) {
                return collapse(textContentOf(legend))
            }
        }
        if (tag === 'TABLE') {
            const caption = el.querySelector(':scope > caption')
            if (caption) {
                return collapse(textContentOf(caption))
            }
        }
        if (tag === 'IFRAME') {
            return collapse(el.getAttribute('title')) || collapse(el.getAttribute('src'))
        }
        if (NAME_FROM_CONTENT.has(role) || /^H[1-6]$/.test(tag)) {
            const text = collapse(childNodesOf(el).map((c) => textContentOf(c)).join(''))
            if (text) {
                return text
            }
        }
        return collapse(el.getAttribute('title')) || collapse(el.getAttribute('placeholder'))
    }

    function states (el: Element, role: string): string[] {
        const out: string[] = []
        const input = el as HTMLInputElement
        const aria = (name: string) => el.getAttribute(`aria-${name}`)
        if (role === 'checkbox' || role === 'radio' || role === 'switch' || role === 'menuitemcheckbox' || role === 'menuitemradio') {
            const checked = aria('checked') ?? (input.indeterminate ? 'mixed' : String(Boolean(input.checked)))
            if (checked === 'mixed') {
                out.push('checked=mixed')
            } else if (checked === 'true') {
                out.push('checked')
            }
        }
        if (aria('selected') === 'true' || (role === 'option' && (el as HTMLOptionElement).selected)) {
            out.push('selected')
        }
        if (aria('expanded') === 'true') {
            out.push('expanded')
        } else if (aria('expanded') === 'false') {
            out.push('collapsed')
        }
        if (aria('pressed') === 'true') {
            out.push('pressed')
        } else if (aria('pressed') === 'mixed') {
            out.push('pressed=mixed')
        }
        let disabled = aria('disabled') === 'true'
        try {
            disabled = disabled || el.matches(':disabled')
        } catch {
            // not a form element
        }
        if (disabled) {
            out.push('disabled')
        }
        if (input.required || aria('required') === 'true') {
            out.push('required')
        }
        if ((input.readOnly && ['INPUT', 'TEXTAREA'].includes(el.tagName)) || aria('readonly') === 'true') {
            out.push('readonly')
        }
        let invalid = aria('invalid') === 'true'
        try {
            invalid = invalid || el.matches(':user-invalid')
        } catch {
            // selector not supported
        }
        if (invalid) {
            out.push('invalid')
        }
        let active = document.activeElement
        while (active?.shadowRoot?.activeElement) {
            active = active.shadowRoot.activeElement
        }
        if (active === el && el !== document.body) {
            out.push('focused')
        }
        const current = aria('current')
        if (current && current !== 'false') {
            out.push(`current=${current}`)
        }
        const level = aria('level') || (/^H([1-6])$/.exec(el.tagName) || [])[1]
        if (level && role === 'heading') {
            out.push(`level=${level}`)
        }
        if (role === 'spinbutton' || role === 'slider') {
            const min = aria('valuemin') ?? (input.min || null)
            const max = aria('valuemax') ?? (input.max || null)
            if (min) {
                out.push(`min=${min}`)
            }
            if (max) {
                out.push(`max=${max}`)
            }
        }
        return out
    }

    function valueOf (el: Element, role: string) {
        if (!VALUE_ROLES.has(role)) {
            return undefined
        }
        if (el.tagName === 'SELECT') {
            const select = el as HTMLSelectElement
            return collapse(select.selectedOptions[0]?.textContent) || undefined
        }
        const input = el as HTMLInputElement
        const value = 'value' in input ? String(input.value ?? '') : collapse(el.getAttribute('aria-valuetext') || el.getAttribute('aria-valuenow') || el.textContent)
        if (!value) {
            return undefined
        }
        return input.type === 'password' ? '••••' : truncate(value.replace(/\n/g, ' '))
    }

    /**
     * The control of a label that is on screen is what gets the ref; the
     * label only names it. A hidden control (custom checkbox) leaves the label
     * as the thing to click.
     */
    function isPlainLabel (el: Element) {
        const control = el.tagName === 'LABEL' ? (el as HTMLLabelElement).control : null
        if (!control) {
            return false
        }
        const rect = control.getBoundingClientRect()
        const style = getComputedStyle(control)
        if (rect.width < 4 || rect.height < 4 || style.opacity === '0' || style.visibility === 'hidden') {
            return false
        }
        // a custom checkbox parked at `left: -10000px` is sized but nobody can reach it; document coordinates, so a scrolled page does not count
        const view = control.ownerDocument.defaultView || window
        const root = control.ownerDocument.documentElement
        return rect.right + view.scrollX > 0 && rect.bottom + view.scrollY > 0 &&
            rect.left + view.scrollX < root.scrollWidth && rect.top + view.scrollY < root.scrollHeight
    }

    function isInteractive (el: Element, role: string) {
        if (isPlainLabel(el)) {
            return false
        }
        if (INTERACTIVE.has(role)) {
            return true
        }
        const tabindex = el.getAttribute('tabindex')
        if (tabindex !== null && Number(tabindex) >= 0) {
            return true
        }
        if ((el as HTMLElement).isContentEditable && !el.parentElement?.isContentEditable) {
            return true
        }
        if (recorded?.clickable.has(el) && !delegatesToChildren(el)) {
            return true
        }
        return (el.hasAttribute('onclick') && getComputedStyle(el).cursor === 'pointer') || pointerTarget(el)
    }

    /**
     * The outermost element with a pointer cursor: frameworks that handle
     * clicks at the document root (React) leave no listener on the element
     * itself, so the cursor is what tells a chart's "1Y" tab from text.
     * Its descendants inherit the cursor; only where it starts counts.
     */
    function pointerTarget (el: Element) {
        if (el === document.body || el === document.documentElement || getComputedStyle(el).cursor !== 'pointer' || isPlainLabel(el)) {
            return false
        }
        const parent = el.parentElement
        return !parent || getComputedStyle(parent).cursor !== 'pointer'
    }

    /**
     * The text around a control: the text nodes of `root` outside the control
     * itself, collapsed, read only until it is longer than `limit`. Inline
     * neighbours stay glued as `innerText` keeps them ("#1🗑"); a new block
     * (cell, item, paragraph) starts with a space so cells don't run together.
     */
    function textAround (root: Element, control: Element, limit: number) {
        if (isDecoy(root)) {
            return ''
        }
        const invisible = new Map<Element, boolean>()
        const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
            // decoys first: their element API is shadowed. A visibility:hidden wrapper is walked through, its visible descendants count
            acceptNode: (n) => {
                if (isDecoy(n)) {
                    return NodeFilter.FILTER_REJECT
                }
                if (n.nodeType === 3) {
                    const parent = n.parentElement
                    if (!parent) {
                        return NodeFilter.FILTER_ACCEPT
                    }
                    let hidden = invisible.get(parent)
                    if (hidden === undefined) {
                        hidden = isInvisible(parent)
                        invisible.set(parent, hidden)
                    }
                    return hidden ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT
                }
                const el = n as Element
                const style = getComputedStyle(el)
                if (isUnrendered(el, style)) {
                    return NodeFilter.FILTER_REJECT
                }
                invisible.set(el, isInvisible(el, style))
                return NodeFilter.FILTER_SKIP
            }
        })
        const blockOf = (node: globalThis.Node) => {
            let el = node.parentElement
            while (el && el !== root && !BLOCK_TAGS.has(el.tagName.toUpperCase())) {
                el = el.parentElement
            }
            return el
        }
        let out = ''
        let lastBlock: Element | null | undefined
        for (let text = walker.nextNode(); text && out.length <= limit; text = walker.nextNode()) {
            if (control.contains(text) || SKIP_TAGS.has((text.parentElement?.tagName || '').toUpperCase()) || !text.nodeValue) {
                continue
            }
            // collapsed per node so markup indentation does not eat into `limit`
            const value = text.nodeValue.replace(/\s+/g, ' ')
            const block = blockOf(text)
            out += lastBlock !== undefined && block !== lastBlock ? ` ${value}` : value
            lastBlock = block
        }
        return collapse(out)
    }

    /**
     * An unnamed clickable element (an icon wired up in JS) has nothing an
     * agent can tell apart. Describe what it is, its place among identical
     * siblings and the nearest text around it.
     */
    function hintOf (el: Element) {
        const label = el.getAttribute('title') || el.getAttribute('data-testid') || el.getAttribute('alt') ||
            el.querySelector('svg title')?.textContent || (FORM_CONTROLS.has(el.tagName) ? el.getAttribute('name') : null) || el.classList[0] || el.tagName.toLowerCase()
        let hint = collapse(label)
        const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.tagName === el.tagName && c.className === el.className) : []
        if (siblings.length > 1) {
            hint += ` ${siblings.indexOf(el) + 1} of ${siblings.length}`
        }
        let ancestor = el.parentElement
        for (let depth = 0; ancestor && depth < 4; depth++, ancestor = ancestor.parentElement) {
            // a group of icons only describes itself; the row around it says what they act on
            if ([...ancestor.children].every((c) => c.tagName === el.tagName && c.className === el.className)) {
                continue
            }
            const text = textAround(ancestor, el, HINT_CONTEXT_LENGTH)
            if (text) {
                return `${hint} in ${JSON.stringify(text.length > HINT_CONTEXT_LENGTH ? `${text.slice(0, HINT_CONTEXT_LENGTH - 1)}…` : text)}`
            }
        }
        return hint
    }

    /** a listener on a list or a row delegates for its children; only the innermost listener counts */
    function delegatesToChildren (el: Element) {
        for (let node = el.firstElementChild; node; node = node.nextElementSibling) {
            if (recorded?.clickable.has(node) || node.querySelector('a,button,input,select,textarea')) {
                return true
            }
        }
        return false
    }

    /**
     * query in the document and all open shadow roots
     */
    function deepQueryAll (root: Document | ShadowRoot, selector: string): Element[] {
        let out: Element[] = []
        try {
            out = [...root.querySelectorAll(selector)].filter((el) => !isDecoy(el))
        } catch {
            return []
        }
        for (const el of root.querySelectorAll('*')) {
            const shadow = isDecoy(el) ? null : shadowRootOf(el)
            if (shadow) {
                out = out.concat(deepQueryAll(shadow, selector))
            }
        }
        return out
    }

    const NO_ROLE_SELECTOR = new Set(['generic', 'text', 'none', 'presentation', 'paragraph'])

    function looksGenerated (id: string) {
        return /\d{4,}/.test(id) || /[0-9a-f]{8,}/i.test(id) || /^(:r|ember|mui-|radix-)/.test(id)
    }

    function cssPath (el: Element): string {
        const parts: string[] = []
        let current: Element | null = el
        while (current && current.nodeType === 1) {
            const testAttr = TEST_ATTRS.find((a) => current!.hasAttribute(a))
            if (current !== el && testAttr) {
                parts.unshift(`[${testAttr}="${CSS.escape(current.getAttribute(testAttr)!)}"]`)
                break
            }
            if (current !== el && current.id && !looksGenerated(current.id)) {
                parts.unshift(`#${CSS.escape(current.id)}`)
                break
            }
            const tag = current.tagName.toLowerCase()
            const parent: Element | null = current.parentElement
            if (!parent) {
                parts.unshift(tag)
                break
            }
            const siblings = [...parent.children].filter((c) => c.tagName === current!.tagName)
            parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${siblings.indexOf(current) + 1})` : tag)
            if (parent.tagName === 'BODY' || parent.tagName === 'HTML') {
                break
            }
            current = parent
        }
        return parts.join(' > ')
    }

    /**
     * Whether an element or one of its ancestors, across shadow hosts, is
     * hidden: it is not part of the accessibility tree.
     */
    function hiddenInTree (el: Element) {
        let current: Element | null = el
        while (current) {
            /**
             * a light DOM child of a shadow host that no slot takes is not
             * rendered, the snapshot walk does not see it either
             */
            if (isHidden(current) || (current.parentElement?.shadowRoot && !current.assignedSlot)) {
                return true
            }
            current = current.parentElement || ((current.getRootNode() as ShadowRoot).host ?? null)
        }
        return false
    }

    /**
     * How many elements of the whole document, open shadow roots included,
     * have a role and name, counted the way the `role/` selector matches:
     * also inside named controls the snapshot does not walk into. One pass
     * per role, on demand.
     */
    const roleNameCounts = new Map<string, Map<string, number>>()
    function roleNameCount (role: string, name: string) {
        let counts = roleNameCounts.get(role)
        if (!counts) {
            counts = new Map()
            for (const candidate of deepQueryAll(document, '*')) {
                if (roleOf(candidate) !== role || hiddenInTree(candidate)) {
                    continue
                }
                const candidateName = collapse(accessibleName(candidate, role))
                counts.set(candidateName, (counts.get(candidateName) || 0) + 1)
            }
            roleNameCounts.set(role, counts)
        }
        return counts.get(name) || 0
    }

    let allElements: Element[] | undefined
    /** the document and its open shadow roots do not change during a run: walked once */
    const everyElement = () => allElements ??= deepQueryAll(document, '*')

    /**
     * How many elements of the document have this accessible name, whatever
     * their role, as the `aria/` selector matches. Hidden ones count too: that
     * only withholds a candidate, it never vouches for a wrong one.
     */
    let ariaNameCounts: Map<string, number> | undefined
    function ariaNameCount (name: string) {
        if (!ariaNameCounts) {
            ariaNameCounts = new Map()
            for (const candidate of everyElement()) {
                const candidateName = collapse(accessibleName(candidate, roleOf(candidate)))
                if (candidateName) {
                    ariaNameCounts.set(candidateName, (ariaNameCounts.get(candidateName) || 0) + 1)
                }
            }
        }
        return ariaNameCounts.get(name) || 0
    }

    /** `raw` with whitespace collapsed, or undefined once that is longer than a `tag=text` candidate allows (stops reading there) */
    function shortText (raw: string | null) {
        let out = ''
        for (const word of (raw || '').matchAll(/\S+/g)) {
            out += out ? ` ${word[0]}` : word[0]
            if (out.length > MAX_CANDIDATE_TEXT) {
                return undefined
            }
        }
        return out
    }

    /** per tag, one pass over its elements: collapsed text (up to the candidate limit) -> how many */
    const textCounts = new Map<string, Map<string, number>>()
    function textCount (tag: string, text: string) {
        let counts = textCounts.get(tag)
        if (!counts) {
            counts = new Map()
            for (const candidate of everyElement()) {
                if (candidate.tagName.toLowerCase() === tag) {
                    const candidateText = shortText(candidate.textContent)
                    if (candidateText !== undefined) {
                        counts.set(candidateText, (counts.get(candidateText) || 0) + 1)
                    }
                }
            }
            textCounts.set(tag, counts)
        }
        return counts.get(text) || 0
    }

    /** one pass for the attribute and class candidates of the extended kinds, built on first use */
    let extendedCounts: { ariaLabel: Map<string, number>, type: Map<string, number>, tagClass: Map<string, number> } | undefined
    function extendedIndex () {
        if (!extendedCounts) {
            const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) || 0) + 1)
            extendedCounts = { ariaLabel: new Map(), type: new Map(), tagClass: new Map() }
            for (const candidate of everyElement()) {
                const tag = candidate.tagName.toLowerCase()
                const label = candidate.getAttribute('aria-label')
                if (label) {
                    bump(extendedCounts.ariaLabel, label)
                }
                const type = candidate.getAttribute('type')
                if (type && (tag === 'input' || tag === 'button')) {
                    // the `type` attribute value matches case-insensitively in a CSS selector
                    bump(extendedCounts.type, `${tag}\0${type.toLowerCase()}`)
                }
                for (const className of candidate.classList) {
                    bump(extendedCounts.tagClass, `${tag}\0${className}`)
                }
            }
        }
        return extendedCounts
    }

    function xpathLiteral (value: string) {
        if (!value.includes('"')) {
            return `"${value}"`
        }
        return value.includes("'") ? undefined : `'${value}'`
    }

    function candidates (el: Element, role: string, name: string): SnapshotCandidate[] {
        const unique = (selector: string) => deepQueryAll(document, selector).length === 1
        const out: SnapshotCandidate[] = []
        // extended kinds stop once a ref has enough; base kinds stay complete for stale-ref recovery
        const room = () => out.length < MAX_CANDIDATES
        for (const attr of TEST_ATTRS) {
            const value = el.getAttribute(attr)
            if (value) {
                const selector = `[${attr}="${CSS.escape(value)}"]`
                if (unique(selector)) {
                    out.push({ kind: 'testid', selector })
                }
            }
        }
        const selectable = !NO_ROLE_SELECTOR.has(role) && (!opts.knownRoles || opts.knownRoles.includes(role))
        if (name && selectable && !/[\n]/.test(name) && roleNameCount(role, name) === 1) {
            out.push({ kind: 'role', selector: `role/${role}[name="${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]` })
        }
        if (name && !/[\n]/.test(name) && ariaNameCount(name) === 1) {
            out.push({ kind: 'aria', selector: `aria/${name}` })
        }
        if (el.id && !looksGenerated(el.id) && unique(`#${CSS.escape(el.id)}`)) {
            out.push({ kind: 'id', selector: `#${CSS.escape(el.id)}` })
        }
        const tag = el.tagName.toLowerCase()
        const text = shortText(el.textContent)
        if ((role === 'button' || role === 'link') && text && text === name && tag !== 'input' && textCount(tag, text) === 1) {
            out.push({ kind: 'text', selector: `${tag}=${text}` })
        }
        const fieldName = el.getAttribute('name')
        if (fieldName && ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(el.tagName) && unique(`${tag}[name="${CSS.escape(fieldName)}"]`)) {
            out.push({ kind: 'name', selector: `${tag}[name="${CSS.escape(fieldName)}"]` })
        }
        if (opts.extendedCandidates) {
            const ariaLabel = el.getAttribute('aria-label')
            if (room() && ariaLabel && extendedIndex().ariaLabel.get(ariaLabel) === 1) {
                out.push({ kind: 'aria-label', selector: `[aria-label="${CSS.escape(ariaLabel)}"]` })
            }
            const type = el.getAttribute('type')
            if (room() && type && (tag === 'input' || tag === 'button') && extendedIndex().type.get(`${tag}\0${type.toLowerCase()}`) === 1) {
                out.push({ kind: 'type', selector: `${tag}[type="${CSS.escape(type)}"]` })
            }
            const className = room() ? [...el.classList].find((c) => !looksGenerated(c) && extendedIndex().tagClass.get(`${tag}\0${c}`) === 1) : undefined
            if (className) {
                out.push({ kind: 'class', selector: `${tag}.${CSS.escape(className)}` })
            }
            // a document-wide evaluate per ref: only when nothing better was found
            // document.evaluate does not see into shadow roots: a match there is another element
            const literal = !out.length && text && el.getRootNode() === document ? xpathLiteral(text) : undefined
            if (literal) {
                const xpath = `//${tag}[contains(., ${literal})]`
                try {
                    const found = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
                    if (found.snapshotLength === 1 && found.snapshotItem(0) === el) {
                        out.push({ kind: 'xpath-text', selector: xpath })
                    }
                } catch {
                    // not a valid expression for this text
                }
            }
        }
        out.push({ kind: 'css-path', selector: cssPath(el) })
        return out.filter((c, i) => out.findIndex((o) => o.selector === c.selector) === i)
    }

    function assignRef (el: Element) {
        if (!opts.assignRefs) {
            return undefined
        }
        if (!store) {
            return `e${++counter}`
        }
        let id = store.ids.get(el)
        if (!id || store.refs.get(id)?.deref() !== el) {
            id = `e${++counter}`
            store.ids.set(el, id)
        }
        store.refs.set(id, new WeakRef(el))
        return id
    }

    const pendingRefs: { el: Element, node: Node, order: number }[] = []
    let seq = 0

    /**
     * text of a <label> or <legend> is already the name of its control
     */
    function isNamingText (parent: Element, child: globalThis.Node) {
        if (child.nodeType === 3 && parent.tagName === 'LABEL') {
            return Boolean((parent as HTMLLabelElement).control)
        }
        return child.nodeType === 1 && (child as Element).tagName === 'LEGEND' && parent.tagName === 'FIELDSET'
    }

    /** viewport offset of the frame currently being walked, boxes are reported in top-level coordinates */
    let offset = [0, 0]
    function box (el: Element) {
        const r = el.getBoundingClientRect()
        return [Math.round(r.x + offset[0]), Math.round(r.y + offset[1]), Math.round(r.width), Math.round(r.height)]
    }

    /**
     * Whether the element's box overlaps the viewport. A `display: contents`
     * wrapper has no box: it goes where its parent goes.
     */
    let parentInView = true
    function inView (el: Element) {
        if (!opts.viewport || el === scope) {
            return true
        }
        if (getComputedStyle(el).display === 'contents') {
            return parentInView
        }
        const r = el.getBoundingClientRect()
        const x = r.x + offset[0]
        const y = r.y + offset[1]
        return x < window.innerWidth && x + r.width > 0 && y < window.innerHeight && y + r.height > 0
    }

    /**
     * A text node of a parent that spans more than the viewport (a long page
     * body) may sit outside it: measured with a Range, only then.
     */
    function textInView (node: globalThis.Node) {
        const parent = node.parentElement
        if (!opts.viewport || !parent || parent.getBoundingClientRect().height <= window.innerHeight) {
            return true
        }
        const range = node.ownerDocument!.createRange()
        range.selectNodeContents(node)
        const r = range.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) {
            return true
        }
        const x = r.x + offset[0]
        const y = r.y + offset[1]
        return x < window.innerWidth && x + r.width > 0 && y < window.innerHeight && y + r.height > 0
    }

    function walk (node: globalThis.Node): Node[] {
        // also a scope the caller picked
        if (isDecoy(node)) {
            return []
        }
        if (node.nodeType === 3) {
            const text = collapse(node.textContent)
            return text && parentInView && textInView(node) ? [{ role: 'text', name: truncate(text) }] : []
        }
        if (node.nodeType !== 1) {
            return []
        }
        const el = node as Element
        const order = seq++
        if (el.tagName.toUpperCase() === 'SVG') {
            // an icon that says something (a checkmark "Benefit available") is content; decoration is not
            const svgName = collapse(el.getAttribute('aria-label') || labelledBy(el) || el.querySelector(':scope > title')?.textContent)
            return svgName && el.getAttribute('aria-hidden') !== 'true' && !isHidden(el) ? [{ role: 'img', name: truncate(svgName) }] : []
        }
        if (SKIP_TAGS.has(el.tagName.toUpperCase())) {
            return []
        }
        const hidden = isHidden(el)
        if (hidden && !opts.all) {
            return []
        }
        const visible = inView(el)
        if (el.tagName === 'PRE' && !shadowRootOf(el) && !isInteractive(el, roleOf(el)) && ![...el.querySelectorAll('*')].some((c) => !isDecoy(c) && isInteractive(c, roleOf(c)))) {
            // a highlighted block is one token per span: one leaf keeps it readable and searchable
            const code = collapse((el as HTMLElement).innerText ?? el.textContent)
            if (code && (opts.all || !isZeroSize(el))) {
                if (!visible) {
                    return []
                }
                const block: Node = { role: 'code', name: code }
                if (hidden) {
                    block.hidden = true
                }
                if (opts.boxes) {
                    block.box = box(el)
                }
                return [block]
            }
        }
        let role = roleOf(el)
        // ARIA 1.1 combobox: the role sits on a wrapper, the editable control inside gets the ref instead
        if (VALUE_ROLES.has(role) && !FORM_CONTROLS.has(el.tagName) && el.querySelector(EDITABLE)) {
            role = 'generic'
        }
        const interactive = isInteractive(el, role)
        // a clickable element without a role ("1Y" in a chart's list) is named by its text, like a button
        const namedByText = interactive && !INTERACTIVE.has(role) && !NAME_FROM_CONTENT.has(role)
        let name = accessibleName(el, role)
        if (!name && namedByText) {
            const text = collapse(textContentOf(el, true))
            // a glyph ("✎", "🗑") says less than the hint: what it is and the row it acts on
            name = text.length <= MAX_TEXT_NAME && /[\p{L}\p{N}]/u.test(text) ? text : ''
        }
        const out: Node = { role }
        if (name) {
            out.name = truncate(name)
        }
        if (hidden) {
            out.hidden = true
        }
        const st = states(el, role)
        if (st.length) {
            out.states = st
        }
        const value = valueOf(el, role)
        if (value !== undefined) {
            out.value = value
        }
        if (interactive) {
            out.interactive = true
            if (!name) {
                out.hint = hintOf(el)
            }
        }
        if (opts.urls && (el.tagName === 'A' || el.tagName === 'AREA' || role === 'link')) {
            const linked = el as HTMLAnchorElement
            if ((el.tagName === 'A' || el.tagName === 'AREA') && el.hasAttribute('href') && linked.href) {
                out.url = linked.href
            } else {
                const raw = el.getAttribute('href')
                if (raw) {
                    try {
                        out.url = new URL(raw, el.ownerDocument?.baseURI || location.href).href
                    } catch {
                        out.url = raw
                    }
                }
            }
        }
        if (opts.boxes) {
            out.box = box(el)
        }

        if (role === 'iframe') {
            // tracking pixels and ad beacons: nothing to see or use in them
            const area = el.getBoundingClientRect()
            if (!opts.all && area.width * area.height < 100) {
                return []
            }
            const savedInView = parentInView
            parentInView = visible
            try {
                const doc = (el as HTMLIFrameElement).contentDocument
                if (!doc || !doc.body) {
                    throw new Error('cross-origin')
                }
                const saved = offset
                const r = el.getBoundingClientRect()
                offset = [saved[0] + r.x + el.clientLeft, saved[1] + r.y + el.clientTop]
                try {
                    out.children = childNodesOf(doc.body).flatMap((c) => walk(c))
                } finally {
                    offset = saved
                }
            } catch {
                out.note = 'cross-origin'
            } finally {
                parentInView = savedInView
            }
            if (!visible && !out.children?.length) {
                return []
            }
            if (visible) {
                pendingRefs.push({ el, node: out, order })
            }
            return [out]
        }

        const leaf = (NAME_FROM_CONTENT.has(role) || namedByText) && Boolean(name) && ![...el.querySelectorAll('*')].some((c) => {
            if (isDecoy(c)) {
                return false
            }
            const r = roleOf(c)
            return INTERACTIVE.has(r) || c.tagName === 'INPUT' || c.tagName === 'SELECT' || c.tagName === 'TEXTAREA' ||
                // the options of a popover ("24 hours 1 week 1 year") are each clickable, not one name
                (!INTERACTIVE.has(role) && pointerTarget(c))
        })
        const savedInView = parentInView
        parentInView = visible
        let children: Node[]
        try {
            children = leaf || VALUE_ROLES.has(role) || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
                ? []
                : childNodesOf(el).flatMap((c) => isNamingText(el, c) ? [] : walk(c))
        } finally {
            parentInView = savedInView
        }
        if (el.tagName === 'SELECT' && opts.all) {
            out.children = [...(el as HTMLSelectElement).options].map((o) => ({ role: 'option', name: collapse(o.textContent), ...(o.selected ? { states: ['selected'] } : {}) }))
        }
        if (!out.children && children.length) {
            out.children = children
        }
        if (!opts.all && !interactive && isZeroSize(el) && !out.children?.length) {
            return []
        }
        if (!visible && !out.children?.length) {
            return []
        }
        if (visible && (interactive || (name && NAMED_REF_ROLES.has(role)))) {
            pendingRefs.push({ el, node: out, order })
        }
        if (PRUNE.has(role) && !name && !interactive) {
            return hidden ? (out.children || []).map((c) => ({ ...c, hidden: true })) : out.children || []
        }
        if (!out.name && out.children?.length === 1 && out.children[0].role === 'text' && !interactive) {
            out.name = out.children[0].name
            delete out.children
        }
        return [out]
    }

    const DIALOG_ROLES = new Set(['dialog', 'alertdialog'])
    const LANDMARK_TAGS = new Set(['HEADER', 'FOOTER', 'NAV', 'ASIDE', 'MAIN'])
    const LANDMARK_ROLES = new Set(['banner', 'contentinfo', 'navigation', 'complementary', 'main'])

    const isDialog = (el: Element) => el.tagName === 'DIALOG' || DIALOG_ROLES.has(roleOf(el))
    const isLandmark = (el: Element) => isDialog(el) || LANDMARK_TAGS.has(el.tagName) || LANDMARK_ROLES.has(roleOf(el))

    /**
     * Controls that share role and name ("Choose This Flight" x 5) get the
     * text of the item each sits in: the highest ancestor that holds none of
     * the others. Ancestors are counted in one pass per group.
     */
    function addIntents (assigned: { el: Element, node: Node }[]) {
        const groups = new Map<string, { el: Element, node: Node }[]>()
        for (const member of assigned) {
            if (member.node.interactive && member.node.name) {
                const key = `${member.node.role}\0${member.node.name}`
                const group = groups.get(key)
                if (group) {
                    group.push(member)
                } else {
                    groups.set(key, [member])
                }
            }
        }
        const parentOf = (el: Element) => el.parentElement || (el.getRootNode() as ShadowRoot).host || null
        for (const members of groups.values()) {
            if (members.length < 2) {
                continue
            }
            const counts = new Map<Element, number>()
            for (const { el } of members) {
                for (let up: Element | null = el; up; up = parentOf(up)) {
                    counts.set(up, (counts.get(up) || 0) + 1)
                }
            }
            for (const { el, node } of members) {
                let item: Element | undefined
                let inDialog = false
                // only a dialog blocks the climb: a card's own <header> is part of its row
                for (let up: Element | null = el; up && counts.get(up) === 1; up = parentOf(up)) {
                    item = up
                    inDialog ||= isDialog(up)
                }
                if (!item || inDialog || isLandmark(item)) {
                    continue
                }
                const text = textAround(item, el, INTENT_LENGTH)
                if (text) {
                    node.intent = truncate(text)
                }
            }
        }
    }

    const rootEl = scope || document.body
    const children = scope ? walk(scope) : childNodesOf(rootEl).flatMap((c) => walk(c))
    const refsAssigned: { el: Element, node: Node }[] = []
    for (const { el, node } of pendingRefs.sort((a, b) => a.order - b.order)) {
        const id = el.ownerDocument === document ? assignRef(el) : undefined
        if (!id) {
            continue
        }
        node.ref = id
        refsAssigned.push({ el, node })
        refs.push({ id, role: node.role, name: node.name, candidates: candidates(el, node.role, node.name || '') })
    }
    addIntents(refsAssigned)
    const tree: Node = { role: 'document', name: document.title, url: location.href, children }
    return { tree, counter, refs }
}
/* c8 ignore stop */

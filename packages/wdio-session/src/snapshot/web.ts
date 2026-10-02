import type { RoleRule } from '@wdio/utils'
import type { SnapshotNode, SnapshotRef } from './format.js'

export interface CollectOptions {
    roles: RoleRule[]
    counter: number
    all: boolean
    boxes: boolean
    /**
     * include resolved hrefs on links
     */
    urls?: boolean
    /**
     * the page may assign refs (false in child frames, whose elements cannot
     * be resolved from the top document)
     */
    assignRefs: boolean
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
    const store = w.__wdioSession || (w.__wdioSession = { refs: new Map(), ids: new WeakMap() })
    let counter = opts.counter
    const refs: SnapshotRef[] = []

    const INTERACTIVE = new Set(['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio', 'switch', 'combobox', 'listbox', 'option',
        'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'slider', 'spinbutton', 'treeitem'])
    const NAME_FROM_CONTENT = new Set(['button', 'link', 'heading', 'option', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
        'cell', 'gridcell', 'columnheader', 'rowheader', 'treeitem', 'tooltip', 'switch', 'checkbox', 'radio', 'legend', 'caption'])
    const VALUE_ROLES = new Set(['textbox', 'searchbox', 'combobox', 'spinbutton', 'slider'])
    const PRUNE = new Set(['generic', 'presentation', 'none'])
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'TITLE', 'SVG'])
    const NAMED_REF_ROLES = new Set(['img', 'dialog', 'alertdialog', 'region', 'form', 'list', 'table', 'grid', 'tabpanel', 'menu', 'tree'])
    const SECTIONING = 'article,aside,main,nav,section'
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

    function isHidden (el: Element) {
        if ((el as HTMLElement).hidden || el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('inert')) {
            return true
        }
        const style = getComputedStyle(el)
        return style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' ||
            (style as unknown as { contentVisibility?: string }).contentVisibility === 'hidden'
    }

    function isZeroSize (el: Element) {
        if (getComputedStyle(el).display === 'contents') {
            return false
        }
        const rect = el.getBoundingClientRect()
        return rect.width === 0 || rect.height === 0
    }

    function childNodesOf (node: Element | ShadowRoot | Document): globalThis.Node[] {
        const el = node as Element
        if (el.shadowRoot) {
            return [...el.shadowRoot.childNodes]
        }
        if (el.tagName === 'SLOT') {
            const assigned = (el as HTMLSlotElement).assignedNodes()
            return assigned.length ? assigned : [...el.childNodes]
        }
        return [...node.childNodes]
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

    function isInteractive (el: Element, role: string) {
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
        return el.hasAttribute('onclick') && getComputedStyle(el).cursor === 'pointer'
    }

    /**
     * query in the document and all open shadow roots
     */
    function deepQueryAll (root: Document | ShadowRoot, selector: string): Element[] {
        let out: Element[] = []
        try {
            out = [...root.querySelectorAll(selector)]
        } catch {
            return []
        }
        for (const el of root.querySelectorAll('*')) {
            if (el.shadowRoot) {
                out = out.concat(deepQueryAll(el.shadowRoot, selector))
            }
        }
        return out
    }

    const namesSeen = new Map<string, number>()
    /**
     * `role + name` pairs, for `role/<role>[name="..."]` candidates
     */
    const roleNamesSeen = new Map<string, number>()
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

    function candidates (el: Element, role: string, name: string): string[] {
        const unique = (selector: string) => deepQueryAll(document, selector).length === 1
        const out: string[] = []
        for (const attr of TEST_ATTRS) {
            const value = el.getAttribute(attr)
            if (value) {
                const selector = `[${attr}="${CSS.escape(value)}"]`
                if (unique(selector)) {
                    out.push(selector)
                }
            }
        }
        if (name && !NO_ROLE_SELECTOR.has(role) && roleNamesSeen.get(`${role}\n${name}`) === 1 && !/[\n]/.test(name)) {
            out.push(`role/${role}[name="${name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`)
        }
        if (name && namesSeen.get(name) === 1 && !/[\n]/.test(name)) {
            out.push(`aria/${name}`)
        }
        if (el.id && !looksGenerated(el.id) && unique(`#${CSS.escape(el.id)}`)) {
            out.push(`#${CSS.escape(el.id)}`)
        }
        const tag = el.tagName.toLowerCase()
        const text = collapse(el.textContent)
        if ((role === 'button' || role === 'link') && text && text.length <= 40 && tag !== 'input' && text === name) {
            out.push(`${tag}=${text}`)
        }
        const fieldName = el.getAttribute('name')
        if (fieldName && ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(el.tagName) && unique(`${tag}[name="${CSS.escape(fieldName)}"]`)) {
            out.push(`${tag}[name="${CSS.escape(fieldName)}"]`)
        }
        out.push(cssPath(el))
        return [...new Set(out)]
    }

    function assignRef (el: Element) {
        if (!opts.assignRefs) {
            return undefined
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

    function walk (node: globalThis.Node): Node[] {
        if (node.nodeType === 3) {
            const text = collapse(node.textContent)
            return text ? [{ role: 'text', name: truncate(text) }] : []
        }
        if (node.nodeType !== 1) {
            return []
        }
        const el = node as Element
        const order = seq++
        if (SKIP_TAGS.has(el.tagName.toUpperCase())) {
            return []
        }
        const hidden = isHidden(el)
        if (hidden && !opts.all) {
            return []
        }
        const role = roleOf(el)
        const name = accessibleName(el, role)
        const interactive = isInteractive(el, role)
        const out: Node = { role }
        if (name) {
            out.name = truncate(name)
            namesSeen.set(name, (namesSeen.get(name) || 0) + 1)
            roleNamesSeen.set(`${role}\n${name}`, (roleNamesSeen.get(`${role}\n${name}`) || 0) + 1)
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
            pendingRefs.push({ el, node: out, order })
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
            }
            return [out]
        }

        const leaf = NAME_FROM_CONTENT.has(role) && Boolean(name) && ![...el.querySelectorAll('*')].some((c) => {
            const r = roleOf(c)
            return INTERACTIVE.has(r) || c.tagName === 'INPUT' || c.tagName === 'SELECT' || c.tagName === 'TEXTAREA'
        })
        const children = leaf || VALUE_ROLES.has(role) || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
            ? []
            : childNodesOf(el).flatMap((c) => isNamingText(el, c) ? [] : walk(c))
        if (el.tagName === 'SELECT' && opts.all) {
            out.children = [...(el as HTMLSelectElement).options].map((o) => ({ role: 'option', name: collapse(o.textContent), ...(o.selected ? { states: ['selected'] } : {}) }))
        }
        if (!out.children && children.length) {
            out.children = children
        }
        if (!opts.all && !interactive && isZeroSize(el) && !out.children?.length) {
            return []
        }
        if (interactive || (name && NAMED_REF_ROLES.has(role))) {
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

    const rootEl = scope || document.body
    const children = scope ? walk(scope) : childNodesOf(rootEl).flatMap((c) => walk(c))
    for (const { el, node } of pendingRefs.sort((a, b) => a.order - b.order)) {
        const id = el.ownerDocument === document ? assignRef(el) : undefined
        if (!id) {
            continue
        }
        node.ref = id
        refs.push({ id, role: node.role, name: node.name, candidates: candidates(el, node.role, node.name || '') })
    }
    const tree: Node = { role: 'document', name: document.title, url: location.href, children }
    return { tree, counter, refs }
}
/* c8 ignore stop */

import type { RoleRule } from './roles.js'

/**
 * Find elements by ARIA role and accessible name, for sessions where the
 * WebDriver BiDi accessibility locator is not available. Role and name follow
 * the same rules as `@wdio/session` snapshots: an explicit `role` attribute or
 * the implicit role from `rules`, and the accessible name from
 * `aria-labelledby`, `aria-label`, labels, `alt`, content or `title`.
 * Open shadow roots are searched.
 *
 * Runs in the browser: it must not reference anything outside its body.
 *
 * @param rules  implicit role table (`roleTable()` from `./roles.js`)
 * @param role   role to match
 * @param name   full accessible name to match, `null` to match any name
 * @param at     `null` returns the number of matches, a number returns that
 *               match (or `null`), `-1` returns every match
 * @param root   element to search within, `null` for the document
 */
/* c8 ignore start: runs in the browser */
export default function findByRole (
    rules: RoleRule[],
    role: string,
    name: string | null,
    at: number | null,
    root: Element | null
): number | Element | Element[] | null {
    const NAME_FROM_CONTENT = new Set(['button', 'link', 'heading', 'option', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
        'cell', 'gridcell', 'columnheader', 'rowheader', 'treeitem', 'tooltip', 'switch', 'checkbox', 'radio', 'legend', 'caption'])
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'META', 'LINK', 'TITLE'])
    const SECTIONING = 'article,aside,main,nav,section'

    const collapse = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()

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
        for (const [ruleTag, attributes, constraints, ruleRole] of rules) {
            if (ruleTag !== tag) {
                continue
            }
            const attrsMatch = attributes.every(([attr, test]) => {
                const value = el.getAttribute(attr)
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
                return attr === 'type' ? (value || 'text').toLowerCase() === expected : value === expected
            })
            if (attrsMatch && (constraints.length === 0 || constraints.some((c) => matchesConstraint(el, c)))) {
                return ruleRole
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
        const computed = explicit || implicitRole(el)
        /**
         * ARIA 1.3 renamed `img` to `image`
         */
        return computed === 'img' ? 'image' : computed
    }

    function isHidden (el: Element) {
        if ((el as HTMLElement).hidden || el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('inert')) {
            return true
        }
        const style = getComputedStyle(el)
        return style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse'
    }

    function childNodesOf (node: Element): Node[] {
        if (node.shadowRoot) {
            return [...node.shadowRoot.childNodes]
        }
        if (node.tagName === 'SLOT') {
            const assigned = (node as HTMLSlotElement).assignedNodes()
            return assigned.length ? assigned : [...node.childNodes]
        }
        return [...node.childNodes]
    }

    function textContentOf (node: Node, skipControls = false): string {
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

    function accessibleName (el: Element, elRole: string): string {
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
        if (NAME_FROM_CONTENT.has(elRole) || /^H[1-6]$/.test(tag)) {
            const text = collapse(childNodesOf(el).map((c) => textContentOf(c)).join(''))
            if (text) {
                return text
            }
        }
        return collapse(el.getAttribute('title')) || collapse(el.getAttribute('placeholder'))
    }

    /**
     * An element is left out of the accessibility tree when it or one of its
     * ancestors (across shadow boundaries) is hidden.
     */
    function inAccessibilityTree (el: Element) {
        let current: Element | null = el
        while (current) {
            if (isHidden(current)) {
                return false
            }
            const parent: Element | null = current.parentElement
            current = parent || ((current.getRootNode() as ShadowRoot).host ?? null)
        }
        return true
    }

    const matches: Element[] = []
    const visit = (scope: Document | ShadowRoot | Element) => {
        for (const el of scope.querySelectorAll('*')) {
            if (roleOf(el) === role && inAccessibilityTree(el) && (name === null || accessibleName(el, role) === name)) {
                matches.push(el)
            }
            if (el.shadowRoot) {
                visit(el.shadowRoot)
            }
        }
    }
    role = role === 'img' ? 'image' : role
    visit(root || document)

    if (at === null) {
        return matches.length
    }
    if (at === -1) {
        return matches
    }
    return matches[at] || null
}
/* c8 ignore stop */

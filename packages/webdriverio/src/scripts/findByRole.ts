import type { AccessibilityApi } from '../injected/accessibility.js'

/**
 * returned when the page does not have `WDIO_A11Y_SCRIPT` yet
 */
export const ACCESSIBILITY_API_MISSING = '__wdio_a11y_missing__'

/**
 * Find elements by ARIA role and accessible name, for sessions where the
 * WebDriver BiDi accessibility locator is not available. Role, accessible
 * name and whether an element is in the accessibility tree come from
 * `dom-accessibility-api`, which `WDIO_A11Y_SCRIPT` puts on the page.
 * Open shadow roots are searched.
 *
 * Runs in the browser: it must not reference anything outside its body.
 *
 * @param role  role to match
 * @param name  full accessible name to match, `null` to match any name
 * @param at    `null` returns the number of matches, a number returns that
 *              match (or `null`), `-1` returns every match
 * @param root  element to search within, `null` for the document
 */
/* c8 ignore start: runs in the browser */
export default function findByRole (
    role: string,
    name: string | null,
    at: number | null,
    root: Element | null
): number | Element | Element[] | null | string {
    const a11y = (window as unknown as { __wdioA11y?: AccessibilityApi }).__wdioA11y
    if (!a11y) {
        return '__wdio_a11y_missing__'
    }

    /**
     * ARIA 1.3 renamed `img` to `image`, browsers report `image`
     */
    const normalize = (value: string | null) => value === 'img' ? 'image' : value
    const wanted = normalize(role)

    /**
     * `isInaccessible` stops at a shadow root, continue at its host
     */
    const inAccessibilityTree = (el: Element) => {
        let current: Element | null = el
        while (current) {
            if (a11y.isInaccessible(current)) {
                return false
            }
            const rootNode = current.getRootNode() as ShadowRoot
            current = rootNode.host ?? null
        }
        return true
    }

    /**
     * HTML-AAM names a text field without a label by its `placeholder`, as
     * browsers and the BiDi accessibility locator do. `dom-accessibility-api`
     * leaves that step out.
     */
    const nameOf = (el: Element) => {
        const computed = a11y.computeAccessibleName(el)
        if (computed || !(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
            return computed
        }
        return (el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim()
    }

    const matches: Element[] = []
    const visit = (scope: Document | ShadowRoot | Element) => {
        for (const el of scope.querySelectorAll('*')) {
            if (normalize(a11y.getRole(el)) === wanted && inAccessibilityTree(el) && (name === null || nameOf(el) === name)) {
                matches.push(el)
            }
            if (el.shadowRoot) {
                visit(el.shadowRoot)
            }
        }
    }
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

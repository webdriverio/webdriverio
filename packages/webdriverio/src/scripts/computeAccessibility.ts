/**
 * In-page script for Tier 3 accessibility element lookup.
 * This script runs inside the browser to find elements by computed accessible name/role.
 *
 * Uses candidate generation + verification pattern to avoid O(N) full DOM scans.
 */

interface AccessibilityLookupOptions {
    strict: boolean
    candidateCap: number
    includeHidden: boolean
    scopeElement?: HTMLElement | null
}

interface AccessibilityLookupResult {
    elements: HTMLElement[]
    descriptors: string[]
    capHit: boolean
}

/**
 * Compute accessible name for an element (simplified implementation)
 * Based on W3C AccName specification: https://www.w3.org/TR/accname-1.1/
 */
function computeAccessibleName(el: HTMLElement): string {
    // Step 1: aria-labelledby
    const labelledBy = el.getAttribute('aria-labelledby')
    if (labelledBy) {
        const names = labelledBy.split(/\s+/).map(id => {
            const labelEl = document.getElementById(id)
            return labelEl ? labelEl.textContent?.trim() || '' : ''
        }).filter(Boolean)
        if (names.length) {return names.join(' ')}
    }

    // Step 2: aria-label
    const ariaLabel = el.getAttribute('aria-label')
    if (ariaLabel) {return ariaLabel.trim()}

    // Step 3: Native labeling mechanisms
    const tagName = el.tagName.toLowerCase()

    // For inputs, check associated label
    if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
        const input = el as HTMLInputElement
        // Check for label[for]
        if (input.id) {
            const label = document.querySelector(`label[for="${CSS.escape(input.id)}"]`)
            if (label) {return label.textContent?.trim() || ''}
        }
        // Check for ancestor label
        const ancestorLabel = el.closest('label')
        if (ancestorLabel) {
            // Get text content excluding the input itself
            const clone = ancestorLabel.cloneNode(true) as HTMLElement
            const inputs = clone.querySelectorAll('input, textarea, select')
            inputs.forEach(i => i.remove())
            return clone.textContent?.trim() || ''
        }
        // Placeholder
        const placeholder = el.getAttribute('placeholder')
        if (placeholder) {return placeholder.trim()}
    }

    // For images, check alt
    if (tagName === 'img') {
        const alt = el.getAttribute('alt')
        if (alt) {return alt.trim()}
    }

    // For buttons and links, use text content
    if (tagName === 'button' || tagName === 'a') {
        return el.textContent?.trim() || ''
    }

    // Title attribute (fallback for many elements)
    const title = el.getAttribute('title')
    if (title) {return title.trim()}

    // Text content (for generic elements like div, span with role)
    return el.textContent?.trim() || ''
}

/**
 * Compute accessible role for an element
 */
function computeAccessibleRole(el: HTMLElement): string {
    // Explicit role
    const explicitRole = el.getAttribute('role')
    if (explicitRole) {return explicitRole.toLowerCase()}

    // Implicit roles based on tag
    const tagName = el.tagName.toLowerCase()
    const implicitRoles: Record<string, string | ((el: HTMLElement) => string)> = {
        'a': (e) => e.hasAttribute('href') ? 'link' : 'generic',
        'article': 'article',
        'aside': 'complementary',
        'button': 'button',
        'datalist': 'listbox',
        'details': 'group',
        'dialog': 'dialog',
        'footer': 'contentinfo',
        'form': 'form',
        'h1': 'heading',
        'h2': 'heading',
        'h3': 'heading',
        'h4': 'heading',
        'h5': 'heading',
        'h6': 'heading',
        'header': 'banner',
        'hr': 'separator',
        'img': (e) => e.getAttribute('alt') === '' ? 'presentation' : 'img',
        'input': (e) => {
            const type = (e as HTMLInputElement).type?.toLowerCase()
            const typeRoles: Record<string, string> = {
                'button': 'button',
                'checkbox': 'checkbox',
                'email': 'textbox',
                'image': 'button',
                'number': 'spinbutton',
                'radio': 'radio',
                'range': 'slider',
                'reset': 'button',
                'search': 'searchbox',
                'submit': 'button',
                'tel': 'textbox',
                'text': 'textbox',
                'url': 'textbox'
            }
            return typeRoles[type] || 'textbox'
        },
        'li': 'listitem',
        'main': 'main',
        'menu': 'menu',
        'nav': 'navigation',
        'ol': 'list',
        'option': 'option',
        'progress': 'progressbar',
        'section': 'region',
        'select': (e) => (e as HTMLSelectElement).multiple || (e as HTMLSelectElement).size > 1 ? 'listbox' : 'combobox',
        'summary': 'button',
        'table': 'table',
        'tbody': 'rowgroup',
        'td': 'cell',
        'textarea': 'textbox',
        'tfoot': 'rowgroup',
        'th': 'columnheader',
        'thead': 'rowgroup',
        'tr': 'row',
        'ul': 'list'
    }

    const roleOrFn = implicitRoles[tagName]
    if (typeof roleOrFn === 'function') {
        return roleOrFn(el)
    }
    return roleOrFn || 'generic'
}

/**
 * Check if element is hidden or inert
 */
function isHiddenOrInert(el: HTMLElement): boolean {
    // Check for hidden attribute
    if (el.hidden) {return true}

    // Check for aria-hidden on self or ancestors
    if (el.closest('[aria-hidden="true"]')) {return true}

    // Check for inert attribute
    if (el.closest('[inert]')) {return true}

    // Check computed style
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') {return true}

    return false
}

/**
 * Get element descriptor for error messages
 */
function getDescriptor(el: HTMLElement): string {
    let descriptor = el.tagName.toLowerCase()
    if (el.id) {descriptor += `#${el.id}`}
    if (el.className && typeof el.className === 'string') {
        const classes = el.className.split(' ').filter(Boolean).slice(0, 2)
        if (classes.length) {descriptor += `.${classes.join('.')}`}
    }
    return descriptor
}

/**
 * Generate candidates using fast DOM queries
 */
function generateCandidates(root: HTMLElement | Document, role?: string): HTMLElement[] {
    const candidates: HTMLElement[] = []

    // Selectors for common accessible elements
    const selectors = [
        '[role]',
        '[aria-label]',
        '[aria-labelledby]',
        'button',
        'a[href]',
        'input',
        'textarea',
        'select',
        'img[alt]',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        '[title]',
        'label'
    ]

    // If role is specified, prioritize elements with that role
    if (role) {
        selectors.unshift(`[role="${CSS.escape(role)}"]`)
    }

    // Use a Set to avoid duplicates
    const seen = new Set<HTMLElement>()

    for (const selector of selectors) {
        try {
            const elements = root.querySelectorAll(selector)
            Array.from(elements).forEach(el => {
                if (el instanceof HTMLElement && !seen.has(el)) {
                    seen.add(el)
                    candidates.push(el)
                }
            })
        } catch {
            // Skip invalid selectors
        }
    }

    return candidates
}

/**
 * Traverse shadow DOM recursively
 */
function traverseShadowDOM(
    root: HTMLElement | Document | ShadowRoot,
    role: string | undefined,
    options: AccessibilityLookupOptions,
    results: { elements: HTMLElement[]; descriptors: string[] },
    targetName: string,
    candidateCount: { count: number }
): boolean {
    const candidates = generateCandidates(root as HTMLElement | Document, role)

    for (const el of candidates) {
        if (candidateCount.count >= options.candidateCap) {
            return true // Cap hit
        }
        candidateCount.count++

        // Skip hidden elements unless includeHidden is true
        if (!options.includeHidden && isHiddenOrInert(el)) {
            continue
        }

        // Check role match
        if (role) {
            const computedRole = computeAccessibleRole(el)
            if (computedRole !== role) {continue}
        }

        // Check name match (case-insensitive, normalized whitespace)
        const computedName = computeAccessibleName(el).toLowerCase().replace(/\s+/g, ' ').trim()
        const targetNameNormalized = targetName.toLowerCase().replace(/\s+/g, ' ').trim()

        if (computedName === targetNameNormalized) {
            results.elements.push(el)
            results.descriptors.push(getDescriptor(el))

            // Early exit for strict mode
            if (options.strict && results.elements.length > 1) {
                return false
            }
        }

        // Traverse shadow root if present
        if (el.shadowRoot) {
            const capHit = traverseShadowDOM(
                el.shadowRoot,
                role,
                options,
                results,
                targetName,
                candidateCount
            )
            if (capHit) {return true}
        }
    }

    return false
}

/**
 * Main lookup function
 */
export default function computeAccessibilityLookup(
    name: string,
    role: string | null,
    options: AccessibilityLookupOptions
): AccessibilityLookupResult {
    const results: AccessibilityLookupResult = {
        elements: [],
        descriptors: [],
        capHit: false
    }

    const root = options.scopeElement || document
    const candidateCount = { count: 0 }

    results.capHit = traverseShadowDOM(
        root,
        role || undefined,
        options,
        results,
        name,
        candidateCount
    )

    return results
}

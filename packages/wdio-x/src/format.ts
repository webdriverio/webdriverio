export interface BrowserElementFormatInput {
    tagName: string
    type?: string
    textContent?: string
    placeholder?: string
    href?: string
    ariaLabel?: string
    name?: string
    role?: string
    cssSelector: string
}

export interface MobileElementFormatInput {
    tagName: string
    text?: string
    selector: string
    accessibilityId?: string
    resourceId?: string
}

export interface A11yNodeFormatInput {
    role: string
    name: string
    level?: string | number
    value?: string
    disabled?: string
    required?: string
    checked?: string
    expanded?: string
}

export interface SessionListEntry {
    name: string
    browser: string
    url: string
    status: string
}

const DEFAULT_TRUNCATE_MAX = 128

function truncate(str: string, max: number = DEFAULT_TRUNCATE_MAX): string {
    if (str.length <= max) {
        return str
    }
    return str.slice(0, max - 3) + '...'
}

/**
 * Format a browser element for human-readable stdout output.
 *
 * Layout: ref (4-char padded) | tag (with type suffix) | description | css selector
 * Description priority: textContent > placeholder > ariaLabel > name > href
 */
export function formatBrowserElement(ref: string, el: BrowserElementFormatInput): string {
    const paddedRef = ref.padEnd(4)

    // Build tag with optional type suffix like input[email]
    let tag = el.tagName
    if (el.type) {
        tag += `[${el.type}]`
    }

    // Build description based on priority
    let description = ''
    if (el.textContent) {
        description = `"${truncate(el.textContent)}"`
    } else if (el.placeholder) {
        description = `"${truncate(el.placeholder)}"`
    } else if (el.ariaLabel) {
        description = `"${truncate(el.ariaLabel)}"`
    } else if (el.name) {
        description = `"${truncate(el.name)}"`
    } else if (el.href) {
        description = `-> ${truncate(el.href)}`
    }

    // If description was set from a non-href field but href also exists, append href
    let hrefSuffix = ''
    if (el.href && !el.textContent && description && !description.startsWith('->')) {
        hrefSuffix = ` -> ${truncate(el.href)}`
    }

    const parts = [paddedRef, tag]
    if (description) {
        parts.push(description + hrefSuffix)
    }
    parts.push(el.cssSelector)

    return parts.join('  ')
}

/**
 * Format a mobile element for human-readable stdout output.
 *
 * Layout: ref (4-char padded) | tag (28-char padded) | text | selector strategy
 */
export function formatMobileElement(ref: string, el: MobileElementFormatInput): string {
    const paddedRef = ref.padEnd(4)
    const paddedTag = el.tagName.padEnd(28)

    let description = ''
    if (el.text) {
        description = `"${truncate(el.text)}"`
    }

    // Build selector strategy display
    let selectorDisplay: string
    if (el.accessibilityId) {
        selectorDisplay = `[accessibility-id: ${el.accessibilityId}]`
    } else if (el.resourceId) {
        selectorDisplay = `[resource-id: ${el.resourceId}]`
    } else {
        selectorDisplay = el.selector
    }

    const parts = [paddedRef, paddedTag]
    if (description) {
        parts.push(description)
    }
    parts.push(selectorDisplay)

    return parts.join('  ')
}

/**
 * Format an accessibility tree node for human-readable stdout output.
 *
 * Layout: ref (4-char padded) | role (with level suffix) | name in quotes | states
 */
export function formatAccessibilityNode(ref: string, node: A11yNodeFormatInput): string {
    const paddedRef = ref.padEnd(4)

    // Build role with optional level suffix like heading[1]
    let role = node.role
    if (node.level !== undefined && node.level !== '') {
        role += `[${node.level}]`
    }

    const quotedName = `"${truncate(node.name)}"`

    // Collect active states
    const states: string[] = []
    if (node.required === 'true') {
        states.push('required')
    }
    if (node.disabled === 'true') {
        states.push('disabled')
    }
    if (node.checked === 'true') {
        states.push('checked')
    }
    if (node.expanded === 'true') {
        states.push('expanded')
    }

    const parts = [paddedRef, role, quotedName]
    if (states.length > 0) {
        parts.push(`(${states.join(', ')})`)
    }

    return parts.join('  ')
}

/**
 * Format a list of sessions as a padded table.
 *
 * Returns "No active sessions." if entries is empty.
 */
export function formatSessionList(entries: SessionListEntry[]): string {
    if (entries.length === 0) {
        return 'No active sessions.'
    }

    // Calculate column widths (minimum = header length)
    const headers = { name: 'NAME', browser: 'BROWSER', url: 'URL', status: 'STATUS' }
    const nameWidth = Math.max(headers.name.length, ...entries.map((e) => e.name.length))
    const browserWidth = Math.max(headers.browser.length, ...entries.map((e) => e.browser.length))
    const urlWidth = Math.max(headers.url.length, ...entries.map((e) => e.url.length))
    const statusWidth = Math.max(headers.status.length, ...entries.map((e) => e.status.length))

    const gap = '  '

    const formatRow = (name: string, browser: string, url: string, status: string) =>
        name.padEnd(nameWidth) + gap +
        browser.padEnd(browserWidth) + gap +
        url.padEnd(urlWidth) + gap +
        status.padEnd(statusWidth)

    const lines = [
        formatRow(headers.name, headers.browser, headers.url, headers.status),
        ...entries.map((e) => formatRow(e.name, e.browser, e.url, e.status)),
    ]

    return lines.join('\n')
}

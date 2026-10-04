export interface SnapshotNode {
    role: string
    name?: string
    ref?: string
    value?: string
    states?: string[]
    url?: string
    box?: number[]
    /**
     * `cross-origin` for iframes whose content cannot be read, `cut` for
     * a frame shown inline that has more than fits
     */
    note?: string
    /**
     * what an unnamed clickable element looks like and where it is, e.g.
     * `icon 3 of 3 in "Invoice #1002"`; printed, never used in selectors
     */
    hint?: string
    hidden?: boolean
    interactive?: boolean
    children?: SnapshotNode[]
}

export interface SnapshotRef {
    id: string
    role: string
    name?: string
    candidates: string[]
}

export interface FormatOptions {
    depth?: number
    interactive?: boolean
    boxes?: boolean
    /**
     * Drop unnamed structural nodes that have nothing left under them.
     */
    compact?: boolean
}

const LANDMARKS = new Set(['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'region', 'form', 'search', 'dialog', 'alertdialog', 'iframe'])

function count (node: SnapshotNode): number {
    return (node.children || []).reduce((sum, c) => sum + 1 + count(c), 0)
}

/**
 * Keep interactive nodes and the landmarks around them.
 */
export function onlyInteractive (node: SnapshotNode): SnapshotNode[] {
    const children = (node.children || []).flatMap(onlyInteractive)
    if (node.interactive || node.role === 'document' || (LANDMARKS.has(node.role) && (children.length || node.ref))) {
        return [{ ...node, children }]
    }
    return children
}

/**
 * Drop nodes that carry no name, ref, value, state, url, note or
 * interactivity and have no children left after the same filter. Document
 * roots and wrappers that still contain something are kept.
 */
export function compactTree (node: SnapshotNode): SnapshotNode | undefined {
    const children = (node.children || []).flatMap((child) => {
        const kept = compactTree(child)
        return kept ? [kept] : []
    })
    const keep = node.role === 'document'
        || Boolean(node.name)
        || Boolean(node.ref)
        || node.value !== undefined
        || Boolean(node.states?.length)
        || Boolean(node.url)
        || Boolean(node.note)
        || Boolean(node.hint)
        || Boolean(node.interactive)
        || children.length > 0
    if (!keep) {
        return undefined
    }
    const next: SnapshotNode = { ...node }
    if (children.length) {
        next.children = children
    } else {
        delete next.children
    }
    return next
}

export function formatLine (node: SnapshotNode, opts: FormatOptions = {}, truncated = 0) {
    const parts = [`- ${node.role}`]
    if (node.name) {
        parts.push(JSON.stringify(node.name))
    }
    if (node.ref) {
        parts.push(`[ref=${node.ref}]`)
    }
    if (node.hint) {
        parts.push(`(${node.hint})`)
    }
    if (node.value !== undefined) {
        parts.push(`value=${JSON.stringify(node.value)}`)
    }
    for (const state of node.states || []) {
        parts.push(`[${state}]`)
    }
    if (node.hidden) {
        parts.push('[hidden]')
    }
    if (opts.boxes && node.box) {
        parts.push(`[box=${node.box.join(',')}]`)
    }
    if (truncated) {
        parts.push(`[+${truncated}]`)
    }
    if (node.url) {
        parts.push(`url=${node.url}`)
    }
    if (node.note === 'cut') {
        parts.push(node.ref ? `(frame cut short: \`wdio session frame ${node.ref}\` and \`snapshot\` show all of it)` : '(frame cut short)')
    }
    if (node.note === 'cross-origin') {
        parts.push(node.ref ? `(cross-origin: run \`wdio session frame ${node.ref}\`)` : '(cross-origin)')
    }
    return parts.join(' ')
}

/**
 * Render a snapshot tree as YAML-like text, two spaces per level (RFC §8.1).
 */
export function formatSnapshot (tree: SnapshotNode, opts: FormatOptions = {}) {
    const filtered = opts.interactive ? onlyInteractive(tree)[0] : tree
    const root = opts.compact ? (compactTree(filtered) || filtered) : filtered
    const lines: string[] = []
    const visit = (node: SnapshotNode, depth: number) => {
        const cut = opts.depth !== undefined && depth >= opts.depth && node.children?.length
        lines.push('  '.repeat(depth) + formatLine(node, opts, cut ? count(node) : 0))
        if (!cut) {
            for (const child of node.children || []) {
                visit(child, depth + 1)
            }
        }
    }
    visit(root, 0)
    return lines.join('\n')
}

export function countRefs (text: string) {
    return (text.match(/\[ref=e\d+\]/g) || []).length
}

export interface SnapshotNode {
    role: string
    name?: string
    ref?: string
    value?: string
    states?: string[]
    url?: string
    box?: number[]
    /**
     * `cross-origin` for iframes whose content cannot be read
     */
    note?: string
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

export function formatLine (node: SnapshotNode, opts: FormatOptions = {}, truncated = 0) {
    const parts = [`- ${node.role}`]
    if (node.name) {
        parts.push(JSON.stringify(node.name))
    }
    if (node.ref) {
        parts.push(`[ref=${node.ref}]`)
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
    if (node.note === 'cross-origin') {
        parts.push(node.ref ? `(cross-origin: run \`wdio session frame ${node.ref}\`)` : '(cross-origin)')
    }
    return parts.join(' ')
}

/**
 * Render a snapshot tree as YAML-like text, two spaces per level (RFC §8.1).
 */
export function formatSnapshot (tree: SnapshotNode, opts: FormatOptions = {}) {
    const root = opts.interactive ? onlyInteractive(tree)[0] : tree
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

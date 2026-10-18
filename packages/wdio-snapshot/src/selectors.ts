import type { CandidateKind, SnapshotCandidate, SnapshotNode, SnapshotRef } from './format.js'

export interface SelectorNode {
    platform: 'android' | 'ios' | 'mac' | 'windows'
    tag: string
    name?: string
    text?: string
    resourceId?: string
    accessibilityId?: string
    className?: string
}

export function xpathLiteral (value: string) {
    if (!value.includes('"')) {
        return `"${value}"`
    }
    if (!value.includes("'")) {
        return `'${value}'`
    }
    return `concat("${value.replace(/"/g, '", \'"\', "')}")`
}

/**
 * Native stable-selector candidates, best first (RFC §8.5).
 */
export function nativeCandidates (node: SelectorNode): SnapshotCandidate[] {
    const out: SnapshotCandidate[] = []
    if (node.accessibilityId) {
        out.push({ kind: 'accessibility-id', selector: `~${node.accessibilityId}` })
    }
    if (node.platform === 'android' && node.resourceId) {
        out.push({ kind: 'resource-id', selector: `id=${node.resourceId}` })
    }
    if ((node.platform === 'ios' || node.platform === 'mac') && node.name) {
        out.push({ kind: 'predicate', selector: `-ios predicate string:name == ${JSON.stringify(node.name)}` })
        out.push({ kind: 'class-chain', selector: `-ios class chain:**/${node.tag}[\`name == ${JSON.stringify(node.name)}\`]` })
    }
    if (node.platform === 'android' && node.text) {
        const klass = node.className || node.tag
        out.push({ kind: 'uiautomator', selector: `android=new UiSelector().text(${JSON.stringify(node.text)})` })
        out.push({ kind: 'xpath', selector: `//${klass}[@text=${xpathLiteral(node.text)}]` })
    }
    if (node.platform === 'windows' && node.name) {
        out.push({ kind: 'xpath', selector: `//${node.tag}[@Name=${xpathLiteral(node.name)}]` })
    }
    if (node.accessibilityId && node.platform === 'android') {
        const klass = node.className || node.tag
        out.push({ kind: 'xpath', selector: `//${klass}[@content-desc=${xpathLiteral(node.accessibilityId)}]` })
    }
    if (!out.length) {
        out.push({ kind: 'tag', selector: `//${node.tag}` })
    }
    return out
}

/** candidate kinds that point at a place in the tree, not at the element */
const POSITIONAL_KINDS = new Set<CandidateKind>(['css-path', 'tag', 'indexed'])

/**
 * Set `selector` on the nodes that have a ref, to the ref's best candidate.
 * Every candidate but the last-resort positional ones (the web `cssPath`, the
 * native bare tag and indexed selector) was verified unique when the snapshot
 * was taken; a node that fell back to one of those is marked `selectorPositional`.
 */
export function attachSelectors (tree: SnapshotNode, refs: Pick<SnapshotRef, 'id' | 'candidates'>[]) {
    const candidates = new Map(refs.map((ref) => [ref.id, ref.candidates]))
    const visit = (node: SnapshotNode) => {
        const [first] = (node.ref && candidates.get(node.ref)) || []
        if (first) {
            node.selector = first.selector
            if (POSITIONAL_KINDS.has(first.kind)) {
                node.selectorPositional = true
            }
        }
        node.children?.forEach(visit)
    }
    visit(tree)
}

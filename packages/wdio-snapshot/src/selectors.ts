import type { CandidateKind, SnapshotNode, SnapshotRef } from './format.js'

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

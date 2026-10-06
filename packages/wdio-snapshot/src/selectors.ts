import type { SnapshotNode, SnapshotRef } from './format.js'

export interface SelectorNode {
    platform: 'android' | 'ios' | 'mac' | 'windows'
    tag: string
    name?: string
    text?: string
    resourceId?: string
    accessibilityId?: string
    className?: string
}

function xpathLiteral (value: string) {
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
export function nativeCandidates (node: SelectorNode): string[] {
    const out: string[] = []
    if (node.accessibilityId) {
        out.push(`~${node.accessibilityId}`)
    }
    if (node.platform === 'android' && node.resourceId) {
        out.push(`id=${node.resourceId}`)
    }
    if ((node.platform === 'ios' || node.platform === 'mac') && node.name) {
        out.push(`-ios predicate string:name == ${JSON.stringify(node.name)}`)
        out.push(`-ios class chain:**/${node.tag}[\`name == ${JSON.stringify(node.name)}\`]`)
    }
    if (node.platform === 'android' && node.text) {
        const klass = node.className || node.tag
        out.push(`android=new UiSelector().text(${JSON.stringify(node.text)})`)
        out.push(`//${klass}[@text=${xpathLiteral(node.text)}]`)
    }
    if (node.platform === 'windows' && node.name) {
        out.push(`//${node.tag}[@Name=${xpathLiteral(node.name)}]`)
    }
    if (node.accessibilityId && node.platform === 'android') {
        const klass = node.className || node.tag
        out.push(`//${klass}[@content-desc=${xpathLiteral(node.accessibilityId)}]`)
    }
    if (!out.length) {
        out.push(`//${node.tag}`)
    }
    return out
}

/**
 * Set `selector` on the nodes that have a ref, to the ref's best candidate.
 * A web element whose only candidate is the positional `cssPath` and a native
 * element that only got `//<tag>` are marked unverified.
 */
export function attachSelectors (tree: SnapshotNode, refs: Pick<SnapshotRef, 'id' | 'candidates'>[], kind: 'web' | 'native') {
    const candidates = new Map(refs.map((ref) => [ref.id, ref.candidates]))
    const visit = (node: SnapshotNode) => {
        const [first, ...rest] = (node.ref && candidates.get(node.ref)) || []
        if (first) {
            node.selector = first
            if (!rest.length && (kind === 'web' || /^\/\/[\w.$-]+$/.test(first))) {
                node.selectorUnverified = true
            }
        }
        node.children?.forEach(visit)
    }
    visit(tree)
}

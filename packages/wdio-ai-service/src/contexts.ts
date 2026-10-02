interface ContextNode {
    context: string
    children?: ContextNode[] | null
}

/**
 * A top-level browsing context and every frame in it. Events of other tabs
 * and windows are not part of what a step on this page did.
 */
export async function contextTree (browser: WebdriverIO.Browser, root?: string): Promise<Set<string>> {
    const ids = new Set<string>()
    if (!root) {
        return ids
    }
    ids.add(root)
    const { contexts } = await browser.browsingContextGetTree({ root })
        .catch(() => ({ contexts: [] as ContextNode[] })) as { contexts: ContextNode[] }
    const walk = (nodes: ContextNode[]) => {
        for (const node of nodes) {
            ids.add(node.context)
            walk(node.children || [])
        }
    }
    walk(contexts)
    return ids
}

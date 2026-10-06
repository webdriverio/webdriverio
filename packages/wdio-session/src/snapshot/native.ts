import { nativePlatform, parseNativeSource, scopeNativeTree, type SnapshotNode } from '@wdio/snapshot'

import type { SnapshotOptions, TakenSnapshot } from '../actions/observe.js'
import { asUsage } from '../errors.js'
import type { Session } from '../session.js'
import { renderSnapshot } from './render.js'

/**
 * Snapshot an Appium page source (RFC §8.3).
 */
export async function takeNativeSnapshot (session: Session, opts: SnapshotOptions = {}): Promise<TakenSnapshot> {
    const xml = await session.browser.getPageSource()
    const platform = nativePlatform(session.browser.capabilities as Record<string, unknown>, session.plan.target)
    const parsed = parseNativeSource(xml, platform, { all: opts.all, counter: session.refs.counter })
    const remap = new Map<string, string>()
    const entries = parsed.refs.map((ref) => ({ ...ref, candidates: ref.candidates.map((candidate) => candidate.selector) }))
    const identity = (candidates: string[]) => candidates.join('\n')
    for (const ref of entries) {
        const key = identity(ref.candidates)
        const previous = session.refs.all().find((entry) => entry.kind === 'native' && identity(entry.candidates) === key)
        if (previous && previous.id !== ref.id) {
            remap.set(ref.id, previous.id)
        }
    }
    const apply = (node: SnapshotNode) => {
        if (node.ref && remap.has(node.ref)) {
            node.ref = remap.get(node.ref)
        }
        node.children?.forEach(apply)
    }
    apply(parsed.tree)
    const refs = parsed.refs.map((ref) => ({ ...ref, id: remap.get(ref.id) || ref.id }))
    const entryRefs = entries.map((ref) => ({ ...ref, id: remap.get(ref.id) || ref.id }))
    if (opts.scope) {
        parsed.tree = asUsage(() => scopeNativeTree(parsed.tree, parsed.located, String(opts.scope)))
    }
    session.refs.counter = parsed.counter
    session.refs.generation++
    for (const ref of entryRefs) {
        session.refs.set({ ...ref, kind: 'native', generation: session.refs.generation })
    }
    const text = await renderSnapshot(session, parsed.tree, refs, opts, true)
    return { text, tree: parsed.tree }
}

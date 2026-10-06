import { attachSelectors, formatSnapshot, inViewport, type SnapshotNode, type SnapshotRef } from '@wdio/snapshot'

import type { SnapshotOptions } from '../actions/observe.js'
import type { Session } from '../session.js'
import { scopeOf } from './target.js'

export async function viewportSize (session: Session, native: boolean): Promise<[number, number]> {
    if (native) {
        const { width, height } = await session.browser.getWindowSize()
        return [width, height]
    }
    return await scopeOf(session).execute(() => [window.innerWidth, window.innerHeight]) as [number, number]
}

/**
 * The snapshot text for the options asked, remembered as `lastSnapshot`, which
 * `diff` compares against.
 */
export async function renderSnapshot (session: Session, tree: SnapshotNode, refs: Pick<SnapshotRef, 'id' | 'candidates'>[], opts: SnapshotOptions, native: boolean) {
    if (opts.selectors) {
        attachSelectors(tree, refs, native ? 'native' : 'web')
    }
    const view = opts.viewport ? inViewport(tree, ...await viewportSize(session, native)) ?? tree : tree
    const format = { depth: opts.depth, interactive: opts.interactive, boxes: opts.boxes, compact: opts.compact, selectors: opts.selectors }
    const text = formatSnapshot(view, format)
    session.lastSnapshot = text
    return text
}

import { attachSelectors, formatSnapshot as formatTree, inViewport, type FormatOptions, type SnapshotNode, type SnapshotRef } from '@wdio/snapshot'

import type { SnapshotOptions } from '../actions/observe.js'
import type { Session } from '../session.js'

/**
 * `@wdio/snapshot`'s formatter with the session's own `frame` command in the
 * notes of cut and cross-origin iframes.
 */
export const formatSnapshot = (tree: SnapshotNode, opts: FormatOptions = {}) => formatTree(tree, { frameHint: (ref) => `wdio session frame ${ref}`, ...opts })

async function viewportSize (session: Session): Promise<[number, number]> {
    const { width, height } = await session.browser.getWindowSize()
    return [width, height]
}

/**
 * The snapshot text for the options asked. `lastSnapshot`, which `diff`
 * compares against, is the canonical text of the whole tree (`--interactive`
 * applies, as in `diff`): selectors, viewport, boxes, depth and compact change
 * what is printed, not what the page is.
 *
 * A web `--viewport` tree is cut in the page, so it is not the whole tree and
 * leaves `lastSnapshot` as it was. A second, unfiltered collect would cost
 * what the in-page filter saves. Native is cut here and still has the whole tree.
 */
export async function renderSnapshot (session: Session, tree: SnapshotNode, refs: Pick<SnapshotRef, 'id' | 'candidates'>[], opts: SnapshotOptions, native: boolean) {
    if (opts.selectors) {
        attachSelectors(tree, refs)
    }
    if (native || !opts.viewport) {
        session.lastSnapshot = formatSnapshot(tree, { frameHint: session.frameHint, interactive: opts.interactive })
    }
    const view = native && opts.viewport ? inViewport(tree, ...await viewportSize(session)) ?? tree : tree
    const format = { frameHint: session.frameHint, depth: opts.depth, interactive: opts.interactive, boxes: opts.boxes, compact: opts.compact, selectors: opts.selectors }
    return formatSnapshot(view, format)
}

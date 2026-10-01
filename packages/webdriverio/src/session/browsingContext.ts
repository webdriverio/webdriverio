import { getBrowserObject } from '@wdio/utils'

import { getContextManager } from './context.js'

/**
 * A browsing context is a value you hold. It has a context id and a pointer
 * back to the session. An element found in one keeps that object as `parent`.
 */
export function isBrowsingContext (value: unknown): value is WebdriverIO.BrowsingContext {
    const context = value as WebdriverIO.BrowsingContext
    return Boolean(
        context &&
        typeof context === 'object' &&
        typeof context.contextId === 'string' &&
        context.browser
    )
}

/**
 * The id BiDi commands should target. A held context wins over the session
 * pointer, including when the caller is an element found in that context.
 * The session pointer is only the fallback for `browser.*`.
 */
export async function contextIdOf (
    scope: WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.BrowsingContext | WebdriverIO.MultiRemoteBrowser
): Promise<string> {
    let current: unknown = scope
    const seen = new Set<unknown>()
    while (current && typeof current === 'object' && !seen.has(current)) {
        seen.add(current)
        if (isBrowsingContext(current)) {
            return current.contextId
        }
        const parent = (current as WebdriverIO.Element).parent
        if (!parent || parent === current) {
            break
        }
        current = parent
    }

    const browser = getBrowserObject(scope as WebdriverIO.Element)
    return getContextManager(browser).getCurrentContext()
}

/**
 * `getCurrentContext()` is a string in a real session. Unit tests sometimes
 * stub it as `{ context }`. Either way the id we store on the object is a string.
 */
export function contextIdValue (value: unknown): string {
    if (typeof value === 'string' && value) {
        return value
    }
    if (value && typeof value === 'object' && typeof (value as { context?: unknown }).context === 'string') {
        return (value as { context: string }).context
    }
    throw new Error('A browsing context id is required')
}

/**
 * The browsing context this value belongs to, when it is one or was found in one.
 * `browser.$()` elements have the browser as `parent` and return undefined.
 */
export function heldBrowsingContext (scope: unknown): WebdriverIO.BrowsingContext | undefined {
    let current: unknown = scope
    const seen = new Set<unknown>()
    while (current && typeof current === 'object' && !seen.has(current)) {
        seen.add(current)
        if (isBrowsingContext(current)) {
            return current
        }
        const parent = (current as WebdriverIO.Element).parent
        if (!parent || parent === current) {
            break
        }
        current = parent
    }
    return undefined
}

/**
 * Context id to use when the caller lives in a different navigable than the
 * session pointer. Classic element commands only see the pointer's document.
 */
export async function foreignContextId (
    scope: WebdriverIO.Browser | WebdriverIO.Element | WebdriverIO.BrowsingContext
): Promise<string | undefined> {
    const held = heldBrowsingContext(scope)
    if (!held) {
        return undefined
    }
    const current = contextIdValue(await getContextManager(held.browser).getCurrentContext())
    return held.contextId === current ? undefined : held.contextId
}

export function assertTopLevel (context: WebdriverIO.BrowsingContext, command: string) {
    if (context.isFrame) {
        throw new Error(`\`${command}\` is only available on a top-level browsing context`)
    }
}

interface TreeNode {
    context: string
    children?: TreeNode[] | null
}

function containsContext (nodes: TreeNode[], contextId: string): boolean {
    return nodes.some((node) => node.context === contextId || containsContext(node.children ?? [], contextId))
}

/**
 * A frame belongs to one document of its parent. When that page navigates
 * away, the frame is gone. Firefox can keep the old document (and its
 * frames) in the back/forward cache, where scripts never settle, so check
 * that the frame is still in its top-level context's tree before using it.
 */
export async function assertFrameAttached (frame: WebdriverIO.BrowsingContext) {
    let top = frame
    while (top.parent) {
        top = top.parent
    }
    const { contexts } = await frame.browser.browsingContextGetTree({ root: top.contextId })
    if (!containsContext(contexts as TreeNode[], frame.contextId)) {
        throw new Error(`no such frame: the frame "${frame.contextId}" was discarded because the page it belongs to navigated away`)
    }
}

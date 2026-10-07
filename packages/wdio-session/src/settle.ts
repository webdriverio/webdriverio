import { getContextManager } from 'webdriverio'

import { scopeOf } from './snapshot/target.js'
import type { Session } from './session.js'

/**
 * A client-rendered page is `complete` long before it has content: a first
 * snapshot right after a navigation sees an empty shell. The wait ends once
 * the document is complete, has a control to act on, and the DOM has been
 * quiet this long.
 */
export const QUIET_MS = 300
/** the wait never costs more than this, however busy the page stays */
export const SETTLE_MAX_MS = 2000

export interface QuietOptions {
    quietMs: number
    maxMs: number
    requireComplete: boolean
    attributes: string[]
}

/**
 * Resolves once the DOM has been quiet for `quietMs`, or after `maxMs`.
 * Throws when a navigation replaces the document mid-wait.
 */
export async function waitQuiet (scope: WebdriverIO.Browser, { quietMs, maxMs, requireComplete, attributes }: QuietOptions) {
    await scope.execute(function (quiet: number, max: number, complete: boolean, attributeFilter: string[]) {
        return new Promise<void>((resolve) => {
            const finish = () => {
                observer.disconnect()
                document.removeEventListener('readystatechange', arm)
                clearTimeout(timer)
                clearTimeout(limit)
                resolve()
            }
            // a quiet shell with nothing to act on is still rendering: keep waiting for content or `max`
            const hasControls = () => document.querySelector('a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[contenteditable=true]') !== null
            const settled = () => {
                if (!complete || hasControls()) {
                    finish()
                }
            }
            const arm = () => {
                clearTimeout(timer)
                if (!complete || document.readyState === 'complete') {
                    timer = setTimeout(settled, quiet)
                }
            }
            let timer: ReturnType<typeof setTimeout> | undefined
            const limit = setTimeout(finish, max)
            const observer = new MutationObserver(arm)
            observer.observe(document, attributeFilter.length > 0
                ? { subtree: true, childList: true, characterData: true, attributeFilter }
                : { subtree: true, childList: true, characterData: true })
            if (complete) {
                document.addEventListener('readystatechange', arm)
            }
            arm()
        })
    }, quietMs, maxMs, requireComplete, attributes)
}

/**
 * `<context>|<url>|<timeOrigin>` of the document a snapshot reads: a held
 * frame is its own document, so the top-level URL says nothing about it, and
 * the time origin tells a reload of the same URL from the document already
 * settled.
 */
async function settleKey (session: Session) {
    const held = session.get?.<WebdriverIO.BrowsingContext>('activeContext')
    const identify = () => [location.href, performance.timeOrigin]
    if (held) {
        const id = await Promise.resolve(held.execute(identify)).catch(() => undefined)
        return Array.isArray(id) ? `${held.contextId}|${id[0]}|${id[1]}` : undefined
    }
    if (!session.isWeb) {
        return undefined
    }
    const context = session.isBidi
        ? await getContextManager(session.browser).getCurrentContext().catch(() => undefined)
        : undefined
    const id = await session.browser.execute(identify).catch(() => undefined)
    if (Array.isArray(id)) {
        return `${context ?? ''}|${id[0]}|${id[1]}`
    }
    const url = await session.currentUrl()
    return url === undefined ? undefined : `${context ?? ''}|${url}|`
}

/**
 * Wait for a page that may be fresh to settle, once per document: the next
 * snapshot of the same one skips it (`Session.settledKey`).
 */
export async function settleFreshPage (session: Session) {
    const key = await settleKey(session)
    if (key !== undefined && key === session.settledKey) {
        return
    }
    try {
        await waitQuiet(scopeOf(session), { quietMs: QUIET_MS, maxMs: SETTLE_MAX_MS, requireComplete: true, attributes: [] })
        session.settledKey = key
    } catch {
        // a navigation replaced the document; the snapshot goes on with the new one
    }
}

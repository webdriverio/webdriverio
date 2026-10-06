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
 * Wait for a page that may be fresh to settle, once per page: the next
 * snapshot of the same URL skips it (`Session.settledUrl`).
 */
export async function settleFreshPage (session: Session) {
    const url = await session.currentUrl()
    if (url !== undefined && url === session.settledUrl) {
        return
    }
    try {
        await waitQuiet(scopeOf(session), { quietMs: QUIET_MS, maxMs: SETTLE_MAX_MS, requireComplete: true, attributes: [] })
        session.settledUrl = url
    } catch {
        // a navigation replaced the document; the snapshot goes on with the new one
    }
}

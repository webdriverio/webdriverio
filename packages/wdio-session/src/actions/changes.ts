import { diffLines } from '@wdio/snapshot'

import { takeSnapshot } from './observe.js'
import { openDialog } from './contexts.js'
import { formatSnapshot } from '../snapshot/render.js'
import { scopeOf } from '../snapshot/target.js'
import type { Session } from '../session.js'

/**
 * Actions after which a web session reports what changed on the page.
 *
 * Without this, nearly every action is followed by a separate `snapshot -i`
 * call, and text that is not interactive (a confirmation code, an error
 * message, a new price) is not in `-i` at all, so an agent has to go
 * looking for it. One short summary in the action's own output saves both.
 */
export const OBSERVED_ACTIONS = new Set([
    'click', 'tap', 'fill', 'type', 'press', 'select', 'check', 'uncheck', 'hover',
    'navigate', 'back', 'forward', 'reload', 'frame', 'dialog', 'upload',
    // code that clicked or typed: what it did shows like it does for a click
    'exec'
])

/** changed lines printed after an action on the same page */
const MAX_CHANGED_LINES = 30
/**
 * After a navigation the new page's interactive snapshot is printed only up
 * to this size. A big page (Wikipedia has hundreds of links) would sit in an
 * agent's context for every later turn; for those a one-line summary points
 * to `find`, which costs far less than listing every link.
 */
const MAX_PAGE_CHARS = 1500

export interface PageState {
    url?: string
    text?: string
}

/**
 * A snapshot for the report only. It must not move the baseline of the
 * user-facing `diff` action, which is the last snapshot the user took.
 */
async function reportSnapshot (session: Session, isCurrent?: () => boolean) {
    const baseline = session.lastSnapshot
    const taken = await takeSnapshot(session, {}, isCurrent)
    session.lastSnapshot = baseline
    return taken
}

export async function pageState (session: Session): Promise<PageState> {
    try {
        return { url: await session.currentUrl(), text: (await reportSnapshot(session)).text }
    } catch {
        return {}
    }
}

/**
 * Summarise the page after an action, compared to `before`:
 * - another URL: the interactive snapshot of the new page,
 * - same URL: the lines that are new or changed, with their refs,
 * - nothing changed: nothing.
 */
/**
 * A dialog that an action opened blocks page scripts until it is handled,
 * and its "opened" event can arrive after the action returned. So the
 * report stops as soon as a dialog shows up. Its snapshot only answers once
 * the dialog is handled, by then other commands may have run: it is marked
 * as abandoned and drops its result instead of touching refs or `diff`.
 */
const DIALOG_POLL = 100

export async function describeChanges (session: Session, before: PageState, label = 'Page'): Promise<{ text?: string, after: PageState }> {
    let timer: NodeJS.Timeout | undefined
    let current = true
    const dialog = new Promise<{ after: PageState }>((resolve) => {
        const poll = () => openDialog(session) ? resolve({ after: {} }) : (timer = setTimeout(poll, DIALOG_POLL))
        timer = setTimeout(poll, DIALOG_POLL)
    })
    try {
        return await Promise.race([compare(session, before, label, () => current), dialog])
    } finally {
        current = false
        clearTimeout(timer)
    }
}

/**
 * An action's effect often lands after the action returns: a client-side
 * router swaps the page, a request fills in a result. The report waits until
 * the DOM has been quiet for a moment, so it shows the new state rather than
 * the old page, and the agent doesn't have to look again.
 */
const QUIET_MS = 100
const MAX_SETTLE_MS = 1000

async function settle (session: Session) {
    try {
        await scopeOf(session).execute(function (quiet: number, max: number) {
            return new Promise<void>((resolve) => {
                const finish = () => {
                    observer.disconnect()
                    clearTimeout(timer)
                    clearTimeout(limit)
                    resolve()
                }
                let timer = setTimeout(finish, quiet)
                const limit = setTimeout(finish, max)
                const observer = new MutationObserver(() => {
                    clearTimeout(timer)
                    timer = setTimeout(finish, quiet)
                })
                // no `style` or `class`: animations change those all the time
                observer.observe(document, {
                    subtree: true, childList: true, characterData: true,
                    attributeFilter: ['value', 'checked', 'disabled', 'hidden', 'open', 'aria-expanded', 'aria-checked', 'aria-selected', 'aria-hidden', 'aria-invalid']
                })
            })
        }, QUIET_MS, MAX_SETTLE_MS)
    } catch {
        // a navigation replaced the document; the snapshot waits for the new one
    }
}

async function compare (session: Session, before: PageState, label: string, isCurrent: () => boolean): Promise<{ text?: string, after: PageState }> {
    await settle(session)
    let after: PageState
    let tree
    try {
        const taken = await reportSnapshot(session, isCurrent)
        tree = taken.tree
        after = { url: await session.currentUrl(), text: taken.text }
    } catch {
        return { after: {} }
    }
    if (!after.text) {
        return { after }
    }
    if (before.url !== after.url || before.text === undefined) {
        const page = formatSnapshot(tree, { interactive: true })
        if (page.length <= MAX_PAGE_CHARS) {
            // a frame's own URL is on the document line; the session URL is the top page's
            return { after, text: `${label}:${label === 'Page' ? ` ${after.url ?? ''}` : ''}\n${page}` }
        }
        const refs = (page.match(/\[ref=/g) || []).length
        const title = page.split('\n')[0].match(/^- document "(.*?)"/)?.[1]
        return { after, text: `${label}: ${after.url ?? ''}${title ? ` · ${JSON.stringify(title)}` : ''} · ${refs} interactive elements. \`wdio session find <text>\` gets the ones you need with their refs; \`snapshot -i\` lists all.` }
    }
    if (before.text === after.text) {
        return { after }
    }
    // a line that only lost `[focused]` is not news: focus moves with every action
    const unfocused = new Set(before.text.split('\n').filter((line) => line.endsWith(' [focused]')).map((line) => line.slice(0, -' [focused]'.length)))
    const ops = diffLines(before.text.split('\n'), after.text.split('\n'))
    const added = ops.filter((op) => op.kind === '+' && !unfocused.has(op.line)).map((op) => op.line)
    if (!added.length) {
        // only focus moved, or something disappeared
        const removed = ops.filter((op) => op.kind === '-' && !op.line.endsWith(' [focused]'))
        return removed.length ? { after, text: `Changes: ${removed.length} line${removed.length === 1 ? '' : 's'} removed (\`wdio session snapshot -i\` shows the page)` } : { after }
    }
    const shown = added.slice(0, MAX_CHANGED_LINES).map((line) => `+ ${line.trim()}`)
    if (added.length > MAX_CHANGED_LINES) {
        shown.push(`… ${added.length - MAX_CHANGED_LINES} more changed lines (\`wdio session snapshot\`)`)
    }
    return { after, text: `Changes:\n${shown.join('\n')}` }
}

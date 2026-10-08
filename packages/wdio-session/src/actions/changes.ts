import { countRefs, diffLines, type SnapshotNode } from '@wdio/snapshot'

import { takeSnapshot } from './observe.js'
import { openDialog } from './contexts.js'
import { formatSnapshot } from '../snapshot/render.js'
import { scopeOf } from '../snapshot/target.js'
import { waitQuiet } from '../settle.js'
import type { PageChange } from '../agent/types.js'
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
    title?: string
    text?: string
}

export interface PageReport {
    text?: string
    change?: PageChange
    after: PageState
}

const documentTitle = (tree: SnapshotNode) => tree.role === 'document' ? tree.name : undefined

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
        const taken = await reportSnapshot(session)
        return { url: await session.currentUrl(), title: documentTitle(taken.tree), text: taken.text }
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

export async function describeChanges (session: Session, before: PageState, label = 'Page'): Promise<PageReport> {
    let timer: NodeJS.Timeout | undefined
    let current = true
    const dialog = new Promise<PageReport>((resolve) => {
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

/** no `style` or `class`: animations change those all the time */
const SETTLE_ATTRIBUTES = ['value', 'checked', 'disabled', 'hidden', 'open', 'aria-expanded', 'aria-checked', 'aria-selected', 'aria-hidden', 'aria-invalid']

async function compare (session: Session, before: PageState, label: string, isCurrent: () => boolean): Promise<PageReport> {
    try {
        await waitQuiet(scopeOf(session), { quietMs: QUIET_MS, maxMs: MAX_SETTLE_MS, requireComplete: false, attributes: SETTLE_ATTRIBUTES })
    } catch {
        // a navigation replaced the document; the snapshot waits for the new one
    }
    let after: PageState
    let tree
    try {
        const taken = await reportSnapshot(session, isCurrent)
        tree = taken.tree
        after = { url: await session.currentUrl(), title: documentTitle(tree), text: taken.text }
    } catch {
        return { after: {} }
    }
    if (!after.text) {
        return { after }
    }
    if (before.url !== after.url || before.text === undefined) {
        const page = formatSnapshot(tree, { frameHint: session.frameHint, interactive: true })
        if (page.length <= MAX_PAGE_CHARS) {
            // a frame's own URL is on the document line; the session URL is the top page's
            return { after, text: `${label}:${label === 'Page' ? ` ${after.url ?? ''}` : ''}\n${page}`, change: { kind: 'page', frame: label !== 'Page', url: after.url, title: after.title, refs: countRefs(page), snapshot: page } }
        }
        const refs = (page.match(/\[ref=/g) || []).length
        const title = page.split('\n')[0].match(/^- document "(.*?)"/)?.[1]
        return { after, text: `${label}: ${after.url ?? ''}${title ? ` · ${JSON.stringify(title)}` : ''} · ${refs} interactive elements. \`${session.cmd('find', { text: '<text>' }, 'wdio session find <text>')}\` gets the ones you need with their refs; \`${session.cmd('snapshot', { interactive: true }, 'snapshot -i')}\` lists all.`, change: { kind: 'page', frame: label !== 'Page', url: after.url, title: after.title, refs } }
    }
    if (before.text === after.text) {
        return { after }
    }
    // a line that only lost `[focused]` is not news: focus moves with every action
    const unfocused = new Set(before.text.split('\n').filter((line) => line.endsWith(' [focused]')).map((line) => line.slice(0, -' [focused]'.length)))
    const ops = diffLines(before.text.split('\n'), after.text.split('\n'))
    const lines = summarize(parseLines(before.text), parseLines(after.text), ops, unfocused)
    if (lines.kind === 'removed') {
        return { after, text: `Changes: ${lines.removed} line${lines.removed === 1 ? '' : 's'} removed (\`${session.cmd('snapshot', { interactive: true }, 'wdio session snapshot -i')}\` shows the page)`, change: { kind: 'removed', removed: lines.removed } }
    }
    if (lines.kind === 'none') {
        return { after }
    }
    const shown = lines.entries.slice(0, MAX_CHANGED_LINES)
    const omitted = Math.max(0, lines.entries.length - MAX_CHANGED_LINES)
    const text = shown.map((entry) => entry.plain ? entry.text : `+ ${entry.text}`)
    if (omitted) {
        text.push(`… ${omitted} more changed lines (\`${session.cmd('snapshot', undefined, 'wdio session snapshot')}\`)`)
    }
    return { after, text: `Changes:\n${text.join('\n')}`, change: { kind: 'changed', added: shown.map((entry) => entry.text), omitted } }
}

const LANDMARK_ROLES = new Set(['dialog', 'alertdialog', 'region', 'banner', 'complementary'])
const OPEN_STATES = ['open', 'expanded']
/** a name that is only a position ("2 of 5", "Slide 2 / 5"), as carousels name slides; "Step 2 of 4" is a wizard's */
const SLIDE_NAME = /^"(?:(?:slide|item)\s+)?\d+\s*(?:of|\/)\s*\d+"$/i
const LINE = /^(\s*)- (\S+)(?: ("(?:[^"\\]|\\.)*"))?(.*)$/
const STATE_TOKEN = / \[(?!ref=|box=|\+\d)([^\]]+)\]/g
/** at most this many interactive children are listed under an opened dialog */
const MAX_DIALOG_CHILDREN = 10
const CAROUSEL_MOVED = 'Carousel moved'

interface Line {
    text: string
    indent: number
    role: string
    name?: string
    ref?: string
    states: string[]
    /** the line without state tokens: what stays the same when only a state changes */
    stripped: string
    parent: number
}

interface Entry { text: string, plain?: boolean }

type Summary = { kind: 'entries', entries: Entry[] } | { kind: 'removed', removed: number } | { kind: 'none' }

function parseLines (text: string): Line[] {
    const stack: Line[] = []
    const lines: Line[] = []
    for (const raw of text.split('\n')) {
        const [, space = '', role = '', name, rest = ''] = raw.match(LINE) || []
        const states = [...rest.matchAll(STATE_TOKEN)].map((match) => match[1])
        while (stack.length && stack.at(-1)!.indent >= space.length) {
            stack.pop()
        }
        const line: Line = {
            text: raw, indent: space.length, role, name, ref: rest.match(/\[ref=(e\d+)\]/)?.[1], states,
            stripped: `${space}- ${role}${name ? ` ${name}` : ''}${rest.replace(STATE_TOKEN, '')}`,
            parent: stack.length ? lines.indexOf(stack.at(-1)!) : -1
        }
        lines.push(line)
        stack.push(line)
    }
    return lines
}

const landmarkKey = (line: Line) => `${line.role} ${line.name ?? line.ref}`
const label = (line: Line) => `${line.role}${line.name ? ` ${line.name}` : ''}`
const isOpen = (line: Line) => line.states.some((state) => OPEN_STATES.includes(state))

const isSlide = (line: Line) => line.role === 'group' && Boolean(line.name && SLIDE_NAME.test(line.name))

function within (lines: Line[], line: Line, match: (ancestor: Line) => boolean) {
    for (let cur: Line | undefined = line; cur; cur = lines[cur.parent]) {
        if (match(cur)) {
            return true
        }
    }
    return false
}

const withoutSelection = (line: Line) => line.text.replace(/ \[(?:selected|focused)\]/g, '')
const isTab = (lines: Line[], line: Line) => line.role === 'tab' && lines[line.parent]?.role === 'tablist'

/**
 * What the lines that differ mean, most important first: dialogs and
 * landmarks that opened or closed, then new lines, then lines that only
 * changed state. A carousel rotating on its own (slides appearing and going away) is churn: it is one summary
 * line when nothing else changed, and dropped when anything did.
 */
function summarize (before: Line[], after: Line[], ops: ReturnType<typeof diffLines>, unfocused: Set<string>): Summary {
    const addedOps = ops.filter((op) => op.kind === '+')
    const removedOps = ops.filter((op) => op.kind === '-')
    const addedLines = addedOps.filter((op) => !unfocused.has(op.line)).map((op) => after[op.b])
    const removedLines = removedOps.map((op) => before[op.a])
    const removedPlain = new Set(removedLines.map((line) => line.stripped))

    // a tab pair that differs only in which one is selected: a carousel's dots, or a tablist
    const addedTabs = new Set(addedLines.filter((line) => isTab(after, line)).map(withoutSelection))
    const removedTabs = new Set(removedLines.filter((line) => isTab(before, line)).map(withoutSelection))
    // only movement is carousel noise: a slide group that appeared or went away, and what came with it
    const addedSlides = new Set(addedLines.filter(isSlide))
    const removedSlides = new Set(removedLines.filter(isSlide))
    const isPanel = (line: Line) => line.role === 'tabpanel'
    const panelChanged = addedLines.some((line) => within(after, line, isPanel)) || removedLines.some((line) => within(before, line, isPanel))
    // dots next to or inside a moved slide group are a carousel's; tabs that switch a panel are real
    const nearSlide = (lines: Line[], tab: Line, slides: Set<Line>) => {
        const tablist = lines[tab.parent]
        return [...slides].some((slide) => slide.parent === tablist.parent || within(lines, tablist, (ancestor) => ancestor === slide))
    }
    const noisy = (lines: Line[], line: Line, other: Set<string>, slides: Set<Line>) =>
        within(lines, line, (ancestor) => slides.has(ancestor)) ||
        (isTab(lines, line) && other.has(withoutSelection(line)) && (!panelChanged || nearSlide(lines, line, slides)))

    const entries: Entry[] = []
    const claimed = new Set<Line>()
    const removedLandmarks = new Map(removedLines.filter((line) => LANDMARK_ROLES.has(line.role)).map((line) => [landmarkKey(line), line]))
    const addedLandmarks = new Map(addedLines.filter((line) => LANDMARK_ROLES.has(line.role)).map((line) => [landmarkKey(line), line]))
    const events: { at: number, entries: Entry[] }[] = []
    for (const line of addedLines.filter((l) => LANDMARK_ROLES.has(l.role))) {
        const was = removedLandmarks.get(landmarkKey(line))
        if (was && (isOpen(was) || !isOpen(line))) {
            continue
        }
        claimed.add(line)
        const index = after.indexOf(line)
        const children: Entry[] = []
        for (let i = index + 1; i < after.length && after[i].indent > line.indent; i++) {
            if (after[i].ref) {
                claimed.add(after[i])
                children.push({ text: `  ${after[i].text.trim()}`, plain: true })
            }
        }
        const kept = children.slice(0, MAX_DIALOG_CHILDREN)
        if (children.length > kept.length) {
            kept.push({ text: `  … ${children.length - kept.length} more`, plain: true })
        }
        events.push({ at: index, entries: [{ text: `Opened ${label(line)}${line.ref ? ` [ref=${line.ref}]` : ''}`, plain: true }, ...kept] })
    }
    for (const line of removedLines.filter((l) => LANDMARK_ROLES.has(l.role))) {
        const now = addedLandmarks.get(landmarkKey(line))
        if (now && !(isOpen(line) && !isOpen(now))) {
            continue
        }
        events.push({ at: before.indexOf(line), entries: [{ text: `Closed ${label(line)}`, plain: true }] })
    }
    events.sort((a, b) => a.at - b.at)
    entries.push(...events.flatMap((event) => event.entries))

    const rest = addedLines.filter((line) => !claimed.has(line) && !noisy(after, line, removedTabs, addedSlides))
    entries.push(...rest.filter((line) => !removedPlain.has(line.stripped)).map((line) => ({ text: line.text.trim() })))
    entries.push(...rest.filter((line) => removedPlain.has(line.stripped)).map((line) => ({ text: line.text.trim() })))
    if (entries.length) {
        return { kind: 'entries', entries }
    }
    // only focus moved, or something disappeared
    const removed = removedLines.filter((line) => !line.text.endsWith(' [focused]') && !noisy(before, line, addedTabs, removedSlides))
    if (removed.length) {
        return { kind: 'removed', removed: removed.length }
    }
    const churn = [...addedLines.filter((line) => noisy(after, line, removedTabs, addedSlides)), ...removedLines.filter((line) => noisy(before, line, addedTabs, removedSlides))]
    return churn.length ? { kind: 'entries', entries: [{ text: CAROUSEL_MOVED, plain: true }] } : { kind: 'none' }
}

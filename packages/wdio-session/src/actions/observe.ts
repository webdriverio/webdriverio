import fs from 'node:fs'
import path from 'node:path'

import { imageSize } from 'image-size'
import {
    collectWeb, countRefs, unifiedDiff,
    type CollectOptions, type SnapshotNode, type SnapshotRef
} from '@wdio/snapshot'

import { SessionError, notSupported } from '../errors.js'
import { settleFreshPage } from '../settle.js'
import { quote } from '../quote.js'
import { blockAround, headingAbove, lineTest, matchIndex, searchLines } from '../snapshot/find.js'
import { takeNativeSnapshot } from '../snapshot/native.js'
import { formatSnapshot, renderSnapshot } from '../snapshot/render.js'
import { resolveElement, resolveTarget, scopeOf } from '../snapshot/target.js'
import { currentPage, frameBySrc, frameContext } from './contexts.js'
import type { Cmd } from '../hints.js'
import type { ActionFn, Session } from '../session.js'

const DEFAULT_MAX_CHARS = 8000

async function collectTop (session: Session, opts: Omit<CollectOptions, 'roles' | 'assignRefs'>, scope?: WebdriverIO.Element) {
    const browser = scopeOf(session)
    const classic = session.isBidi && browser === session.browser && session.get('classicScripts') !== false
    const result = await collectWeb(browser, opts, { scope, transport: classic ? 'classic-first' : 'bidi' })
    if (result.classicUnavailable) {
        session.set('classicScripts', false)
    }
    return result
}

/** iframes of the page whose content a snapshot shows inline, with refs */
const MAX_INLINE_FRAMES = 5
/** nodes of one inline frame, the rest is a `wdio session frame` away */
const MAX_FRAME_NODES = 300
const FRAME_TIMEOUT_MS = 2000

const TIMED_OUT = Symbol('timed out')

function withTimeout<T> (promise: Promise<T>, ms: number): Promise<T | undefined | typeof TIMED_OUT> {
    let timer: NodeJS.Timeout | undefined
    return Promise.race([
        promise.catch(() => undefined),
        new Promise<typeof TIMED_OUT>((resolve) => { timer = setTimeout(() => resolve(TIMED_OUT), ms) })
    ]).finally(() => clearTimeout(timer))
}

/** the first `max` nodes of a tree, depth first */
function prune (nodes: SnapshotNode[], max: number): { nodes: SnapshotNode[], cut: boolean } {
    let left = max
    let cut = false
    const keep = (list: SnapshotNode[]): SnapshotNode[] => {
        const out: SnapshotNode[] = []
        for (const node of list) {
            if (left <= 0) {
                cut = true
                break
            }
            left--
            out.push(node.children ? { ...node, children: keep(node.children) } : node)
        }
        return out
    }
    return { nodes: keep(nodes), cut }
}

/**
 * The nodes of an inlined frame that overlap the top-level viewport, as the
 * collector judges a page: an element outside it stays only as the wrapper of
 * one inside, and text goes with the element that holds it.
 */
function clipToViewport (nodes: SnapshotNode[], width: number, height: number, parentVisible = true): SnapshotNode[] {
    const overlaps = (box?: number[]) => !box || (box[0] < width && box[0] + box[2] > 0 && box[1] < height && box[1] + box[3] > 0)
    return nodes.flatMap((node) => {
        if (node.role === 'text' && !node.box) {
            return parentVisible ? [node] : []
        }
        // a display:contents wrapper has no box of its own and shows what its parent shows
        const visible = node.box && !node.box[2] && !node.box[3] ? parentVisible : overlaps(node.box)
        const children = node.children && clipToViewport(node.children, width, height, visible)
        if (!visible && !children?.length) {
            return []
        }
        return [children ? { ...node, children } : node]
    })
}

/**
 * The content of the page's iframes, collected in each frame's own browsing
 * context, so elements in a cross-origin frame (a payment form, a bot check's
 * checkbox) get refs like the rest of the page. Without it, every action in a
 * frame takes `frame`, `snapshot`, the action and `frame top`. Actions on these
 * refs enter the frame by themselves (see `Session.dispatch`).
 *
 * Only top-level iframes, at most MAX_INLINE_FRAMES of them, MAX_FRAME_NODES
 * nodes each, FRAME_TIMEOUT_MS per frame. A frame that doesn't answer keeps
 * what the page could see of it.
 */
async function inlineFrames (session: Session, tree: SnapshotNode, opts: Omit<CollectOptions, 'roles' | 'assignRefs' | 'counter'>) {
    const frames: SnapshotNode[] = []
    const visit = (node: SnapshotNode) => {
        if (node.role === 'iframe' && node.ref && !node.hidden) {
            frames.push(node)
            return
        }
        node.children?.forEach(visit)
    }
    visit(tree)
    if (!frames.length) {
        return []
    }
    const owner = await currentPage(session).catch(() => undefined)
    if (!owner) {
        return []
    }
    // clipping to the viewport needs the boxes, also when the snapshot doesn't print them
    const boxed = Boolean(opts.boxes || opts.viewport)
    const refs: (SnapshotRef & { frame: string })[] = []
    // a frame lookup went unanswered: only frames found without asking the page are inlined
    let busy = false
    for (const node of frames.slice(0, MAX_INLINE_FRAMES)) {
        const frameRef = node.ref!
        let collecting = false
        // a lookup given up on must not start collecting later, alongside the next frame
        let givenUp = false
        const result = await withTimeout((async () => {
            const element = await session.refs.resolve(session.browser, frameRef)
            const child = await frameBySrc(session, owner, element) ?? (busy ? undefined : await frameContext(session, owner, element, frameRef))
            if (!child || givenUp) {
                return undefined
            }
            collecting = true
            const collected = await collectWeb(child as unknown as WebdriverIO.Browser, { ...opts, boxes: boxed, counter: session.refs.counter }, { transport: 'bidi' })
                .finally(() => (collecting = false))
            /**
             * The frame's page keeps the ids it handed out, also when the
             * frame is dropped below, so later frames count on from here.
             */
            session.refs.counter = collected?.counter ?? 0
            // boxes in the frame are relative to its viewport, the snapshot's to the page's
            const origin = boxed
                ? await session.browser.execute((el: HTMLElement) => {
                    const rect = el.getBoundingClientRect()
                    return [rect.x + el.clientLeft, rect.y + el.clientTop, innerWidth, innerHeight]
                }, element as unknown as HTMLElement)
                : undefined
            return { collected, origin }
        })(), FRAME_TIMEOUT_MS)
        /**
         * A frame still collecting may hand out ids a later frame would: stop.
         * A lookup that doesn't answer means a busy page (ads loading), and
         * asking it about the next frames would leave more calls pending in
         * the driver, holding later commands: those are only inlined when
         * the context tree names them.
         */
        if (collecting) {
            break
        }
        if (result === TIMED_OUT) {
            givenUp = true
            busy = true
            continue
        }
        if (!result?.collected?.tree) {
            continue
        }
        const { collected, origin } = result
        let children = collected.tree.children ?? []
        if (origin) {
            const shift = (n: SnapshotNode) => {
                if (n.box) {
                    n.box = [Math.round(n.box[0] + origin[0]), Math.round(n.box[1] + origin[1]), n.box[2], n.box[3]]
                }
                n.children?.forEach(shift)
            }
            children.forEach(shift)
            if (opts.viewport) {
                children = clipToViewport(children, origin[2], origin[3])
            }
        }
        const { nodes, cut } = prune(children, MAX_FRAME_NODES)
        node.children = nodes
        node.note = cut ? 'cut' : undefined
        for (const ref of collected.refs) {
            refs.push({ ...ref, frame: frameRef })
        }
    }
    return refs
}

export interface SnapshotOptions {
    depth?: number
    scope?: string
    interactive?: boolean
    all?: boolean
    boxes?: boolean
    compact?: boolean
    urls?: boolean
    /**
     * only what overlaps the viewport
     */
    viewport?: boolean
    /**
     * end each ref line with its best selector
     */
    selectors?: boolean
}

export interface TakenSnapshot {
    text: string
    tree: SnapshotNode
}

/**
 * Collect a snapshot, register its refs and remember it for `diff`.
 *
 * `isCurrent` is asked once the page answered: when it returns false the
 * caller has given up on this snapshot, so it leaves the session untouched.
 */
export async function takeSnapshot (session: Session, opts: SnapshotOptions = {}, isCurrent = () => true): Promise<TakenSnapshot> {
    if (!session.isWeb || (session.applies.includes('M') && !session.applies.includes('W'))) {
        const native = await takeNativeSnapshot(session, opts)
        if (!isCurrent()) {
            throw new SessionError('INTERNAL', 'Snapshot was abandoned.')
        }
        return native
    }
    await settleFreshPage(session)
    const scope = opts.scope ? await resolveElement(session, opts.scope) : undefined
    const boxes = Boolean(opts.boxes)
    const viewport = Boolean(opts.viewport)
    const result = await collectTop(session, {
        counter: session.refs.counter,
        all: Boolean(opts.all),
        boxes,
        urls: Boolean(opts.urls),
        viewport
    }, scope)
    if (!isCurrent()) {
        throw new SessionError('INTERNAL', 'Snapshot was abandoned.')
    }
    session.refs.counter = result.counter
    session.refs.generation++
    const entryOf = (ref: SnapshotRef) => ({ ...ref, candidates: ref.candidates.map((c) => c.selector) })
    for (const ref of result.refs) {
        session.refs.set({ ...entryOf(ref), kind: 'web', generation: session.refs.generation })
    }
    // in a frame the session holds already, the snapshot is that frame's
    const refs: SnapshotRef[] = [...result.refs]
    if (session.isBidi && !scope && !session.get('activeContext')) {
        const frameRefs = await inlineFrames(session, result.tree, { all: Boolean(opts.all), boxes, urls: Boolean(opts.urls), viewport })
        if (!isCurrent()) {
            throw new SessionError('INTERNAL', 'Snapshot was abandoned.')
        }
        for (const ref of frameRefs) {
            session.refs.set({ ...entryOf(ref), kind: 'web', generation: session.refs.generation })
        }
        refs.push(...frameRefs)
    }
    const text = await renderSnapshot(session, result.tree, refs, opts, false)
    return { text, tree: result.tree }
}

function snapshotOptions (args: Record<string, unknown>): SnapshotOptions {
    return {
        depth: typeof args.depth === 'number' ? args.depth : undefined,
        scope: typeof args.scope === 'string' ? args.scope : undefined,
        interactive: Boolean(args.interactive),
        all: Boolean(args.all),
        boxes: Boolean(args.boxes),
        compact: Boolean(args.compact),
        urls: Boolean(args.urls),
        viewport: Boolean(args.viewport),
        selectors: Boolean(args.selectors)
    }
}

export const snapshot: ActionFn = async (session, args) => {
    const { text, tree } = await takeSnapshot(session, snapshotOptions(args))
    if (args.$agent) {
        const agentMax = typeof args.maxChars === 'number' && args.maxChars >= 1 ? Math.floor(args.maxChars) : undefined
        const lines = text.split('\n').length
        const refs = countRefs(text)
        const tooBig = agentMax !== undefined && text.length > agentMax
        const summary = `Snapshot: ${lines} lines, ${refs} refs, ${text.length} chars: too big to return (max ${agentMax}). Use \`${session.cmd('find', { text: '<text>' }, 'wdio session find <text>')}\` or \`scope\`.`
        return { text: tooBig ? summary : text, data: { lines, refs, chars: text.length, tree, snapshot: text, tooBig } }
    }
    const file = session.artifact('snapshots', `${session.timestamp()}.yml`)
    fs.writeFileSync(file, text + '\n')
    // a whole number of characters, so the hints below repeat it as given
    const maxChars = typeof args.maxChars === 'number' && args.maxChars >= 1 ? Math.floor(args.maxChars) : DEFAULT_MAX_CHARS
    const lines = text.split('\n').length
    const refs = countRefs(text)
    const offset = typeof args.offset === 'number' && args.offset > 1 ? Math.floor(args.offset) : 1
    const data = { file, lines, refs, chars: text.length, ...(args.$internal ? { snapshot: text } : {}) }
    if (args.fileOnly) {
        return { text: `Snapshot: ${lines} lines, ${refs} refs, ${text.length} chars → ${file}`, data, files: [file] }
    }
    if (text.length <= maxChars && offset === 1) {
        return { text, data, files: [file] }
    }
    const page = pageOf(text.split('\n'), offset, maxChars)
    return {
        text: [page.text, pageFooter(session.cmd, page, lines, file, repeatFlags(args), hintArgs(args))].join('\n'),
        data: { ...data, from: page.from, to: page.to },
        files: [file]
    }
}

/**
 * Lines `from` (1-based) onwards that fit in `maxChars`, cut at a line. Only
 * a file path for a large page leaves an agent with nothing to act on, and
 * it can't always read the file: the page itself comes first.
 */
function pageOf (lines: string[], from: number, maxChars: number) {
    const start = Math.min(Math.max(from, 1), lines.length) - 1
    const shown: string[] = []
    let size = 0
    for (const line of lines.slice(start)) {
        if (size + line.length + 1 > maxChars) {
            break
        }
        shown.push(line)
        size += line.length + 1
    }
    let cut: { line: number, length: number } | undefined
    if (!shown.length) {
        // one line longer than the whole budget (a link with a long url): its start, and how to read all of it
        shown.push(`${lines[start].slice(0, maxChars - 1)}…`)
        cut = { line: start + 1, length: lines[start].length }
    }
    return { text: shown.join('\n'), from: start + 1, to: start + shown.length, cut }
}

/** the snapshot arguments a hint repeats, for a formatter to name */
function hintArgs (args: Record<string, unknown>) {
    return Object.fromEntries(Object.entries(args).filter(([key]) => !key.startsWith('$')))
}

function pageFooter (cmd: Cmd, page: { from: number, to: number, cut?: { line: number, length: number } }, total: number, file: string, flags: string, args: Record<string, unknown>) {
    const range = `lines ${page.from}–${page.to} of ${total}`
    const whole = page.cut
        ? ` Line ${page.cut.line} is cut; \`${cmd('snapshot', { ...args, maxChars: page.cut.length + 1, offset: page.cut.line }, `wdio session snapshot${flags.replace(/ --max-chars \d+/, '')} --max-chars ${page.cut.length + 1} --offset ${page.cut.line}`)}\` shows all of it.`
        : ''
    const main = (page.to < total
        ? `… ${range}. \`${cmd('snapshot', { ...args, offset: page.to + 1 }, `wdio session snapshot${flags} --offset ${page.to + 1}`)}\` shows the next part, \`${cmd('find', { text: '<text>' }, 'find <text>')}\` searches all of it. Full snapshot: ${file}`
        : `… ${range}. Full snapshot: ${file}`)
    return whole ? `${main}\n${whole.trim()}` : main
}

/** the flags that took this snapshot, to take the next part the same way */
function repeatFlags (args: Record<string, unknown>) {
    return [
        args.interactive ? ' -i' : '',
        args.all ? ' --all' : '',
        args.compact ? ' --compact' : '',
        args.urls ? ' --urls' : '',
        args.boxes ? ' --boxes' : '',
        args.viewport ? ' --viewport' : '',
        args.selectors ? ' --selectors' : '',
        typeof args.depth === 'number' ? ` --depth ${args.depth}` : '',
        // the short preview `open` prints is no size to read the rest in
        typeof args.maxChars === 'number' && args.maxChars >= 1 && !args.$preview ? ` --max-chars ${Math.floor(args.maxChars)}` : '',
        typeof args.scope === 'string' ? ` --scope ${shellQuote(args.scope)}` : ''
    ].join('')
}

/** a shell word that stays as it is: single quotes, which expand nothing */
function shellQuote (text: string) {
    return `'${text.replace(/'/g, '\'\\\'\'')}'`
}

/** printed `find` output stops after about this many characters */
const MAX_FIND_CHARS = 6000
/** a printed `find` line is cut to this many characters (a code block is one line); matching sees all of it */
const MAX_FIND_LINE_CHARS = 300

/** a match this far into a line is shown with this many characters before it */
const FIND_LINE_LEAD_CHARS = 40

const FIND_LINE_HEAD_CHARS = 120

/** a line over the limit is cut to a window that holds its match (index 0: the start) */
function capLine (line: string, index = 0) {
    if (line.length <= MAX_FIND_LINE_CHARS) {
        return line
    }
    let start = index < MAX_FIND_LINE_CHARS / 2
        ? 0
        : Math.max(0, Math.min(index - FIND_LINE_LEAD_CHARS, line.length - (MAX_FIND_LINE_CHARS - 1)))
    const ref = /\[ref=e\d+\]/.exec(line)
    if (ref) {
        const refEnd = ref.index + ref[0].length
        const whole = refEnd <= FIND_LINE_HEAD_CHARS
        const head = whole ? line.slice(0, refEnd) : `${/^(\s*- \S+)/.exec(line)?.[1] ?? ''} ${ref[0]}`
        const budget = MAX_FIND_LINE_CHARS - head.length - 2
        const from = Math.min(index - FIND_LINE_LEAD_CHARS, line.length - budget)
        if (from > refEnd) {
            const end = from + budget >= line.length ? line.length : from + budget - 1
            return `${head} …${line.slice(from, end)}${end < line.length ? '…' : ''}`
        }
        if (whole) {
            start = 0
        }
    }
    const lead = start ? 1 : 0
    let end = start + MAX_FIND_LINE_CHARS - lead >= line.length ? line.length : start + MAX_FIND_LINE_CHARS - lead - 1
    // a ref after the window is what an action needs: it outranks the text it replaces
    const tail = ref && ref.index >= end ? ` ${ref[0]}` : ''
    if (tail) {
        end = start + MAX_FIND_LINE_CHARS - lead - tail.length - 1
    }
    return `${start ? '…' : ''}${line.slice(start, end)}${end < line.length ? '…' : ''}${tail}`
}

/** the find flags a hint repeats to show the next matches the same way */
function repeatFindFlags (args: Record<string, unknown>) {
    return [
        args.regex ? ' --regex' : '',
        typeof args.scope === 'string' ? ` --scope ${shellQuote(args.scope)}` : '',
        typeof args.context === 'number' ? ` -C ${args.context}` : '',
        typeof args.afterContext === 'number' ? ` -A ${args.afterContext}` : '',
        typeof args.beforeContext === 'number' ? ` -B ${args.beforeContext}` : ''
    ].join('')
}

export const find: ActionFn = async (session, args) => {
    const query = String(args.text ?? '')
    const scope = typeof args.scope === 'string' ? args.scope : undefined
    // grep habits: -A/-B/-C switch to plain line context
    const lineMode = [args.context, args.afterContext, args.beforeContext].some((n) => typeof n === 'number')
    const before = typeof args.beforeContext === 'number' ? args.beforeContext : typeof args.context === 'number' ? args.context : 0
    const after = typeof args.afterContext === 'number' ? args.afterContext : typeof args.context === 'number' ? args.context : 0
    const regex = Boolean(args.regex)
    const test = lineTest(query, regex)
    const search = (snapshotText: string) => searchLines(snapshotText, query, test, regex)
    const { text: linked } = await takeSnapshot(session, { urls: true, scope })
    let { lines, shown, matches, note } = search(linked)
    const baseline = lines.join('\n')
    session.lastSnapshot = baseline
    let hidden = false
    if (!matches.length) {
        // in a closed menu, tab, accordion or behind "Show more": say so instead of "no match"
        const { text: all } = await takeSnapshot(session, { urls: true, scope, all: true })
        // the hidden-inclusive page is not what `diff` compares against
        session.lastSnapshot = baseline
        const found = search(all)
        if (found.matches.length) {
            ({ lines, shown, matches } = found)
            hidden = matches.some((i) => / \[hidden\]/.test(lines[i]))
            note = hidden
                ? `No visible line contains ${JSON.stringify(query)}. It is on the page but hidden ([hidden]): open the menu, tab or section it is in (e.g. a "Show more" button) first.\n`
                // e.g. the options of a closed select: there, but not in a snapshot without --all
                : `No line of the page contains ${JSON.stringify(query)}; lines of \`${session.cmd('snapshot', { all: true }, 'snapshot --all')}\` that do:\n`
        }
    }
    if (!matches.length) {
        throw new SessionError('NO_MATCH', `No match for ${JSON.stringify(query)}.`, {
            hint: 'Try a shorter text or --regex; elements that only appear after a click (menus, popovers) are not on the page yet.'
        })
    }
    const total = matches.length
    const skip = typeof args.offset === 'number' && args.offset > 0 ? Math.floor(args.offset) : 0
    if (skip >= total) {
        throw new SessionError('NO_MATCH', `--offset ${skip} is past the last of ${total} match${total === 1 ? '' : 'es'} for ${JSON.stringify(query)}.`)
    }
    matches = matches.slice(skip)
    const out: string[] = []
    let last = -1
    let size = 0
    for (const idx of matches) {
        if (idx <= last) {
            continue
        }
        // a common word on a big page can match hundreds of lines
        if (size > MAX_FIND_CHARS) {
            break
        }
        const [blockStart, blockEnd] = lineMode
            ? [Math.max(0, idx - before), Math.min(lines.length - 1, idx + after)]
            : blockAround(lines, idx)
        // block mode only: line mode prints the lines asked for and nothing else
        const heading = lineMode ? undefined : headingAbove(lines, blockStart, blockEnd)
        if (heading !== undefined && heading > last) {
            if (last >= 0 && heading > last + 1) {
                out.push('--')
            }
            const line = `${heading + 1}-${capLine(shown[heading])}`
            out.push(line)
            size += line.length + 1
            last = heading
        }
        const start = Math.max(blockStart, last + 1)
        if (last >= 0 && start > last + 1) {
            out.push('--')
        }
        for (let i = start; i <= blockEnd; i++) {
            const line = `${i + 1}${matches.includes(i) ? ':' : '-'}${capLine(shown[i], matches.includes(i) ? matchIndex(shown[i], query, regex) : 0)}`
            out.push(line)
            size += line.length + 1
        }
        last = blockEnd
    }
    const rest = matches.filter((i) => i > last).length
    // the data is capped like the text: `--json` output must not explode either
    const listed = matches.filter((i) => i <= last)
    if (rest) {
        const next = skip + listed.length
        out.push(`… ${rest} more matching line${rest === 1 ? '' : 's'} not shown. \`${session.cmd('find', { ...hintArgs(args), offset: next }, `wdio session find ${shellQuote(query)}${repeatFindFlags(args)} --offset ${next}`)}\` shows the next ones, or search for a longer text, or narrow it with --scope.`)
    }
    if (!hidden) {
        await scrollToFirst(session, lines, matches[0])
    }
    return { text: note + out.join('\n'), data: { matches: listed.map((i) => ({ line: i + 1, text: capLine(lines[i], matchIndex(lines[i], query, regex)) })), total, hidden } }
}

/**
 * Bring the first match that has a ref into view, so the page, and a
 * screenshot of it, shows what was found. Best effort: a match that can't
 * be scrolled to still counts.
 */
async function scrollToFirst (session: Session, lines: string[], first: number) {
    if (!session.isWeb) {
        return
    }
    // a heading or text has no ref: the closest element that has one, above it in its block or below it
    const [start, end] = blockAround(lines, first)
    const order = [first, ...Array.from({ length: first - start }, (_, i) => first - 1 - i), ...Array.from({ length: end - first }, (_, i) => first + 1 + i)]
    const id = order.map((i) => /\[ref=(e\d+)\]/.exec(lines[i])?.[1]).find(Boolean)
    if (!id) {
        return
    }
    try {
        await scrollIntoCenter(session, await session.refs.resolve(scopeOf(session), id))
    } catch {
        // a ref of an inline frame or a removed element
    }
}

async function scrollIntoCenter (session: Session, el: unknown) {
    await scopeOf(session).execute((node: HTMLElement) => node.scrollIntoView({ block: 'center', inline: 'nearest' }), el as HTMLElement)
}

export const diff: ActionFn = async (session, args) => {
    let before = session.lastSnapshot
    if (typeof args.baseline === 'string') {
        const file = path.resolve(args.$cwd, args.baseline)
        if (!fs.existsSync(file)) {
            throw new SessionError('USAGE', `Baseline ${file} does not exist.`)
        }
        before = fs.readFileSync(file, 'utf-8').replace(/\n$/, '')
    }
    const { text } = await takeSnapshot(session, {
        scope: typeof args.scope === 'string' ? args.scope : undefined,
        interactive: Boolean(args.interactive)
    })
    if (before === undefined) {
        return { text: `No previous snapshot, stored this one as the baseline (${text.split('\n').length} lines).`, data: { changed: false, baseline: true } }
    }
    const result = unifiedDiff(before, text)
    return { text: result || 'No changes', data: { changed: Boolean(result), diff: result } }
}

/** PNG width and height sit in the IHDR chunk, 24 bytes from the start. */
const PNG_HEADER_BYTES = 24

export function pngSize (file: string) {
    let fd: number | undefined
    try {
        fd = fs.openSync(file, 'r')
        const header = Buffer.alloc(PNG_HEADER_BYTES)
        if (fs.readSync(fd, header, 0, PNG_HEADER_BYTES, 0) < PNG_HEADER_BYTES) {
            return undefined
        }
        const size = imageSize(header)
        if (size.type !== 'png' || size.width === undefined || size.height === undefined) {
            return undefined
        }
        return { width: size.width, height: size.height }
    } catch {
        return undefined
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd)
        }
    }
}

function outputFile (session: Session, args: Record<string, unknown>, dir: string, ext: string) {
    if (typeof args.path === 'string') {
        const file = path.resolve(String(args.$cwd), args.path)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        return file
    }
    return session.artifact(dir, `${session.timestamp()}${ext}`)
}

export const screenshot: ActionFn = async (session, args) => {
    const file = outputFile(session, args, 'screenshots', '.png')
    let what = 'viewport'
    let selector: string | undefined
    if (args.target) {
        const target = await resolveTarget(session, args.target)
        await target.element.saveScreenshot(file)
        what = target.label
        selector = target.selector
    } else if (args.full) {
        if (!session.isWeb || session.applies.includes('M')) {
            throw notSupported('--full is only supported for web sessions.')
        }
        await session.browser.saveScreenshot(file, { fullPage: true })
        what = 'full page'
    } else {
        await session.browser.saveScreenshot(file)
    }
    const size = pngSize(file)
    return {
        text: `Saved ${what} screenshot${size ? ` ${size.width}x${size.height}` : ''} → ${file}`,
        data: { file, ...size, ...(selector ? { selector } : {}) },
        files: [file]
    }
}

/**
 * Print the current page to a PDF. The path must end in `.pdf`, matching
 * `browser.savePDF`. BiDi sessions render with `browsingContext.print`,
 * including headed Chrome, Edge, and Firefox. Classic sessions use
 * `printPage`. Chrome's Classic print was headless-only; current Chrome
 * can also print headed, and older Chrome may still require headless.
 */
export const pdf: ActionFn = async (session, args) => {
    if (!session.isWeb) {
        throw notSupported('pdf is only supported for web sessions.')
    }
    const given = typeof args.file === 'string' && args.file
        ? args.file
        : typeof args.path === 'string' ? args.path : undefined
    let file: string
    if (given) {
        if (!given.toLowerCase().endsWith('.pdf')) {
            throw new SessionError('USAGE', 'The PDF path must end with .pdf.')
        }
        file = path.resolve(String(args.$cwd), given)
        fs.mkdirSync(path.dirname(file), { recursive: true })
    } else {
        file = session.artifact('pdf', `${session.timestamp()}.pdf`)
    }
    await session.browser.savePDF(file)
    return {
        text: `Saved PDF → ${file}`,
        code: `await browser.savePDF(${quote(file)})`,
        data: { file },
        files: [file]
    }
}

export const source: ActionFn = async (session, args) => {
    const web = session.isWeb && !session.applies.includes('M')
    const file = outputFile(session, args, 'source', web ? '.html' : '.xml')
    const content = await session.browser.getPageSource()
    fs.writeFileSync(file, content)
    const bytes = Buffer.byteLength(content)
    const size = bytes > 1024 ? `${(bytes / 1024).toFixed(1)} kB` : `${bytes} B`
    return { text: `Saved ${web ? 'HTML' : 'XML'} source (${size}) → ${file}`, data: { file, bytes }, files: [file] }
}

/** `scroll` prints what is in view up to about this many characters */
const MAX_IN_VIEW_CHARS = 3000

/**
 * What a person sees now: the interactive elements and text in the viewport,
 * with refs, so an agent doesn't need a screenshot after scrolling.
 */
export async function describeViewport (session: Session): Promise<string> {
    // a report, not a snapshot the user took: `diff` keeps comparing against theirs
    const baseline = session.lastSnapshot
    const { tree } = await takeSnapshot(session, { viewport: true })
    session.lastSnapshot = baseline
    const lines = formatSnapshot(tree, { frameHint: session.frameHint, compact: true }).split('\n')
    const out: string[] = []
    let size = 0
    for (const line of lines) {
        if (size + line.length > MAX_IN_VIEW_CHARS) {
            out.push(`… ${lines.length - out.length} more lines in view; \`${session.cmd('find', { text: '<text>' }, 'wdio session find <text>')}\` or \`${session.cmd('snapshot', { interactive: true }, 'snapshot -i')}\` for the rest.`)
            break
        }
        out.push(line)
        size += line.length + 1
    }
    return out.join('\n')
}

/** `read` prints the page text up to this many characters by default */
const DEFAULT_READ_CHARS = 6000

/**
 * The readable content of the page, as Markdown: headings, paragraphs, list
 * items, table rows and links with their URL, from the main content when the
 * page marks it. For "what does the page say" questions it is far smaller
 * than a snapshot and easier to read than `get text`. The text is the page's
 * own words: data, nothing to act on.
 */
export const read: ActionFn = async (session, args) => {
    const maxChars = typeof args.maxChars === 'number' && args.maxChars > 0 ? args.maxChars : DEFAULT_READ_CHARS
    const offset = typeof args.offset === 'number' && args.offset > 0 ? Math.floor(args.offset) : 0
    const scope = typeof args.scope === 'string' ? (await resolveTarget(session, args.scope)).element : undefined
    if (scope && session.isWeb && await scope.isDisplayed().catch(() => false)) {
        // a screenshot of the page shows what was read
        await scrollIntoCenter(session, scope).catch(() => {})
    }
    const text = await scopeOf(session).execute(function (root: Element | undefined, limit: number) {
        const start = root || document.querySelector('main, [role="main"], article') || document.body
        const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS', 'IFRAME', 'NAV', 'FOOTER', 'ASIDE'])
        const BLOCK = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FORM', 'FIELDSET', 'BLOCKQUOTE', 'PRE', 'FIGURE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'ADDRESS'])
        const out: string[] = []
        // length of `out` joined with newlines, the offsets `read --offset` counts in
        let size = 0
        let line = ''
        let cut = false
        let more = false
        const flush = (prefix = '') => {
            const text = line.replace(/\s+/g, ' ').trim()
            line = ''
            if (!text || more) {
                return
            }
            const room = limit - size - (out.length ? 1 : 0)
            if (room < 0) {
                more = true
                return
            }
            // one long paragraph is cut too, not only the lines after it
            cut = prefix.length + text.length > room
            more = cut
            const kept = cut ? `${prefix}${text.slice(0, Math.max(0, room - prefix.length))}…` : prefix + text
            out.push(kept)
            size += (out.length > 1 ? 1 : 0) + kept.length
        }
        const hidden = (el: Element) => {
            const style = getComputedStyle(el)
            return style.display === 'none' || style.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true'
        }
        const walk = (node: Node) => {
            if (more) {
                return
            }
            if (node.nodeType === Node.TEXT_NODE) {
                line += node.textContent
                return
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return
            }
            const el = node as HTMLElement
            // the start element is read even when the page marks it as navigation
            if ((el !== start && SKIP.has(el.tagName)) || hidden(el)) {
                return
            }
            const heading = /^H([1-6])$/.exec(el.tagName)
            if (heading) {
                flush()
                line = el.innerText
                flush('#'.repeat(Number(heading[1])) + ' ')
                return
            }
            if (el.tagName === 'LI') {
                flush()
                for (const child of Array.from(el.childNodes)) {
                    walk(child)
                }
                flush('- ')
                return
            }
            if (el.tagName === 'TR') {
                flush()
                line = Array.from(el.children).map((cell) => (cell as HTMLElement).innerText.replace(/\s+/g, ' ').trim()).join(' | ') + ' |'
                flush('| ')
                return
            }
            if (el.tagName === 'A' && (el as HTMLAnchorElement).href && !(el as HTMLAnchorElement).href.startsWith('javascript:')) {
                const label = el.innerText.replace(/\s+/g, ' ').trim()
                if (label) {
                    line += ` [${label}](${(el as HTMLAnchorElement).href}) `
                }
                return
            }
            if (el.tagName === 'BR') {
                flush()
                return
            }
            if (el.tagName === 'IMG' && (el as HTMLImageElement).alt) {
                line += ` [image: ${(el as HTMLImageElement).alt}] `
                return
            }
            const block = BLOCK.has(el.tagName) || el.tagName === 'TABLE' || el.tagName === 'UL' || el.tagName === 'OL'
            if (block) {
                flush()
            }
            for (const child of Array.from(el.shadowRoot ? el.shadowRoot.childNodes : el.childNodes)) {
                walk(child)
            }
            if (block) {
                flush()
            }
        }
        walk(start)
        flush()
        return { text: out.join('\n'), truncated: more, cut, from: start === document.body ? 'body' : start.tagName.toLowerCase() }
    }, scope, offset + maxChars) as { text: string, truncated: boolean, cut: boolean, from: string }
    if (offset >= text.text.length && offset > 0 && !text.truncated) {
        return { text: `--offset ${offset} is past the end of the text (${text.text.length} characters).`, data: { chars: 0 } }
    }
    if (!text.text) {
        return { text: `The page has no readable text here. \`${session.cmd('snapshot', undefined, 'wdio session snapshot')}\` shows its elements.`, data: { chars: 0 } }
    }
    const shown = text.text.slice(offset)
    // the cut paragraph's "…" is not page text: the next part starts before it
    const next = offset + shown.length - (text.cut ? 1 : 0)
    const tail = text.truncated ? `\n… ${offset ? `characters ${offset}–${next}` : `cut at ${maxChars} characters`}; \`${session.cmd('read', { ...hintArgs(args), offset: next }, `wdio session read${typeof args.scope === 'string' ? ` --scope ${shellQuote(args.scope)}` : ''}${typeof args.maxChars === 'number' ? ` --max-chars ${maxChars}` : ''} --offset ${next}`)}\` reads the next part, --scope reads a section.` : ''
    return { text: shown + tail, data: { chars: shown.length, truncated: text.truncated, from: text.from } }
}

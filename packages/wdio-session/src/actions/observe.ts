import fs from 'node:fs'
import path from 'node:path'

import { imageSize } from 'image-size'
import { knownRoles, roleTable } from '@wdio/utils'

import { SessionError, notSupported } from '../errors.js'
import { quote } from '../quote.js'
import { collectInPage, type CollectOptions } from '../snapshot/web.js'
import { countRefs, formatSnapshot, type SnapshotNode } from '../snapshot/format.js'
import { unifiedDiff } from '../snapshot/diff.js'
import { takeNativeSnapshot } from '../snapshot/native.js'
import { resolveElement, resolveTarget, scopeOf } from '../snapshot/target.js'
import { currentPage, frameContext } from './contexts.js'
import type { ActionFn, Session } from '../session.js'

const DEFAULT_MAX_CHARS = 8000

/**
 * The collector as a classic WebDriver script. Built once: it is sent with
 * every snapshot.
 */
const COLLECT_SCRIPT = `return (${collectInPage.toString()})(arguments[0])`

/**
 * run the snapshot collector in the page. `web.ts` only holds code that
 * runs in the browser, the role table comes from here.
 *
 * In a BiDi session `execute` goes through the driver's BiDi layer, which
 * is slow for large messages: a snapshot (a 6 KB role table in, up to
 * ~100 KB of tree out) took 300-800 ms in Chrome while the collector itself
 * ran in 1-40 ms. The classic `executeScript` endpoint carries the same
 * plain JSON in a few milliseconds, so the top-level document uses it.
 * Frames and other tabs the session holds as BiDi browsing contexts keep
 * using `execute`, which targets them.
 */
async function collectWeb (session: Session, opts: Omit<CollectOptions, 'roles' | 'assignRefs'>, scope?: WebdriverIO.Element) {
    const browser = scopeOf(session)
    const args: CollectOptions = { ...opts, roles: roleTable(), knownRoles: knownRoles(), assignRefs: true }
    if (scope) {
        return browser.execute(collectInPage, args, scope as unknown as Element)
    }
    if (session.isBidi && browser === session.browser && session.get('classicScripts') !== false) {
        try {
            return await session.browser.executeScript(COLLECT_SCRIPT, [args]) as ReturnType<typeof collectInPage>
        } catch {
            // a driver without the classic endpoint in BiDi sessions: stay on BiDi
            session.set('classicScripts', false)
        }
    }
    return browser.execute(collectInPage, args)
}

/** iframes of the page whose content a snapshot shows inline, with refs */
const MAX_INLINE_FRAMES = 5
/** nodes of one inline frame, the rest is a `wdio session frame` away */
const MAX_FRAME_NODES = 300
const FRAME_TIMEOUT_MS = 2000

function withTimeout<T> (promise: Promise<T>, ms: number): Promise<T | undefined> {
    let timer: NodeJS.Timeout | undefined
    return Promise.race([
        promise.catch(() => undefined),
        new Promise<undefined>((resolve) => { timer = setTimeout(() => resolve(undefined), ms) })
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
    const refs: { id: string, role: string, name?: string, candidates: string[], frame: string }[] = []
    for (const node of frames.slice(0, MAX_INLINE_FRAMES)) {
        const frameRef = node.ref!
        let collecting = false
        const result = await withTimeout((async () => {
            const element = await session.refs.resolve(session.browser, frameRef)
            const child = await frameContext(session, owner, element, frameRef)
            collecting = true
            const collected = await child.execute(collectInPage, { ...opts, counter: session.refs.counter, roles: roleTable(), knownRoles: knownRoles(), assignRefs: true })
                .finally(() => (collecting = false)) as ReturnType<typeof collectInPage>
            /**
             * The frame's page keeps the ids it handed out, also when the
             * frame is dropped below, so later frames count on from here.
             */
            session.refs.counter = collected?.counter ?? 0
            // boxes in the frame are relative to its viewport, the snapshot's to the page's
            const origin = opts.boxes
                ? await session.browser.execute((el: HTMLElement) => {
                    const rect = el.getBoundingClientRect()
                    return [rect.x + el.clientLeft, rect.y + el.clientTop]
                }, element as unknown as HTMLElement)
                : undefined
            return { collected, origin }
        })(), FRAME_TIMEOUT_MS)
        if (collecting) {
            // the frame may still hand out ids a later frame would hand out too
            break
        }
        if (!result?.collected?.tree) {
            continue
        }
        const { collected, origin } = result
        if (origin) {
            const shift = (n: SnapshotNode) => {
                if (n.box) {
                    n.box = [Math.round(n.box[0] + origin[0]), Math.round(n.box[1] + origin[1]), n.box[2], n.box[3]]
                }
                n.children?.forEach(shift)
            }
            collected.tree.children?.forEach(shift)
        }
        const { nodes, cut } = prune(collected.tree.children ?? [], MAX_FRAME_NODES)
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
        session.lastSnapshot = native.text
        return native
    }
    const scope = opts.scope ? await resolveElement(session, opts.scope) : undefined
    const result = await collectWeb(session, {
        counter: session.refs.counter,
        all: Boolean(opts.all),
        boxes: Boolean(opts.boxes),
        urls: Boolean(opts.urls)
    }, scope)
    if (!isCurrent()) {
        throw new SessionError('INTERNAL', 'Snapshot was abandoned.')
    }
    session.refs.counter = result.counter
    session.refs.generation++
    for (const ref of result.refs) {
        session.refs.set({ ...ref, kind: 'web', generation: session.refs.generation })
    }
    // in a frame the session holds already, the snapshot is that frame's
    if (session.isBidi && !scope && !session.get('activeContext')) {
        const frameRefs = await inlineFrames(session, result.tree, { all: Boolean(opts.all), boxes: Boolean(opts.boxes), urls: Boolean(opts.urls) })
        if (!isCurrent()) {
            throw new SessionError('INTERNAL', 'Snapshot was abandoned.')
        }
        for (const ref of frameRefs) {
            session.refs.set({ ...ref, kind: 'web', generation: session.refs.generation })
        }
    }
    const text = formatSnapshot(result.tree, { depth: opts.depth, interactive: opts.interactive, boxes: opts.boxes, compact: opts.compact })
    session.lastSnapshot = text
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
        urls: Boolean(args.urls)
    }
}

export const snapshot: ActionFn = async (session, args) => {
    const { text } = await takeSnapshot(session, snapshotOptions(args))
    const file = session.artifact('snapshots', `${session.timestamp()}.yml`)
    fs.writeFileSync(file, text + '\n')
    const maxChars = typeof args.maxChars === 'number' ? args.maxChars : DEFAULT_MAX_CHARS
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
        text: [page.text, pageFooter(page, lines, file, repeatFlags(args))].join('\n'),
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

function pageFooter (page: { from: number, to: number, cut?: { line: number, length: number } }, total: number, file: string, flags: string) {
    const range = `lines ${page.from}–${page.to} of ${total}`
    const whole = page.cut
        ? ` Line ${page.cut.line} is cut; \`wdio session snapshot${flags.replace(/ --max-chars \d+/, '')} --max-chars ${page.cut.length + 1} --offset ${page.cut.line}\` shows all of it.`
        : ''
    const main = (page.to < total
        ? `… ${range}. \`wdio session snapshot${flags} --offset ${page.to + 1}\` shows the next part, \`find <text>\` searches all of it. Full snapshot: ${file}`
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
        typeof args.depth === 'number' ? ` --depth ${args.depth}` : '',
        // the short preview `open` prints is no size to read the rest in
        typeof args.maxChars === 'number' && !args.$preview ? ` --max-chars ${args.maxChars}` : '',
        typeof args.scope === 'string' ? ` --scope ${shellQuote(args.scope)}` : ''
    ].join('')
}

/** a shell word that stays as it is: single quotes, which expand nothing */
function shellQuote (text: string) {
    return `'${text.replace(/'/g, '\'\\\'\'')}'`
}

/** lines a `find` block may have before it is cut to a window around the match */
const MAX_BLOCK_LINES = 12

const indentOf = (line: string) => line.length - line.trimStart().length

/**
 * Lines to print for a match: its parent node with everything under it, so
 * the answer next to the match (a default value, a price, a status) comes
 * along. A big parent is cut to a window around the match.
 */
function blockAround (lines: string[], idx: number): [number, number] {
    const indent = indentOf(lines[idx])
    let start = idx
    while (start > 0 && indentOf(lines[start]) >= indent) {
        start--
    }
    const parentIndent = indentOf(lines[start])
    let end = idx
    while (end + 1 < lines.length && indentOf(lines[end + 1]) > parentIndent) {
        end++
    }
    if (end - start + 1 > MAX_BLOCK_LINES) {
        return [Math.max(start, idx - 2), Math.min(end, idx + MAX_BLOCK_LINES - 3)]
    }
    return [start, end]
}

const LINK_URL = / url=(\S+)$/

/** `https://en.wikipedia.org/wiki/World_Wide_Web` → `… World Wide Web` */
export function readableUrl (url: string) {
    let decoded = url
    try {
        decoded = decodeURIComponent(url)
    } catch {
        // keep it as is
    }
    return decoded.replace(/[_+]/g, ' ')
}

/**
 * Snapshot lines that match, from a snapshot taken with link URLs. A link's
 * target counts as well as its text: "World Wide Web" finds a link reading
 * "web technologies" to /wiki/World_Wide_Web. URLs are printed only on the
 * lines they made match.
 */
export function matchLines (withUrls: string[], test: (line: string) => boolean) {
    const lines = withUrls.map((line) => line.replace(LINK_URL, ''))
    const shown = [...lines]
    const matches: number[] = []
    lines.forEach((line, i) => {
        const url = withUrls[i].match(LINK_URL)?.[1]
        if (test(line)) {
            matches.push(i)
        } else if (url && test(readableUrl(url))) {
            matches.push(i)
            shown[i] = withUrls[i]
        }
    })
    return { lines, shown, matches }
}

/** printed `find` output stops after about this many characters */
const MAX_FIND_CHARS = 6000

const SUFFIXES = ['ations', 'ation', 'ions', 'ion', 'ing', 'ers', 'er', 'ed', 'es', 'e', 's']

/**
 * The stem of a search word, so that "give" finds "Giving" and "donate"
 * finds "Donation": the word without a common English ending, at least
 * three letters long.
 */
export function stem (word: string) {
    const lower = word.toLowerCase()
    for (const suffix of SUFFIXES) {
        if (lower.endsWith(suffix) && lower.length - suffix.length >= 3) {
            return lower.slice(0, -suffix.length)
        }
    }
    return lower
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const find: ActionFn = async (session, args) => {
    const query = String(args.text ?? '')
    const scope = typeof args.scope === 'string' ? args.scope : undefined
    // grep habits: -A/-B/-C switch to plain line context
    const lineMode = [args.context, args.afterContext, args.beforeContext].some((n) => typeof n === 'number')
    const before = typeof args.beforeContext === 'number' ? args.beforeContext : typeof args.context === 'number' ? args.context : 0
    const after = typeof args.afterContext === 'number' ? args.afterContext : typeof args.context === 'number' ? args.context : 0
    let test: (line: string) => boolean
    if (args.regex) {
        let re: RegExp
        try {
            re = new RegExp(query, 'i')
        } catch (err) {
            throw new SessionError('USAGE', `Invalid regular expression: ${(err as Error).message}`)
        }
        test = (line) => re.test(line)
    } else {
        const needle = query.toLowerCase()
        test = (line) => line.toLowerCase().includes(needle)
    }
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    // "SO2" when the page says "SO 2" (a subscript), "1 Y" for "1Y"
    const squeezed = query.toLowerCase().replace(/\s+/g, '')
    /**
     * The query as given, then without spaces, then all of its words, then
     * words like them ("give" finds "Giving"): agents search with keywords,
     * not with a line of the page.
     */
    const search = (snapshotText: string) => {
        const all = snapshotText.split('\n')
        let found = matchLines(all, test)
        if (found.matches.length || args.regex) {
            return { ...found, note: '' }
        }
        const tries: [boolean, (line: string) => boolean, string][] = [
            [squeezed.length > 1, (line) => line.toLowerCase().replace(/\s+/g, '').includes(squeezed), 'lines that do without the spaces'],
            [words.length > 1, (line) => words.every((w) => line.toLowerCase().includes(w)), 'lines with all of its words'],
            [words.length > 0, (line) => words.every((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(stem(w))}`, 'iu').test(line)), 'lines with words like it']
        ]
        for (const [applies, fallback, what] of tries) {
            if (applies && (found = matchLines(all, fallback)).matches.length) {
                return { ...found, note: `No line contains ${JSON.stringify(query)}; ${what}:\n` }
            }
        }
        return { ...found, note: '' }
    }
    const { text: linked } = await takeSnapshot(session, { urls: true, scope })
    let { lines, shown, matches, note } = search(linked)
    session.lastSnapshot = lines.join('\n')
    let hidden = false
    if (!matches.length) {
        // in a closed menu, tab, accordion or behind "Show more": say so instead of "no match"
        const { text: all } = await takeSnapshot(session, { urls: true, scope, all: true })
        const found = search(all)
        if (found.matches.length) {
            ({ lines, shown, matches } = found)
            hidden = matches.some((i) => / \[hidden\]/.test(lines[i]))
            note = hidden
                ? `No visible line contains ${JSON.stringify(query)}. It is on the page but hidden ([hidden]): open the menu, tab or section it is in (e.g. a "Show more" button) first.\n`
                // e.g. the options of a closed select: there, but not in a snapshot without --all
                : `No line of the page contains ${JSON.stringify(query)}; lines of \`snapshot --all\` that do:\n`
        }
    }
    if (!matches.length) {
        throw new SessionError('NO_MATCH', `No match for ${JSON.stringify(query)}.`, {
            hint: 'Try a shorter text or --regex; elements that only appear after a click (menus, popovers) are not on the page yet.'
        })
    }
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
        const start = Math.max(blockStart, last + 1)
        if (last >= 0 && start > last + 1) {
            out.push('--')
        }
        for (let i = start; i <= blockEnd; i++) {
            const line = `${i + 1}${matches.includes(i) ? ':' : '-'}${shown[i]}`
            out.push(line)
            size += line.length + 1
        }
        last = blockEnd
    }
    const rest = matches.filter((i) => i > last).length
    if (rest) {
        out.push(`… ${rest} more matching line${rest === 1 ? '' : 's'} not shown. Search for a longer text, or narrow it with --scope.`)
    }
    if (!hidden) {
        await scrollToFirst(session, lines, matches[0])
    }
    // the data is capped like the text: `--json` output must not explode either
    const listed = matches.filter((i) => i <= last)
    return { text: note + out.join('\n'), data: { matches: listed.map((i) => ({ line: i + 1, text: lines[i] })), total: matches.length, hidden } }
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
        const el = await session.refs.resolve(scopeOf(session), id)
        await scopeOf(session).execute((node: HTMLElement) => node.scrollIntoView({ block: 'center', inline: 'nearest' }), el as unknown as HTMLElement)
    } catch {
        // a ref of an inline frame or a removed element
    }
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
 * The part of a snapshot tree that is in the viewport: elements whose box
 * overlaps it, with their text. Text has no box of its own and goes with
 * its element.
 */
export function inViewport (node: SnapshotNode, width: number, height: number): SnapshotNode | undefined {
    const visible = (box?: number[]) => !box || (box[1] < height && box[1] + box[3] > 0 && box[0] < width && box[0] + box[2] > 0)
    // text directly in a container taller than the viewport could be anywhere in it
    const placesText = (box?: number[]) => Boolean(box) && box![3] <= height
    const keep = (current: SnapshotNode, root: boolean, parentPlacesText: boolean): SnapshotNode | undefined => {
        if (current.role === 'text') {
            return parentPlacesText ? current : undefined
        }
        if (!root && !visible(current.box)) {
            return undefined
        }
        const children = (current.children ?? [])
            .map((child) => keep(child, false, placesText(current.box)))
            .filter((child): child is SnapshotNode => Boolean(child))
        return { ...current, children }
    }
    return keep(node, true, false)
}

/**
 * What a person sees now: the interactive elements and text in the viewport,
 * with refs, so an agent doesn't need a screenshot after scrolling.
 */
export async function describeViewport (session: Session): Promise<string> {
    const [width, height] = await scopeOf(session).execute(() => [window.innerWidth, window.innerHeight]) as [number, number]
    // a report, not a snapshot the user took: `diff` keeps comparing against theirs
    const baseline = session.lastSnapshot
    const { tree } = await takeSnapshot(session, { boxes: true })
    session.lastSnapshot = baseline
    const view = inViewport(tree, width, height)
    if (!view) {
        return ''
    }
    const lines = formatSnapshot(view, { compact: true }).split('\n')
    const out: string[] = []
    let size = 0
    for (const line of lines) {
        if (size + line.length > MAX_IN_VIEW_CHARS) {
            out.push(`… ${lines.length - out.length} more lines in view; \`wdio session find <text>\` or \`snapshot -i\` for the rest.`)
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
    const scope = typeof args.scope === 'string' ? (await resolveTarget(session, args.scope)).element : undefined
    const text = await scopeOf(session).execute(function (root: Element | undefined, limit: number) {
        const start = root || document.querySelector('main, [role="main"], article') || document.body
        const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'CANVAS', 'IFRAME', 'NAV', 'FOOTER', 'ASIDE'])
        const BLOCK = new Set(['P', 'DIV', 'SECTION', 'ARTICLE', 'MAIN', 'HEADER', 'FORM', 'FIELDSET', 'BLOCKQUOTE', 'PRE', 'FIGURE', 'FIGCAPTION', 'DL', 'DT', 'DD', 'ADDRESS'])
        const out: string[] = []
        let size = 0
        let line = ''
        const flush = (prefix = '') => {
            const text = line.replace(/\s+/g, ' ').trim()
            if (text && size < limit) {
                // one long paragraph is cut too, not only the lines after it
                const room = Math.max(0, limit - size - prefix.length)
                const kept = text.length > room ? `${text.slice(0, room)}…` : text
                out.push(prefix + kept)
                size += prefix.length + kept.length + 1
            }
            line = ''
        }
        const hidden = (el: Element) => {
            const style = getComputedStyle(el)
            return style.display === 'none' || style.visibility === 'hidden' || el.getAttribute('aria-hidden') === 'true'
        }
        const walk = (node: Node) => {
            if (size >= limit) {
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
        return { text: out.join('\n'), truncated: size >= limit, from: start === document.body ? 'body' : start.tagName.toLowerCase() }
    }, scope, maxChars) as { text: string, truncated: boolean, from: string }
    if (!text.text) {
        return { text: 'The page has no readable text here. `wdio session snapshot` shows its elements.', data: { chars: 0 } }
    }
    const tail = text.truncated ? `\n… cut at ${maxChars} characters; --max-chars or --scope reads more or a part.` : ''
    return { text: text.text + tail, data: { chars: text.text.length, truncated: text.truncated, from: text.from } }
}

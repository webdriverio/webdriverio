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
    const summary = `Snapshot: ${lines} lines, ${refs} refs, ${text.length} chars → ${file}`
    const inline = !args.fileOnly && text.length <= maxChars
    return {
        text: inline ? text : `${summary}\nUse \`wdio session find <text>\`, --interactive, --depth or --scope to narrow it down.`,
        data: { file, lines, refs, chars: text.length, ...(args.$internal ? { snapshot: text } : {}) },
        files: [file]
    }
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

export const find: ActionFn = async (session, args) => {
    const query = String(args.text ?? '')
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
    const { text: linked } = await takeSnapshot(session, { urls: true })
    const { lines, shown, matches } = matchLines(linked.split('\n'), test)
    session.lastSnapshot = lines.join('\n')
    if (!matches.length) {
        throw new SessionError('NO_MATCH', `No match for ${JSON.stringify(query)}.`, {
            hint: 'Try a shorter text, --regex, or `wdio session snapshot --all` for hidden elements.'
        })
    }
    const out: string[] = []
    let last = -1
    for (const idx of matches) {
        if (idx <= last) {
            continue
        }
        const [blockStart, blockEnd] = lineMode
            ? [Math.max(0, idx - before), Math.min(lines.length - 1, idx + after)]
            : blockAround(lines, idx)
        const start = Math.max(blockStart, last + 1)
        if (last >= 0 && start > last + 1) {
            out.push('--')
        }
        for (let i = start; i <= blockEnd; i++) {
            out.push(`${i + 1}${matches.includes(i) ? ':' : '-'}${shown[i]}`)
        }
        last = blockEnd
    }
    return { text: out.join('\n'), data: { matches: matches.map((i) => ({ line: i + 1, text: lines[i] })) } }
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

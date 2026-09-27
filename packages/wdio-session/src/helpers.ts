import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import logger from '@wdio/logger'

import { stripTypes } from './exec/transform.js'
import type { Session } from './session.js'

const log = logger('@wdio/session:helpers')

const DEBOUNCE_MS = 200
/**
 * macOS can drop a watch event, including one that lands before `fs.watch`
 * is active. The poll stats every file. It re-reads a file when the size,
 * modification time, or status-change time changed, and it also re-reads
 * small files so a same-size edit that keeps both times is still visible.
 * A content edit updates the status-change time even when the modification
 * time is put back, including for a large data file a helper reads. A large
 * helper source is also hashed on a stream, at most once every few seconds.
 * A large file whose size and times are unchanged is not read again.
 */
const POLL_MS = 500
/**
 * A quiet poll re-reads unchanged files synchronously only up to this size.
 */
export const CONTENT_POLL_BYTES = 64 * 1024
/**
 * How often a large helper source is hashed when its size and modification
 * time have not changed. Auxiliary files are not hashed on this cadence.
 */
const LARGE_POLL_MS = 5000

export interface LoadedHelper {
    file: string
    commands: string[]
    error?: string
}

export function helpersDir (cwd: string) {
    return path.join(cwd, '.wdio', 'helpers')
}

/**
 * Compiled copies live beside the helpers directory, not inside it. The
 * watcher watches the helpers directory, so a cache there reloads forever.
 */
function helperCacheDir (cwd: string) {
    return path.join(cwd, '.wdio', 'helper-cache')
}

let generation = 0

function isRelativeSpecifier (spec: string) {
    return spec.startsWith('./') || spec.startsWith('../')
}

/**
 * `from '…'`, `import '…'` or `import('…')` immediately before this quote.
 * Strings and comments are copied as-is, so a mention inside them is ignored.
 */
function importKeyword (code: string, quoteAt: number) {
    let i = quoteAt
    while (i > 0 && /\s/.test(code[i - 1])) {
        i--
    }
    if (i >= 4 && code.slice(i - 4, i) === 'from' && (i === 4 || !/[\w$]/.test(code[i - 5]))) {
        return 'from' as const
    }
    if (code[i - 1] === '(') {
        let j = i - 1
        while (j > 0 && /\s/.test(code[j - 1])) {
            j--
        }
        if (j >= 6 && code.slice(j - 6, j) === 'import' && (j === 6 || !/[\w$]/.test(code[j - 7]))) {
            return 'call' as const
        }
    }
    if (i >= 6 && code.slice(i - 6, i) === 'import' && (i === 6 || !/[\w$]/.test(code[i - 7]))) {
        return 'import' as const
    }
    return undefined
}

function scanQuoted (code: string, start: number) {
    const quote = code[start]
    let i = start + 1
    let interpolated = false
    while (i < code.length) {
        if (code[i] === '\\') {
            i += 2
            continue
        }
        if (quote === '`' && code[i] === '$' && code[i + 1] === '{') {
            interpolated = true
            i += 2
            let depth = 1
            while (i < code.length && depth > 0) {
                if (code[i] === '\'' || code[i] === '"' || code[i] === '`') {
                    i = scanQuoted(code, i).end
                    continue
                }
                if (code[i] === '\\') {
                    i += 2
                    continue
                }
                if (code[i] === '{') {
                    depth++
                } else if (code[i] === '}') {
                    depth--
                }
                if (depth > 0) {
                    i++
                }
            }
            if (code[i] === '}') {
                i++
            }
            continue
        }
        if (code[i] === quote) {
            return { end: i + 1, interpolated }
        }
        i++
    }
    return { end: code.length, interpolated }
}

/**
 * Point relative imports at the helper's directory. A query string keeps a
 * reloaded file out of the module cache. Package specifiers stay bare so
 * Node can resolve them from the project that owns the helper.
 */
export function rewriteRelativeImports (code: string, dir: string, stamp: number | ((spec: string) => string) = Date.now()) {
    const abs = typeof stamp === 'function'
        ? stamp
        : (spec: string) => `${pathToFileURL(path.resolve(dir, spec)).href}?v=${stamp}`
    let out = ''
    let i = 0
    while (i < code.length) {
        const ch = code[i]
        if (ch === '/' && code[i + 1] === '/') {
            const end = code.indexOf('\n', i)
            const stop = end === -1 ? code.length : end
            out += code.slice(i, stop)
            i = stop
            continue
        }
        if (ch === '/' && code[i + 1] === '*') {
            const end = code.indexOf('*/', i + 2)
            const stop = end === -1 ? code.length : end + 2
            out += code.slice(i, stop)
            i = stop
            continue
        }
        if (ch === '\'' || ch === '"' || ch === '`') {
            const scanned = scanQuoted(code, i)
            const literal = code.slice(i, scanned.end)
            const keyword = importKeyword(code, i)
            const spec = literal.slice(1, -1)
            const relative = keyword && !scanned.interpolated && isRelativeSpecifier(spec) && literal.endsWith(ch)
            out += relative ? `${ch}${abs(spec)}${ch}` : literal
            i = scanned.end
            continue
        }
        out += ch
        i++
    }
    return out
}

function isHelperSource (name: string) {
    return /\.(js|mjs|ts)$/.test(name) && !name.endsWith('.d.ts')
}

export function helperSources (cwd: string) {
    const dir = helpersDir(cwd)
    if (!fs.existsSync(dir)) {
        return []
    }
    return fs.readdirSync(dir)
        .filter(isHelperSource)
        .sort()
        .map((name) => path.join(dir, name))
}

function errorLine (err: unknown) {
    const message = (err as Error)?.message || String(err)
    return message.split('\n')[0].replace(/data:text\/javascript\S*/g, '<helper>').slice(0, 500)
}

function forget (session: Session, names: string[]) {
    const proto = Object.getPrototypeOf(session.browser) as Record<string, unknown>
    const own = session.browser as unknown as Record<string, unknown>
    for (const name of names) {
        delete proto[name]
        delete own[name]
    }
}

/**
 * Copy a helper and its relative imports into fresh `.mjs` files. Each
 * reload gets its own directory, which keeps Node from serving the previous
 * module, and the files live in the project so bare specifiers resolve from
 * its `node_modules`.
 */
function materialize (file: string, cacheDir: string, seen = new Map<string, string>()) {
    const abs = path.resolve(file)
    const cached = seen.get(abs)
    if (cached) {
        return cached
    }
    const dest = path.join(cacheDir, `${seen.size}.mjs`)
    const href = pathToFileURL(dest).href
    seen.set(abs, href)
    const raw = fs.readFileSync(abs, 'utf-8')
    const stripped = abs.endsWith('.ts') ? stripTypes(raw) : raw
    const source = rewriteRelativeImports(stripped, path.dirname(abs), (spec) => {
        return materialize(path.resolve(path.dirname(abs), spec), cacheDir, seen)
    })
    fs.writeFileSync(dest, source)
    return href
}

async function importHelper (session: Session, file: string, cacheDir: string, seen: Map<string, string>): Promise<LoadedHelper> {
    const names: string[] = []
    try {
        const href = materialize(file, cacheDir, seen)
        const mod = await import(href)
        const setup = mod.default
        if (typeof setup !== 'function') {
            throw new Error(`${path.basename(file)} must export a default function (browser) => void`)
        }
        const browser = session.browser as WebdriverIO.Browser & {
            addCommand: (name: string, fn: (...args: unknown[]) => unknown, options?: unknown) => void
        }
        const orig = browser.addCommand
        browser.addCommand = (name: string, fn: (...args: unknown[]) => unknown, options?: unknown) => {
            names.push(name)
            return orig.call(browser, name, fn, options)
        }
        try {
            await setup(browser)
        } finally {
            browser.addCommand = orig
        }
        return { file, commands: names }
    } catch (err) {
        return { file, commands: names, error: errorLine(err) }
    }
}

async function reloadNow (session: Session) {
    const previous = session.get<LoadedHelper[]>('helpers') || []
    const previousCache = session.get<string>('helperCache')
    const files = helperSources(session.cwd)
    const loaded: LoadedHelper[] = []
    let cacheDir: string | undefined
    if (files.length) {
        cacheDir = path.join(helperCacheDir(session.cwd), `${Date.now()}-${++generation}`)
        fs.mkdirSync(cacheDir, { recursive: true })
        const seen = new Map<string, string>()
        for (const file of files) {
            loaded.push(await importHelper(session, file, cacheDir, seen))
        }
    }
    const kept = new Set(loaded.flatMap((helper) => helper.commands))
    forget(session, previous.flatMap((helper) => helper.commands).filter((name) => !kept.has(name)))
    session.set('helpers', loaded)
    session.set('helperCache', cacheDir)
    // Drop the previous generation only after the new modules are imported,
    // so a command that still has a dynamic import() can finish.
    if (previousCache && previousCache !== cacheDir) {
        fs.rmSync(previousCache, { recursive: true, force: true })
    }
}

/**
 * Re-import every helper. Overlapping calls (a reload flag racing the
 * watcher) run one after another.
 */
export function reloadHelpers (session: Session) {
    const prev = session.get<Promise<void>>('helpersReload') || Promise.resolve()
    const run = prev.then(() => reloadNow(session), () => reloadNow(session))
    session.set('helpersReload', run.then(() => {}, () => {}))
    return run
}

interface HashedFile {
    mtimeMs: number
    /**
     * Status-change time. A write updates it even when the modification time
     * is restored. On Windows this is the creation time.
     */
    ctimeMs: number
    size: number
    hash: string
    /** The last read failed, so a later event must try this file again. */
    unread?: boolean
}

/**
 * Hash of every file in the helpers directory. A named edit re-reads those
 * files. An event with no filename re-reads the directory, because the size
 * and modification time can stay the same. A poll re-reads small files for
 * the same reason. A larger unchanged helper source is listed in `deferred`
 * so the caller can hash it without blocking. A large data file whose
 * status-change time changed is hashed the same way, not with a synchronous
 * read. It keeps its previous hash while its size and times are unchanged.
 * A file that could not be read keeps its previous hash and is read again on
 * the next pass.
 */
function digestHelpers (dir: string, previous: Map<string, HashedFile>, reread: ReadonlySet<string>, rereadAll = false, unchangedReadLimit = 0) {
    const hash = crypto.createHash('sha1')
    const files = new Map<string, HashedFile>()
    const deferred: string[] = []
    let urgent = false
    let names: string[]
    try {
        names = fs.readdirSync(dir).sort()
    } catch {
        return { stamp: hash.digest('hex'), files, deferred, urgent }
    }
    for (const name of names) {
        const file = path.join(dir, name)
        hash.update(name)
        hash.update('\0')
        let stat: fs.Stats
        try {
            stat = fs.statSync(file)
        } catch {
            hash.update('missing')
            hash.update('\0')
            continue
        }
        if (!stat.isFile()) {
            hash.update('dir')
            hash.update('\0')
            continue
        }
        const prior = previous.get(name)
        const statSame = prior !== undefined && prior.mtimeMs === stat.mtimeMs && prior.ctimeMs === stat.ctimeMs && prior.size === stat.size
        const pollContent = unchangedReadLimit > 0 && stat.size <= unchangedReadLimit
        const overLimit = unchangedReadLimit > 0 && stat.size > unchangedReadLimit
        const forced = rereadAll || prior === undefined || prior.unread || reread.has(name)
        const unchanged = !forced && statSame && !pollContent
        let content: string
        if (prior && overLimit && !forced) {
            content = prior.hash
            if (!statSame) {
                deferred.push(name)
                urgent = true
            } else if (isHelperSource(name)) {
                deferred.push(name)
            }
        } else if (unchanged && prior) {
            content = prior.hash
        } else {
            try {
                content = crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
            } catch (err) {
                log.warn(`Helper file could not be read: ${errorLine(err)}`)
                content = prior?.hash ?? 'unreadable'
                files.set(name, { mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs, size: stat.size, hash: content, unread: true })
                hash.update(content)
                hash.update('\0')
                continue
            }
        }
        files.set(name, { mtimeMs: stat.mtimeMs, ctimeMs: stat.ctimeMs, size: stat.size, hash: content })
        hash.update(content)
        hash.update('\0')
    }
    return { stamp: hash.digest('hex'), files, deferred, urgent }
}

/**
 * Hash a file one chunk at a time, yielding between chunks so a large
 * helper or data file does not stall session commands.
 */
async function hashFileYielding (file: string) {
    const hash = crypto.createHash('sha1')
    const stream = fs.createReadStream(file)
    try {
        for await (const chunk of stream) {
            hash.update(chunk)
            await new Promise((resolve) => setImmediate(resolve))
        }
    } catch (err) {
        stream.destroy()
        throw err
    }
    return hash.digest('hex')
}

function armWatcher (session: Session, dir: string, onChange: (names: ReadonlySet<string>, rereadAll: boolean, unchangedReadLimit?: number) => void) {
    let timer: NodeJS.Timeout | undefined
    let closed = false
    let pending = new Set<string>()
    let unnamed = false
    const watcher = fs.watch(dir, (_event, filename) => {
        if (closed) {
            return
        }
        if (filename) {
            pending.add(path.basename(String(filename)))
        } else {
            unnamed = true
        }
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => {
            const names = pending
            const rereadAll = unnamed
            pending = new Set()
            unnamed = false
            try {
                onChange(names, rereadAll)
            } catch (err) {
                log.warn(`Helper watch failed: ${errorLine(err)}`)
            }
        }, DEBOUNCE_MS)
    })
    const poll = setInterval(() => {
        if (closed) {
            return
        }
        try {
            onChange(new Set(), false, CONTENT_POLL_BYTES)
        } catch (err) {
            log.warn(`Helper watch failed: ${errorLine(err)}`)
        }
    }, POLL_MS)
    poll.unref()
    const close = () => {
        if (closed) {
            return
        }
        closed = true
        clearInterval(poll)
        if (timer) {
            clearTimeout(timer)
        }
        watcher.close()
    }
    watcher.on('error', (err) => log.warn(`Helper watch failed: ${errorLine(err)}`))
    session.disposers.push(close)
    return { close }
}

function watchHelpers (session: Session) {
    if (session.get('helpersWatch')) {
        return
    }
    const dir = helpersDir(session.cwd)
    session.set('helpersWatch', true)
    if (!fs.existsSync(dir)) {
        const parent = path.dirname(dir)
        fs.mkdirSync(parent, { recursive: true })
        const parentWatcher = armWatcher(session, parent, () => {
            if (!fs.existsSync(dir)) {
                return
            }
            parentWatcher.close()
            session.set('helpersWatch', false)
            watchHelpers(session)
            reloadHelpers(session).catch((err) => log.warn(`Helpers failed to reload: ${errorLine(err)}`))
        })
        return
    }
    let tracked = digestHelpers(dir, new Map(), new Set())
    let scanning = false
    let disposed = false
    let lastLargeScan = 0
    session.disposers.push(() => {
        disposed = true
    })
    const apply = (next: ReturnType<typeof digestHelpers>) => {
        const changed = next.stamp !== tracked.stamp
        tracked = next
        if (changed) {
            reloadHelpers(session).catch((err) => log.warn(`Helpers failed to reload: ${errorLine(err)}`))
        }
        return changed
    }
    armWatcher(session, dir, (names, rereadAll, unchangedReadLimit = 0) => {
        if (disposed) {
            return
        }
        /**
         * A quiet poll must not cancel a hash that is still streaming.
         * The next poll used to bump a generation counter and drop that
         * scan, so a file that takes longer than the poll interval to read
         * never finished.
         */
        if (scanning && unchangedReadLimit > 0 && names.size === 0 && !rereadAll) {
            return
        }
        const next = digestHelpers(dir, tracked.files, names, rereadAll, unchangedReadLimit)
        apply(next)
        if (unchangedReadLimit === 0 || next.deferred.length === 0 || scanning || disposed) {
            return
        }
        const now = Date.now()
        if (!next.urgent && now - lastLargeScan < LARGE_POLL_MS) {
            return
        }
        lastLargeScan = now
        const pending = next.deferred.flatMap((name) => {
            const hash = next.files.get(name)?.hash
            return hash === undefined ? [] : [{ name, hash }]
        })
        scanning = true
        void (async () => {
            for (const item of pending) {
                if (disposed) {
                    return
                }
                let nextHash: string
                try {
                    nextHash = await hashFileYielding(path.join(dir, item.name))
                } catch (err) {
                    log.warn(`Helper file could not be read: ${errorLine(err)}`)
                    continue
                }
                if (disposed) {
                    return
                }
                const entry = tracked.files.get(item.name)
                if (!entry || entry.hash !== item.hash || entry.hash === nextHash) {
                    continue
                }
                entry.hash = nextHash
                const refreshed = digestHelpers(dir, tracked.files, new Set(), false, CONTENT_POLL_BYTES)
                if (disposed) {
                    return
                }
                apply(refreshed)
                return
            }
        })().finally(() => {
            scanning = false
        })
    })
}

export async function loadHelpers (session: Session, opts: { watch?: boolean } = {}) {
    await reloadHelpers(session)
    if (opts.watch) {
        watchHelpers(session)
    }
}

export function formatHelpers (helpers: LoadedHelper[]) {
    if (!helpers.length) {
        return 'No helpers.'
    }
    const lines: string[] = []
    for (const helper of helpers) {
        const base = path.basename(helper.file)
        if (helper.error) {
            lines.push(`${base}: ${helper.error}`)
        }
        for (const name of helper.commands) {
            lines.push(`${name} (${base})`)
        }
    }
    return lines.join('\n') || 'No helpers.'
}

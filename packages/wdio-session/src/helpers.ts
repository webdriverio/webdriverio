import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import logger from '@wdio/logger'

import { stripTypes } from './exec/transform.js'
import type { Session } from './session.js'

const log = logger('@wdio/session:helpers')

const DEBOUNCE_MS = 200

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

export function helperSources (cwd: string) {
    const dir = helpersDir(cwd)
    if (!fs.existsSync(dir)) {
        return []
    }
    return fs.readdirSync(dir)
        .filter((name) => /\.(js|mjs|ts)$/.test(name) && !name.endsWith('.d.ts'))
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
    size: number
    hash: string
}

/**
 * Hash of every file in the helpers directory. Files the watcher did not
 * name, and whose size and modification time are unchanged, keep their
 * previous hash so a large data file is not read again.
 */
function digestHelpers (dir: string, previous: Map<string, HashedFile>, reread: ReadonlySet<string>) {
    const hash = crypto.createHash('sha1')
    const files = new Map<string, HashedFile>()
    let names: string[]
    try {
        names = fs.readdirSync(dir).sort()
    } catch {
        return { stamp: hash.digest('hex'), files }
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
        const unchanged = prior !== undefined && prior.mtimeMs === stat.mtimeMs && prior.size === stat.size && !reread.has(name)
        const content = unchanged
            ? prior.hash
            : crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex')
        files.set(name, { mtimeMs: stat.mtimeMs, size: stat.size, hash: content })
        hash.update(content)
        hash.update('\0')
    }
    return { stamp: hash.digest('hex'), files }
}

function armWatcher (session: Session, dir: string, onChange: (names: ReadonlySet<string>) => void) {
    let timer: NodeJS.Timeout | undefined
    let closed = false
    let pending = new Set<string>()
    const watcher = fs.watch(dir, (_event, filename) => {
        if (closed) {
            return
        }
        if (filename) {
            pending.add(path.basename(String(filename)))
        }
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => {
            const names = pending
            pending = new Set()
            onChange(names)
        }, DEBOUNCE_MS)
    })
    const close = () => {
        if (closed) {
            return
        }
        closed = true
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
    armWatcher(session, dir, (names) => {
        const next = digestHelpers(dir, tracked.files, names)
        const changed = next.stamp !== tracked.stamp
        tracked = next
        if (!changed) {
            return
        }
        reloadHelpers(session).catch((err) => log.warn(`Helpers failed to reload: ${errorLine(err)}`))
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

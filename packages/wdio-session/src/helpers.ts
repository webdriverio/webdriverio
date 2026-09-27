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
 * Point relative imports at the helper's directory. A data-URL module has no
 * location of its own, and a query string keeps a reloaded file out of the
 * module cache.
 */
export function rewriteRelativeImports (code: string, dir: string, stamp = Date.now()) {
    const abs = (spec: string) => `${pathToFileURL(path.resolve(dir, spec)).href}?v=${stamp}`
    return code
        .replace(/\bfrom\s+(['"])(\.[^'"]*)\1/g, (_, q, spec) => `from ${q}${abs(spec)}${q}`)
        .replace(/\bimport\s*\(\s*(['"])(\.[^'"]*)\1/g, (_, q, spec) => `import(${q}${abs(spec)}${q}`)
        .replace(/\bimport\s+(['"])(\.[^'"]*)\1/g, (_, q, spec) => `import ${q}${abs(spec)}${q}`)
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

async function importHelper (session: Session, file: string): Promise<LoadedHelper> {
    const names: string[] = []
    try {
        const raw = fs.readFileSync(file, 'utf-8')
        const stripped = file.endsWith('.ts') ? stripTypes(raw) : raw
        const source = rewriteRelativeImports(stripped, path.dirname(file))
        const mod = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`)
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
    forget(session, previous.flatMap((helper) => helper.commands))
    const loaded: LoadedHelper[] = []
    for (const file of helperSources(session.cwd)) {
        loaded.push(await importHelper(session, file))
    }
    session.set('helpers', loaded)
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

function watchHelpers (session: Session) {
    if (session.get('helpersWatch')) {
        return
    }
    const dir = helpersDir(session.cwd)
    if (!fs.existsSync(dir)) {
        return
    }
    let timer: NodeJS.Timeout | undefined
    const watcher = fs.watch(dir, () => {
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => {
            reloadHelpers(session).catch((err) => log.warn(`Helpers failed to reload: ${errorLine(err)}`))
        }, DEBOUNCE_MS)
    })
    watcher.on('error', (err) => log.warn(`Helper watch failed: ${errorLine(err)}`))
    session.set('helpersWatch', true)
    session.disposers.push(() => {
        if (timer) {
            clearTimeout(timer)
        }
        watcher.close()
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

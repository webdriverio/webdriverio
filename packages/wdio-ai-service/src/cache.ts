import fs from 'node:fs/promises'
import path from 'node:path'

import { lock } from 'proper-lockfile'

import type { ActStep, CacheMode } from './types.js'

export const CACHE_VERSION = 1

export interface CacheEntry {
    instruction: string
    /**
     * `web`, `android`, `ios`, `mac` or `windows`
     */
    platform: string
    /**
     * model that recorded the steps
     */
    model?: string
    recordedAt: string
    steps: ActStep[]
}

export interface CacheFile {
    version: number
    entries: Record<string, CacheEntry>
}

export type EffectiveMode = Exclude<CacheMode, 'auto'> | 'record'

/**
 * `auto` is `heal` on CI and `write` locally. `wdio run -s` / `updateSnapshots:
 * 'all'` records every `act` call with the model again.
 */
export function resolveMode (mode: CacheMode = 'auto', { env = process.env, updateSnapshots }: { env?: NodeJS.ProcessEnv, updateSnapshots?: string } = {}): EffectiveMode {
    if (mode === 'off' || mode === 'locked') {
        return mode
    }
    if (updateSnapshots === 'all') {
        return 'record'
    }
    if (mode === 'auto') {
        return env.CI && env.CI !== 'false' && env.CI !== '0' ? 'heal' : 'write'
    }
    return mode
}

/**
 * `<spec dir>/__act__/<spec file>.json` unless `cacheDir` says otherwise
 */
export function cacheFileFor (specPath: string, cacheDir?: string | ((specPath: string) => string)) {
    const dir = typeof cacheDir === 'function'
        ? cacheDir(specPath)
        : cacheDir
            ? path.resolve(cacheDir)
            : path.join(path.dirname(specPath), '__act__')
    return path.join(dir, `${path.basename(specPath)}.json`)
}

/**
 * key of an `act` call: the test title and the position of the call in the
 * test, plus the platform when it is not a web page
 */
export function cacheKey (title: string, index: number, platform = 'web') {
    return `${title} › #${index}${platform === 'web' ? '' : ` (${platform})`}`
}

async function readCacheFile (file: string): Promise<CacheFile> {
    try {
        const parsed = JSON.parse(await fs.readFile(file, 'utf-8')) as CacheFile
        if (parsed.version !== CACHE_VERSION || typeof parsed.entries !== 'object') {
            throw new Error(`[@wdio/ai-service] ${file} has cache version ${parsed.version}, expected ${CACHE_VERSION}. Delete it to record it again.`)
        }
        return parsed
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            return { version: CACHE_VERSION, entries: {} }
        }
        throw err
    }
}

/**
 * Write entries into a cache file. Workers that run the same spec on
 * different capabilities write to the same file: a lock (`proper-lockfile`)
 * makes the read, merge and write of one worker finish before the next
 * starts, so each keeps the other's entries.
 */
export async function writeEntries (file: string, entries: Record<string, CacheEntry>) {
    if (!Object.keys(entries).length) {
        return
    }
    await fs.mkdir(path.dirname(file), { recursive: true })
    const release = await lock(file, {
        realpath: false,
        stale: 10_000,
        retries: { retries: 50, minTimeout: 20, maxTimeout: 500 }
    })
    try {
        const current = await readCacheFile(file)
        const merged = { ...current.entries, ...entries }
        const sorted = Object.fromEntries(Object.keys(merged).sort().map((key) => [key, merged[key]]))
        const tmp = `${file}.${process.pid}.tmp`
        await fs.writeFile(tmp, `${JSON.stringify({ version: CACHE_VERSION, entries: sorted }, null, 4)}\n`)
        await fs.rename(tmp, file)
    } finally {
        await release()
    }
}

/**
 * Where heal mode writes the entries of a cache file: below
 * `<outputDir>/act-cache/` at the cache file's path relative to the
 * project, so specs with the same name in different folders do not
 * overwrite each other.
 */
export function healFileFor (file: string, outputDir: string, root = process.cwd()) {
    const relative = path.relative(root, file)
    const inside = relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    return path.join(outputDir, 'act-cache', inside ? relative : file.replace(/^[a-zA-Z]:/, '').replace(/^[\\/]+/, ''))
}

/**
 * Where a change goes: the cache file, or the heal output that leaves the
 * cache file alone
 */
export type CacheDestination = 'cache' | 'heal'

/**
 * The cache file of one spec: entries read once, changes collected and
 * written at the end of the worker.
 */
export class ActCache {
    readonly file: string
    #entries?: Promise<Record<string, CacheEntry>>
    #changes: Record<CacheDestination, Record<string, CacheEntry>> = { cache: {}, heal: {} }

    constructor (file: string) {
        this.file = file
    }

    async get (key: string): Promise<CacheEntry | undefined> {
        if (!this.#entries) {
            this.#entries = readCacheFile(this.file).then((parsed) => parsed.entries)
        }
        return this.#changes.cache[key] || this.#changes.heal[key] || (await this.#entries)[key]
    }

    /**
     * Record a change. Each change keeps its destination, so a call that
     * overrides the cache mode writes where its own mode says.
     */
    set (key: string, entry: CacheEntry, destination: CacheDestination = 'cache') {
        const other = destination === 'cache' ? 'heal' : 'cache'
        delete this.#changes[other][key]
        this.#changes[destination][key] = entry
    }

    get changes () {
        return { ...this.#changes.heal, ...this.#changes.cache }
    }

    /**
     * write the changes for the cache file to it, and heal changes to `healFile`
     */
    async flush (healFile: string) {
        await writeEntries(this.file, this.#changes.cache)
        await writeEntries(healFile, this.#changes.heal)
        this.#changes = { cache: {}, heal: {} }
    }
}

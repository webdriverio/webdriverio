import fs from 'node:fs/promises'
import path from 'node:path'

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
 * Write entries into a cache file. The file is read again right before, so
 * two workers that run the same spec on different capabilities keep each
 * other's entries.
 */
export async function writeEntries (file: string, entries: Record<string, CacheEntry>) {
    if (!Object.keys(entries).length) {
        return
    }
    const current = await readCacheFile(file)
    const merged = { ...current.entries, ...entries }
    const sorted = Object.fromEntries(Object.keys(merged).sort().map((key) => [key, merged[key]]))
    await fs.mkdir(path.dirname(file), { recursive: true })
    const tmp = `${file}.${process.pid}.tmp`
    await fs.writeFile(tmp, `${JSON.stringify({ version: CACHE_VERSION, entries: sorted }, null, 4)}\n`)
    await fs.rename(tmp, file)
}

/**
 * The cache file of one spec: entries read once, changes collected and
 * written at the end of the worker.
 */
export class ActCache {
    readonly file: string
    #entries?: Promise<Record<string, CacheEntry>>
    #changes: Record<string, CacheEntry> = {}

    constructor (file: string) {
        this.file = file
    }

    async get (key: string): Promise<CacheEntry | undefined> {
        if (!this.#entries) {
            this.#entries = readCacheFile(this.file).then((parsed) => parsed.entries)
        }
        return this.#changes[key] || (await this.#entries)[key]
    }

    set (key: string, entry: CacheEntry) {
        this.#changes[key] = entry
    }

    get changes () {
        return this.#changes
    }

    /**
     * write the changes to the cache file, or to `file` in heal mode
     */
    async flush (file = this.file) {
        await writeEntries(file, this.#changes)
        this.#changes = {}
    }
}

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { ActCache, cacheFileFor, cacheKey, CACHE_VERSION, healFileFor, resolveMode, writeEntries, type CacheEntry } from '../src/cache.js'

const entry = (instruction: string): CacheEntry => ({
    instruction,
    platform: 'web',
    recordedAt: '2026-10-01T12:00:00.000Z',
    steps: [{ action: 'click', args: { target: '#go' }, code: 'await $(\'#go\').click()' }]
})

describe('resolveMode', () => {
    it('is heal on CI and write locally for auto', () => {
        expect(resolveMode('auto', { env: { CI: 'true' } })).toBe('heal')
        expect(resolveMode('auto', { env: {} })).toBe('write')
        expect(resolveMode('auto', { env: { CI: 'false' } })).toBe('write')
        expect(resolveMode(undefined, { env: {} })).toBe('write')
    })

    it('records again with updateSnapshots: all, except when off or locked', () => {
        expect(resolveMode('write', { updateSnapshots: 'all' })).toBe('record')
        expect(resolveMode('auto', { env: { CI: '1' }, updateSnapshots: 'all' })).toBe('record')
        expect(resolveMode('locked', { updateSnapshots: 'all' })).toBe('locked')
        expect(resolveMode('off', { updateSnapshots: 'all' })).toBe('off')
        expect(resolveMode('heal', { updateSnapshots: 'new' })).toBe('heal')
    })
})

describe('cacheFileFor and cacheKey', () => {
    it('puts the cache next to the spec unless cacheDir says otherwise', () => {
        expect(cacheFileFor('/project/test/cart.e2e.ts')).toBe('/project/test/__act__/cart.e2e.ts.json')
        expect(cacheFileFor('/project/test/cart.e2e.ts', '/project/.wdio/act')).toBe('/project/.wdio/act/cart.e2e.ts.json')
        expect(cacheFileFor('/project/test/cart.e2e.ts', (spec) => path.join(path.dirname(spec), 'cache'))).toBe('/project/test/cache/cart.e2e.ts.json')
    })

    it('keys a call by test title and position, and the platform when it is not web', () => {
        expect(cacheKey('cart adds a shirt', 1)).toBe('cart adds a shirt › #1')
        expect(cacheKey('cart adds a shirt', 2, 'android')).toBe('cart adds a shirt › #2 (android)')
    })
})

describe('ActCache', () => {
    const dirs: string[] = []
    const tmpFile = () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-act-cache-'))
        dirs.push(dir)
        return path.join(dir, '__act__', 'cart.e2e.ts.json')
    }

    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('reads nothing from a missing file and writes changes on flush', async () => {
        const file = tmpFile()
        const cache = new ActCache(file)
        expect(await cache.get('a › #1')).toBeUndefined()
        cache.set('a › #1', entry('Add a shirt'))
        expect(await cache.get('a › #1')).toEqual(entry('Add a shirt'))
        await cache.flush()
        expect(JSON.parse(fs.readFileSync(file, 'utf-8'))).toEqual({ version: CACHE_VERSION, entries: { 'a › #1': entry('Add a shirt') } })
        expect(cache.changes).toEqual({})
    })

    it('keeps entries another worker wrote in the meantime and sorts the keys', async () => {
        const file = tmpFile()
        const cache = new ActCache(file)
        await cache.get('b › #1')
        await writeEntries(file, { 'c › #1': entry('From another worker') })
        cache.set('b › #1', entry('Mine'))
        await cache.flush()
        const written = JSON.parse(fs.readFileSync(file, 'utf-8'))
        expect(Object.keys(written.entries)).toEqual(['b › #1', 'c › #1'])
    })

    it('writes each change to its destination: the cache file or the heal output', async () => {
        const file = tmpFile()
        const cache = new ActCache(file)
        cache.set('a › #1', entry('Healed'), 'heal')
        cache.set('b › #1', entry('Recorded'))
        const healed = path.join(path.dirname(path.dirname(file)), 'logs', 'act-cache', 'cart.e2e.ts.json')
        await cache.flush(healed)
        expect(Object.keys(JSON.parse(fs.readFileSync(file, 'utf-8')).entries)).toEqual(['b › #1'])
        expect(Object.keys(JSON.parse(fs.readFileSync(healed, 'utf-8')).entries)).toEqual(['a › #1'])
    })

    it('keeps the entries of workers that write the same file at the same time', async () => {
        const file = tmpFile()
        const workers = Array.from({ length: 5 }, (_, i) => {
            const cache = new ActCache(file)
            cache.set(`worker ${i} › #1`, entry(`Step of worker ${i}`))
            return cache
        })
        await Promise.all(workers.map((cache) => cache.flush(`${file}.heal.json`)))
        expect(Object.keys(JSON.parse(fs.readFileSync(file, 'utf-8')).entries)).toHaveLength(5)
    })

    it('keeps the path of the cache file in the heal output', () => {
        expect(healFileFor('/project/test/a/__act__/login.e2e.ts.json', '/project/logs', '/project'))
            .toBe(path.join('/project/logs', 'act-cache', 'test/a/__act__/login.e2e.ts.json'))
        expect(healFileFor('/project/test/b/__act__/login.e2e.ts.json', '/project/logs', '/project'))
            .toBe(path.join('/project/logs', 'act-cache', 'test/b/__act__/login.e2e.ts.json'))
        expect(healFileFor('/elsewhere/__act__/login.e2e.ts.json', '/project/logs', '/project'))
            .toBe(path.join('/project/logs', 'act-cache', 'elsewhere/__act__/login.e2e.ts.json'))
    })

    it('rejects a cache file of another version', async () => {
        const file = tmpFile()
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, JSON.stringify({ version: 99, entries: {} }))
        await expect(new ActCache(file).get('a')).rejects.toThrow('has cache version 99, expected 1. Delete it to record it again.')
    })
})

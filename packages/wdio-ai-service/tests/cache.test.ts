import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { ActCache, cacheFileFor, cacheKey, CACHE_VERSION, resolveMode, writeEntries, type CacheEntry } from '../src/cache.js'

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

    it('writes the changes to another file in heal mode', async () => {
        const file = tmpFile()
        const cache = new ActCache(file)
        cache.set('a › #1', entry('Healed'))
        const healed = path.join(path.dirname(path.dirname(file)), 'logs', 'act-cache', 'cart.e2e.ts.json')
        await cache.flush(healed)
        expect(fs.existsSync(file)).toBe(false)
        expect(JSON.parse(fs.readFileSync(healed, 'utf-8')).entries['a › #1'].instruction).toBe('Healed')
    })

    it('rejects a cache file of another version', async () => {
        const file = tmpFile()
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, JSON.stringify({ version: 99, entries: {} }))
        await expect(new ActCache(file).get('a')).rejects.toThrow('has cache version 99, expected 1. Delete it to record it again.')
    })
})

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { formatSummary, readRecords, writeRecords, type ActRecord } from '../src/stats.js'

const record = (partial: Partial<ActRecord>): ActRecord => ({
    spec: '/project/test/cart.e2e.ts',
    test: 'cart adds a shirt',
    instruction: 'Add a shirt',
    source: 'cache',
    usage: { input: 0, output: 0 },
    durationMs: 10,
    ...partial
})

describe('formatSummary', () => {
    it('counts calls by outcome, sums tokens and lists every heal', () => {
        const summary = formatSummary([
            record({}),
            record({ instruction: 'Open the menu' }),
            record({ healed: 'cache', healedSteps: [{ index: 1, from: '[data-testid="add"]', to: 'role/button[name="Add to cart"]' }] }),
            record({ source: 'model', healed: 'model', instruction: 'Check out', usage: { input: 2000, output: 300 } }),
            record({ source: 'model', instruction: 'Log in', usage: { input: 900, output: 100 } }),
            record({ source: 'model', instruction: 'Pay', error: 'act("Pay") failed: no card form', usage: { input: 50, output: 5 } })
        ], { mode: 'heal', outputDir: '/project/logs' })

        expect(summary.split('\n')).toEqual([
            '@wdio/ai-service: 6 act calls · 2 from cache · 1 healed without the model · 1 healed by the model · 1 recorded by the model · 1 failed · 3.4k tokens',
            'Healed:',
            '  cart.e2e.ts › cart adds a shirt "Add a shirt": step 2 [data-testid="add"] → role/button[name="Add to cart"] (without the model)',
            '  cart.e2e.ts › cart adds a shirt "Check out": continued by the model',
            'Updated cache entries: /project/logs/act-cache'
        ])
    })

    it('asks to commit the cache in write mode and prints nothing without calls', () => {
        expect(formatSummary([record({ source: 'model' })], { mode: 'write' }))
            .toContain('Cache files changed, review and commit the __act__ directories.')
        expect(formatSummary([record({})], { mode: 'write' })).not.toContain('Cache files changed')
        expect(formatSummary([])).toBe('')
    })
})

describe('writeRecords and readRecords', () => {
    it('collects the records of every worker', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-records-'))
        await writeRecords([record({ instruction: 'a' })], dir)
        await writeRecords([record({ instruction: 'b' }), record({ instruction: 'c' })], dir)
        await writeRecords([], dir)
        expect((await readRecords(dir)).map((r) => r.instruction).sort()).toEqual(['a', 'b', 'c'])
        expect(await readRecords(path.join(dir, 'missing'))).toEqual([])
        fs.rmSync(dir, { recursive: true, force: true })
    })
})

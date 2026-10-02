import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { runCli } from '../src/cli.js'
import { codeWithValues, eject, findActCalls } from '../src/eject.js'
import type { CacheEntry, CacheFile } from '../src/cache.js'

const entry = (instruction: string, codes: string[]): CacheEntry => ({
    instruction,
    platform: 'web',
    recordedAt: '2026-10-01T12:00:00.000Z',
    steps: codes.map((code) => ({ action: 'click', args: {}, code }))
})

const SPEC = `describe('shop', () => {
    it('adds a shirt', async () => {
        await browser.url('/shop')
        await browser.act('Add a blue shirt to the cart')
        await expect($('#count')).toHaveText('1')
    })

    it('logs in', async () => {
        await $('form#login').act('Log in as {{email}} with {{password}}', {
            values: { email: process.env.SHOP_USER!, password: process.env.SHOP_PASS! }
        })
        await browser.act(\`Open the "account" menu\`, { id: 'menu' })
        await browser.act(instruction)
    })
})
`

const CACHE: CacheFile = {
    version: 1,
    entries: {
        'shop adds a shirt › #1': entry('Add a blue shirt to the cart', [
            'await $(\'role/link[name="Blue Shirt"]\').click()',
            'await $(\'role/button[name="Add to cart"]\').click()'
        ]),
        'shop logs in › #1': entry('Log in as {{email}} with {{password}}', [
            'await $(\'#email\').setValue(\'{{email}}\')',
            'await $(\'#password\').setValue(\'{{password}}\')',
            'await $(\'role/button[name="Sign in"]\').click()'
        ]),
        menu: entry('Open the "account" menu', ['await $(\'role/button[name="Account"]\').click()'])
    }
}

describe('findActCalls', () => {
    it('finds act calls with their test, position and options', () => {
        const calls = findActCalls(SPEC)
        expect(calls.map(({ instruction, id, values, indent, test, position, statement }) => ({ instruction, id, values, indent, test, position, statement }))).toEqual([
            { instruction: 'Add a blue shirt to the cart', id: undefined, values: undefined, indent: '        ', test: 'shop adds a shirt', position: 1, statement: true },
            { instruction: 'Log in as {{email}} with {{password}}', id: undefined, values: '{ email: process.env.SHOP_USER!, password: process.env.SHOP_PASS! }', indent: '        ', test: 'shop logs in', position: 1, statement: true },
            { instruction: 'Open the "account" menu', id: 'menu', values: undefined, indent: '        ', test: 'shop logs in', position: 2, statement: true },
            { instruction: undefined, id: undefined, values: undefined, indent: '        ', test: 'shop logs in', position: 3, statement: true }
        ])
    })

    it('has no position for calls in or after a branch, a loop or a callback', () => {
        const calls = findActCalls(`describe('cart', () => {
    it('adds items', async () => {
        await browser.act('Open the shop')
        for (const item of items) {
            await browser.act('Add the item')
        }
        await browser.act('Check out')
    })
    it(name, async () => {
        await browser.act('Open the shop')
    })
})`)
        expect(calls.map(({ instruction, test, position }) => ({ instruction, test, position }))).toEqual([
            { instruction: 'Open the shop', test: 'cart adds items', position: 1 },
            { instruction: 'Add the item', test: 'cart adds items', position: undefined },
            { instruction: 'Check out', test: 'cart adds items', position: undefined },
            { instruction: 'Open the shop', test: undefined, position: 1 }
        ])
    })
})

describe('codeWithValues', () => {
    it('keeps backticks and ${ of the recorded text as plain text', () => {
        expect(codeWithValues('await $(\'#q\').setValue(\'{{name}} costs ${price} `now`\')'))
            .toBe('await $(\'#q\').setValue(`${values["name"]} costs \\${price} \\`now\\``)')
    })

    it('turns placeholders into value expressions', () => {
        expect(codeWithValues('await $(\'#email\').setValue(\'{{email}}\')')).toBe('await $(\'#email\').setValue(values["email"])')
        expect(codeWithValues('await $(\'#q\').setValue(\'Hello {{name}}!\')')).toBe('await $(\'#q\').setValue(`Hello ${values["name"]}!`)')
        expect(codeWithValues('await $(\'#go\').click()')).toBe('await $(\'#go\').click()')
    })
})

describe('eject', () => {
    it('replaces act calls with the recorded code and keeps the instruction as a comment', () => {
        const result = eject(SPEC, CACHE)
        expect(result.ejected).toEqual([
            { instruction: 'Add a blue shirt to the cart', steps: 2 },
            { instruction: 'Log in as {{email}} with {{password}}', steps: 3 },
            { instruction: 'Open the "account" menu', steps: 1 }
        ])
        expect(result.source).toContain([
            '        // act: Add a blue shirt to the cart',
            '        await $(\'role/link[name="Blue Shirt"]\').click()',
            '        await $(\'role/button[name="Add to cart"]\').click()',
            '        await expect($(\'#count\')).toHaveText(\'1\')'
        ].join('\n'))
        expect(result.source).toContain([
            '        {',
            '            // act: Log in as {{email}} with {{password}}',
            '            const values = { email: process.env.SHOP_USER!, password: process.env.SHOP_PASS! }',
            '            await $(\'#email\').setValue(values["email"])',
            '            await $(\'#password\').setValue(values["password"])',
            '            await $(\'role/button[name="Sign in"]\').click()',
            '        }'
        ].join('\n'))
        expect(result.source).toContain('        await browser.act(instruction)')
        expect(result.source).not.toContain('.act(\'Add a blue shirt')
    })

    it('uses the steps of exactly that call and leaves other calls with the same instruction alone', () => {
        const spec = `describe('shop', () => {
    it('adds a shirt', async () => {
        await browser.act('Add a blue shirt to the cart')
    })
    it('adds another shirt', async () => {
        await browser.act('Add a blue shirt to the cart')
    })
})
`
        const cache: CacheFile = { version: 1, entries: { 'shop adds a shirt › #1': entry('Add a blue shirt to the cart', ['await $(\'#a\').click()']) } }
        const result = eject(spec, cache)
        expect(result.ejected).toEqual([{ instruction: 'Add a blue shirt to the cart', steps: 1 }])
        expect(result.skipped).toEqual([{ instruction: 'Add a blue shirt to the cart', reason: 'no cached steps, run the test once to record them' }])
        expect(result.source.match(/#a/g)).toHaveLength(1)
        expect(result.source).toContain('    it(\'adds another shirt\', async () => {\n        await browser.act(\'Add a blue shirt to the cart\')')
    })

    it('skips a call whose cached entry is for another instruction, or that has no fixed position', () => {
        const spec = `describe('shop', () => {
    it('adds a shirt', async () => {
        await browser.act('Add a red shirt to the cart')
        if (sale) {
            await browser.act('Apply the coupon')
        }
    })
})
`
        const cache: CacheFile = { version: 1, entries: { 'shop adds a shirt › #1': entry('Add a blue shirt to the cart', ['await $(\'#a\').click()']) } }
        expect(eject(spec, cache).skipped).toEqual([
            { instruction: 'Add a red shirt to the cart', reason: 'the steps cached as "shop adds a shirt › #1" are for "Add a blue shirt to the cart", run the test again to record this call' },
            { instruction: 'Apply the coupon', reason: 'the call has no fixed position in a test with a plain string title, pass `id` to the call' }
        ])
    })

    it('only rewrites the calls of the test passed with --test', () => {
        const result = eject(SPEC, CACHE, { test: 'shop logs in' })
        expect(result.ejected.map(({ instruction }) => instruction)).toEqual(['Log in as {{email}} with {{password}}', 'Open the "account" menu'])
        expect(result.source).toContain('await browser.act(\'Add a blue shirt to the cart\')')
    })
})

describe('wdio-ai eject', () => {
    function project () {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-ai-eject-'))
        const spec = path.join(dir, 'shop.e2e.ts')
        fs.writeFileSync(spec, SPEC)
        fs.mkdirSync(path.join(dir, '__act__'))
        fs.writeFileSync(path.join(dir, '__act__', 'shop.e2e.ts.json'), JSON.stringify(CACHE))
        return { dir, spec }
    }

    it('rewrites the spec and reports every call', async () => {
        const { dir, spec } = project()
        const lines: string[] = []
        expect(await runCli(['eject', spec], (line) => lines.push(line))).toBe(0)
        expect(lines).toEqual([
            `${spec}: ejected "Add a blue shirt to the cart" (2 steps)`,
            `${spec}: ejected "Log in as {{email}} with {{password}}" (3 steps)`,
            `${spec}: ejected "Open the "account" menu" (1 step)`
        ])
        expect(fs.readFileSync(spec, 'utf-8')).toContain('// act: Add a blue shirt to the cart')
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('prints instead of writing with --dry-run', async () => {
        const { dir, spec } = project()
        const lines: string[] = []
        expect(await runCli(['eject', spec, '--dry-run'], (line) => lines.push(line))).toBe(0)
        expect(lines.at(-1)).toContain('// act: Add a blue shirt to the cart')
        expect(fs.readFileSync(spec, 'utf-8')).toBe(SPEC)
        fs.rmSync(dir, { recursive: true, force: true })
    })

    it('fails without a cache file and prints the usage for unknown commands', async () => {
        const lines: string[] = []
        expect(await runCli(['eject', '/nowhere/missing.e2e.ts'], (line) => lines.push(line))).toBe(1)
        expect(lines[0]).toContain('no cache file at')
        expect(await runCli(['record'], (line) => lines.push(line))).toBe(1)
        expect(await runCli(['--help'], (line) => lines.push(line))).toBe(0)
        expect(lines.at(-1)).toContain('Usage: wdio-ai eject')
    })
})

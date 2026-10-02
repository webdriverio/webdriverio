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
    it('finds single and multi-line act statements with a literal instruction', () => {
        const calls = findActCalls(SPEC)
        expect(calls.map(({ instruction, id, values, indent }) => ({ instruction, id, values, indent }))).toEqual([
            { instruction: 'Add a blue shirt to the cart', id: undefined, values: undefined, indent: '        ' },
            { instruction: 'Log in as {{email}} with {{password}}', id: undefined, values: '{ email: process.env.SHOP_USER!, password: process.env.SHOP_PASS! }', indent: '        ' },
            { instruction: 'Open the "account" menu', id: 'menu', values: undefined, indent: '        ' }
        ])
    })

    it('leaves out instructions that are not plain strings', () => {
        expect(findActCalls('await browser.act(`Add ${item}`)\nawait browser.act(instruction)')).toEqual([])
    })
})

describe('codeWithValues', () => {
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

    it('leaves out steps without code, e.g. moving back to the top document', () => {
        const result = eject("        await browser.act('Pay')\n", {
            version: 1,
            entries: {
                pay: entry('Pay', [
                    'const frame = await page.frame(page.$(\'aria/Payment\'))',
                    'await frame.$(\'role/button[name="Pay now"]\').click()',
                    ''
                ])
            }
        })
        expect(result.source).toBe([
            '        // act: Pay',
            '        const frame = await page.frame(page.$(\'aria/Payment\'))',
            '        await frame.$(\'role/button[name="Pay now"]\').click()',
            ''
        ].join('\n'))
    })

    it('skips calls without cached steps or with different steps in several tests', () => {
        const cache: CacheFile = {
            version: 1,
            entries: {
                'a › #1': entry('Add a blue shirt to the cart', ['await $(\'#a\').click()']),
                'b › #1': entry('Add a blue shirt to the cart', ['await $(\'#b\').click()'])
            }
        }
        const result = eject(SPEC, cache)
        expect(result.ejected).toEqual([])
        expect(result.skipped).toEqual([
            { instruction: 'Add a blue shirt to the cart', reason: 'recorded with different steps in several tests, pass `id` or `--test`' },
            { instruction: 'Log in as {{email}} with {{password}}', reason: 'no cached steps, run the test once to record them' },
            { instruction: 'Open the "account" menu', reason: 'no cached steps, run the test once to record them' }
        ])

        const filtered = eject(SPEC, cache, { test: 'b' })
        expect(filtered.ejected).toEqual([{ instruction: 'Add a blue shirt to the cart', steps: 1 }])
        expect(filtered.source).toContain('await $(\'#b\').click()')
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

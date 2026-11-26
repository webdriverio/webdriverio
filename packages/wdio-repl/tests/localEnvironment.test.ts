import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import WDIORepl, { createReplContext, formatReplResult } from '../src/index.js'

function evalCmd (repl: WDIORepl, cmd: string, context: Record<string, unknown>, filename?: string) {
    return new Promise<unknown>((resolve, reject) => {
        repl.eval(cmd, context, filename, (err, result) => {
            if (err) {
                reject(err)
                return
            }
            resolve(result)
        })
    })
}

describe('WDIORepl local environment access', () => {
    let tmpDir: string

    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-repl-local-env-'))
    })

    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true })
    })

    it('exposes Node.js runtime globals while preserving VM intrinsics and outer global isolation', async () => {
        const repl = new WDIORepl({ baseDir: tmpDir })
        const context = createReplContext({}, { baseDir: tmpDir })

        expect(await evalCmd(repl, 'typeof process.cwd', context)).toBe('function')
        expect(await evalCmd(repl, 'typeof console.log', context)).toBe('function')
        expect(await evalCmd(repl, 'Buffer.from("wdio").toString("utf8")', context)).toBe('wdio')
        expect(await evalCmd(repl, 'new URL("https://webdriver.io/docs").pathname', context)).toBe('/docs')
        expect(await evalCmd(repl, 'typeof setTimeout', context)).toBe('function')
        expect(await evalCmd(repl, 'typeof fetch', context)).toBe('function')
        expect(await evalCmd(repl, 'typeof crypto.randomUUID()', context)).toBe('string')
        expect(await evalCmd(repl, 'typeof performance.now()', context)).toBe('number')
        expect(await evalCmd(repl, '[] instanceof Array', context)).toBe(true)
        expect(await evalCmd(repl, 'new Error("x") instanceof Error', context)).toBe(true)
        expect(await evalCmd(repl, 'global === globalThis && globalThis === this', context)).toBe(true)

        await evalCmd(repl, 'global.__wdioReplLocalOnly = 123; performance = 456', context)
        expect(await evalCmd(repl, 'global.__wdioReplLocalOnly', context)).toBe(123)
        expect(await evalCmd(repl, 'performance', context)).toBe(456)
        expect('__wdioReplLocalOnly' in globalThis).toBe(false)
        expect(typeof globalThis.performance.now).toBe('function')
    })

    it('inherits custom globals from globalThis and gives caller locals precedence including getters', async () => {
        const g = globalThis as Record<string, unknown>
        g.__wdioInheritedGlobal = 'from-global'
        g.__wdioOverriddenGlobal = 'global-value'

        let counter = 1
        const locals = {
            __wdioOverriddenGlobal: 'local-value',
            loginPage: {
                submit: () => 'submitted'
            },
            get count () {
                return counter
            }
        }

        try {
            const repl = new WDIORepl({ baseDir: tmpDir })
            const context = createReplContext(locals, { baseDir: tmpDir })

            expect(await evalCmd(repl, '__wdioInheritedGlobal', context)).toBe('from-global')
            expect(await evalCmd(repl, '__wdioOverriddenGlobal', context)).toBe('local-value')
            expect(await evalCmd(repl, 'loginPage.submit()', context)).toBe('submitted')
            expect(await evalCmd(repl, 'count', context)).toBe(1)

            counter = 2
            expect(await evalCmd(repl, 'count', context)).toBe(2)
        } finally {
            delete g.__wdioInheritedGlobal
            delete g.__wdioOverriddenGlobal
        }
    })

    it('loads and reloads local CommonJS modules via require() and persists bindings across commands', async () => {
        const pageFile = path.join(tmpDir, 'login.page.cjs')
        await fs.writeFile(pageFile, 'module.exports = { version: 1, open: () => "v1" }\n', 'utf-8')

        const repl = new WDIORepl({ baseDir: tmpDir })
        const context = createReplContext({}, { baseDir: tmpDir })

        await evalCmd(repl, 'var page = require("./login.page.cjs")', context)
        expect(await evalCmd(repl, 'page.open()', context)).toBe('v1')

        await fs.writeFile(pageFile, 'module.exports = { version: 2, open: () => "v2" }\n', 'utf-8')
        await evalCmd(repl, 'delete require.cache[require.resolve("./login.page.cjs")]', context)
        await evalCmd(repl, 'page = require("./login.page.cjs")', context)
        expect(await evalCmd(repl, 'page.open()', context)).toBe('v2')
        expect(await evalCmd(repl, 'page.version', context)).toBe(2)
    })

    it('loads and reloads local ESM modules via dynamic import() even with synthetic REPL filenames', async () => {
        const pageFile = path.join(tmpDir, 'dashboard.page.mjs')
        await fs.writeFile(pageFile, 'export const version = 1; export default { title: () => "dash-v1" }\n', 'utf-8')

        const repl = new WDIORepl({ baseDir: tmpDir })
        const context = createReplContext({}, { baseDir: tmpDir })

        expect(
            await evalCmd(repl, 'import("./dashboard.page.mjs").then((m) => m.default.title())', context, 'REPL1')
        ).toBe('dash-v1')

        await fs.writeFile(pageFile, 'export const version = 2; export default { title: () => "dash-v2" }\n', 'utf-8')
        expect(
            await evalCmd(repl, 'import("./dashboard.page.mjs?reload=2").then((m) => m.default.title())', context, 'REPL2')
        ).toBe('dash-v2')

        expect(
            await evalCmd(repl, 'import("node:path").then((m) => typeof m.join)', context, 'REPL3')
        ).toBe('function')

        await expect(
            evalCmd(repl, 'import("./does-not-exist.mjs")', context, 'REPL4')
        ).rejects.toThrow()
        expect(await evalCmd(repl, '1 + 2', context, 'REPL5')).toBe(3)
    })

    it('persists lexical bindings and class instances across commands without leaking to globalThis', async () => {
        const repl = new WDIORepl({ baseDir: tmpDir })
        const context = createReplContext({}, { baseDir: tmpDir })

        await evalCmd(repl, 'class Page { greet() { return "hi" } }', context)
        await evalCmd(repl, 'const p = new Page(); let count = 1', context)
        expect(await evalCmd(repl, 'p.greet()', context)).toBe('hi')
        expect(await evalCmd(repl, '++count', context)).toBe(2)
        expect('Page' in globalThis).toBe(false)
        expect('p' in globalThis).toBe(false)
    })

    it('formats circular objects and BigInt values safely for IPC fallback', () => {
        const circular: Record<string, unknown> = { name: 'page' }
        circular.self = circular

        const formattedCircular = formatReplResult(circular)
        expect(formattedCircular).toContain('page')
        expect(formattedCircular).toContain('Circular')

        expect(formatReplResult(42n)).toBe('42n')
    })
})

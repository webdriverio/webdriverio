import path from 'node:path'
import vm from 'node:vm'
import { describe, it, expect } from 'vitest'

import { transform } from '../../src/exec/transform.js'

/**
 * run transformed code the way the exec action does
 */
async function run (source: string, context = vm.createContext({ __wdioImport: (s: string) => import(s) })) {
    const { code } = transform(source)
    const value = await new vm.Script(`(async () => {${code}\n})()`).runInContext(context)
    return { value, context }
}

describe('exec transform', () => {
    it('returns the last expression', async () => {
        expect(transform('1 + 1').code).toBe('return (1 + 1);')
        expect(transform('const a = 1\na * 3;').code).toBe('globalThis.a = 1\nreturn (a * 3);')
        expect((await run('const x = [1, 2]\nx.map((n) => n * 2)')).value).toEqual([2, 4])
        expect((await run('if (true) { 1 }')).value).toBe(undefined)
    })

    it('persists declarations across calls', async () => {
        const { context } = await run(`
            const a = 1, b = 2
            let c
            var d
            const { e, f: [g], ...rest } = { e: 3, f: [4], h: 5 }
            function add (x, y) { return x + y }
            class Counter { constructor () { this.n = add(a, b) } }
        `)
        expect((await run('[a, b, c, d, e, g, rest.h, add(1, 2), new Counter().n]', context)).value).toEqual([1, 2, undefined, undefined, 3, 4, 5, 3, 3])
        expect((await run('const a2 = a + 1', context)).value).toBe(undefined)
        expect((await run('a2', context)).value).toBe(2)
    })

    it('hoists function declarations', async () => {
        expect((await run('twice(2)\nfunction twice (n) { return n * 2 }')).value).toBe(undefined)
        expect((await run('const r = twice(2)\nfunction twice (n) { return n * 2 }\nr')).value).toBe(4)
    })

    it('keeps `var` values when redeclared without initializer', async () => {
        const { context } = await run('var v = 5')
        expect((await run('var v\nv', context)).value).toBe(5)
    })

    it('rewrites static and dynamic imports', async () => {
        expect(transform("import fs from 'node:fs'").code).toBe("const __wdioModule0 = await __wdioImport('node:fs'); globalThis.fs = __wdioModule0.default;")
        expect(transform("import * as p from 'node:path'\nimport { join as j, sep } from 'node:path'\nimport 'x'").code).toBe([
            "const __wdioModule0 = await __wdioImport('node:path'); globalThis.p = __wdioModule0;",
            "const __wdioModule1 = await __wdioImport('node:path'); globalThis.j = __wdioModule1[\"join\"]; globalThis.sep = __wdioModule1[\"sep\"];",
            "await __wdioImport('x');"
        ].join('\n'))
        expect(transform("const m = await import('node:os')").code).toBe("globalThis.m = await __wdioImport('node:os')")
        expect(transform("(await import('node:os')).EOL").code).toBe("return ((await __wdioImport('node:os')).EOL);")
        const { value } = await run("import { join } from 'node:path'\njoin('a', 'b')")
        expect(value).toBe(path.join('a', 'b'))
    })

    it('strips TypeScript annotations', async () => {
        expect((await run('const n: number = 2\nfunction sq (x: number): number { return x * x }\nsq(n) as number')).value).toBe(4)
        expect((await run('interface A { a: string }\ntype B = A\nconst v = { a: "x" } satisfies B\nv.a')).value).toBe('x')
    })

    it('reports syntax errors with the position in the submitted code', () => {
        expect(() => transform('const x = 1\nfoo(')).toThrow(expect.objectContaining({ code: 'EXEC_ERROR', message: 'SyntaxError: Unexpected token (line 2:5)' }))
        expect(() => transform('let = ;')).toThrow(/SyntaxError: .* \(line 1:\d+\)/)
    })

    it('supports top-level await and return', async () => {
        expect((await run('await Promise.resolve(1)\nreturn 7')).value).toBe(7)
    })

    it('warns about WebdriverIO calls without await', () => {
        const { warnings } = transform([
            "$('a').click()",
            'await browser.url("x")',
            'browser.pause(1).then(() => {})',
            'console.log(1)',
            "$$('li')[0].click()",
            "$('h1').getText()"
        ].join('\n'))
        expect(warnings).toEqual([
            'warn: line 1: WebdriverIO commands are async, add await',
            'warn: line 3: WebdriverIO commands are async, add await',
            'warn: line 5: WebdriverIO commands are async, add await'
        ])
    })

    it('flags read-only code', () => {
        for (const code of ["await $('h1').getText()", 'await browser.getTitle()', "$('h1')", "await $$('li')", 'browser.sessionId', 'x', "await $('a').isDisplayed()"]) {
            expect(transform(code).readOnly, code).toBe(true)
        }
        for (const code of ["await $('a').click()", 'await browser.url("/")', "const t = await $('h1').getText()", "await $('h1').getText()\nawait $('a').click()", 'await foo.getBar()']) {
            expect(transform(code).readOnly, code).toBe(false)
        }
    })
})

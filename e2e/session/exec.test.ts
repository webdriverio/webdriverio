import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio session exec', () => {
    let server: FixtureServer
    let project: Project

    beforeAll(async () => {
        server = await startServer()
        project = createProject('exec')
        const open = await project.run(['open', 'chrome', `${server.url}/index.html`])
        expect(open.code, open.stderr).toBe(0)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('prints the value of the last expression', async () => {
        expect(await project.run(['exec', '-e', '1 + 1'])).toMatchObject({ code: 0, stdout: '2\n' })
        expect((await project.run(['exec', '-e', 'await browser.getTitle()'])).stdout).toBe('Session Fixture\n')
        expect((await project.run(['exec', '-e', 'return { a: [1, 2] }'])).stdout).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}\n')
    })

    it('prints the text of an un-awaited trailing command', async () => {
        expect((await project.run(['exec', '-e', "$('h1').getText()"])).stdout).toBe('Welcome\n')
    })

    it('keeps console output in order with warn/error prefixes', async () => {
        const res = await project.run(['exec', '-e', "console.log('one'); console.warn('two'); console.error('three'); console.info({ n: 4 }); 'done'"])
        expect(res.stdout).toBe('one\nwarn: two\nerror: three\n{ n: 4 }\ndone\n')
    })

    it('reads code from stdin, from a file and from -e', async () => {
        const piped = await project.run([], { stdin: "const h = await $('h1')\nawait h.getText()\n" })
        expect(piped).toMatchObject({ code: 0, stdout: 'Welcome\n' })
        const file = path.join(project.dir, 'script.ts')
        fs.writeFileSync(file, 'const title: string = await browser.getTitle()\nconst upper = (s: string): string => s.toUpperCase()\nupper(title)\n')
        expect(await project.run(['exec', 'script.ts'])).toMatchObject({ code: 0, stdout: 'SESSION FIXTURE\n' })
        expect(await project.run(['exec', '-e', 'const n: number = 41\nn + 1'])).toMatchObject({ code: 0, stdout: '42\n' })
    })

    it('persists variables between calls', async () => {
        expect((await project.run(['exec', '-e', 'const x = 1'])).stdout).toBe('')
        expect((await project.run(['exec', '-e', 'x + 1'])).stdout).toBe('2\n')
    })

    it('fails with exit 1 and no stack trace when the code throws', async () => {
        const res = await project.run(['exec', '-e', "console.log('before')\nthrow new TypeError('bad thing')"])
        expect(res.code).toBe(1)
        expect(res.stdout).toBe('')
        expect(res.stderr).toContain('✖ TypeError: bad thing')
        expect(res.stderr).toContain('before')
        expect(res.stderr).not.toMatch(/\bat .*exec\.js/)
        const json = await project.run(['exec', '-e', "throw new Error('x')", '--json'])
        expect(json.json).toMatchObject({ ok: false, error: { code: 'EXEC_ERROR', message: 'Error: x' } })
    })

    it('reports syntax errors with the position', async () => {
        const res = await project.run(['exec', '-e', 'const a = 1\nfoo(', '--json'])
        expect(res.code).toBe(1)
        expect(res.json.error).toEqual({ code: 'EXEC_ERROR', message: 'SyntaxError: Unexpected token (line 2:5)' })
    })

    it('times out and keeps the session usable', async () => {
        const started = Date.now()
        const res = await project.run(['exec', '-e', 'await browser.pause(3000)', '--timeout', '500', '--json'])
        expect(res.code).toBe(1)
        expect(res.json.error.code).toBe('TIMEOUT')
        expect(Date.now() - started).toBeLessThan(2500)
        expect((await project.run(['exec', '-e', 'await browser.getTitle()'])).stdout).toBe('Session Fixture\n')
    })

    it('explains removed APIs', async () => {
        const res = await project.run(['exec', '-e', "await browser.element('h1')"])
        expect(res.code).toBe(1)
        expect(res.stderr).toContain('browser.element is not a function')
        expect(res.stderr).toContain('The v4 `browser.element(selector)` style was removed. Use `await $(selector)`.')
        const strict = await project.run(['exec', '-e', "await $('p').getText()"])
        expect(strict.stderr).toContain('`$` must match exactly one element in v10')
    })

    it('warns about missing await', async () => {
        const res = await project.run(['exec', '-e', "$('h1').click()\nawait browser.getTitle()"])
        expect(res.stdout).toBe('warn: line 1: WebdriverIO commands are async, add await\nSession Fixture\n')
    })

    it('renders elements, element arrays and buffers', async () => {
        expect((await project.run(['exec', '-e', "await $('h1')"])).stdout).toBe('<h1 "Welcome" selector="h1">\n')
        expect((await project.run(['exec', '-e', "await $$('nav a')"])).stdout).toMatch(/^ElementArray\(\d+\) \[\n {2}<a "[^"]+"( ref=e\d+)? selector="nav a">/)
        expect((await project.run(['exec', '-e', 'Buffer.from(await browser.takeScreenshot(), "base64")'])).stdout).toMatch(/^<Buffer \d+ bytes>\n$/)
    })

    it('supports expect-webdriverio and imports', async () => {
        expect((await project.run(['exec', '-e', "await expect(browser).toHaveTitle('Session Fixture'); 'ok'"])).stdout).toBe('ok\n')
        const failed = await project.run(['exec', '-e', "await expect($('h1')).toHaveText('Nope', { wait: 100 })"])
        expect(failed.code).toBe(1)
        expect(failed.stderr).toContain('Expect $(`h1`) to have text')
        expect((await project.run(['exec', '-e', "import os from 'node:os'\ntypeof os.EOL"])).stdout).toBe('string\n')
        fs.writeFileSync(path.join(project.dir, 'util.mjs'), 'export const double = (n) => n * 2\n')
        expect((await project.run(['exec', '-e', "import { double } from './util.mjs'\ndouble(21)"])).stdout).toBe('42\n')
    })

    it('records mutations in the history but not reads or failures', async () => {
        const historyFile = path.join(project.dir, '.wdio', 'session', 'default', 'history.json')
        const before = JSON.parse(fs.readFileSync(historyFile, 'utf-8')).length
        await project.run(['exec', '-e', 'await browser.getTitle()'])
        await project.run(['exec', '-e', "throw new Error('no')"])
        await project.run(['exec', '-e', "await browser.execute(() => document.title = 'Changed')", '--no-history'])
        await project.run(['exec', '-e', "await browser.execute(() => { document.title = 'Session Fixture' })"])
        const entries = JSON.parse(fs.readFileSync(historyFile, 'utf-8'))
        expect(entries.slice(before).map((e: { kind: string, code: string }) => [e.kind, e.code])).toEqual([
            ['exec', "await browser.execute(() => { document.title = 'Session Fixture' })"]
        ])
    })
})

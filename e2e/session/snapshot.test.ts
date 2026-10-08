import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

const golden = (name: string) => path.join(__dirname, '__snapshots__', `${name}.yml`)
const refOf = (text: string, line: string) => {
    const match = text.split('\n').find((l) => l.includes(line))?.match(/\[ref=(e\d+)\]/)
    expect(match, `no ref for ${line} in\n${text}`).toBeTruthy()
    return match![1]
}

describe('wdio session snapshot', () => {
    let server: FixtureServer
    let project: Project

    const run = (...args: string[]) => project.run(args)
    const goto = async (page: string) => {
        const res = await run('exec', '-e', `await browser.url(${JSON.stringify(server.url + page)}); await browser.pause(100); 1`)
        expect(res.code, res.stderr).toBe(0)
    }
    const snapshot = async (...args: string[]) => {
        const res = await run('snapshot', ...args)
        expect(res.code, res.stderr).toBe(0)
        return res.stdout.replaceAll(`:${server.port}`, ':PORT')
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('snapshot')
        const open = await project.run(['open', 'chrome', `${server.url}/index.html`, '--viewport', '1280x720'])
        expect(open.code, open.stderr).toBe(0)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('matches the golden snapshot of each fixture page', async () => {
        for (const page of ['index', 'form', 'shadow', 'cart']) {
            await goto(`/${page}.html`)
            await expect(await snapshot()).toMatchFileSnapshot(golden(page))
        }
        await goto('/frames.html?cross=' + server.url.replace('localhost', '127.0.0.1'))
        await expect(await snapshot()).toMatchFileSnapshot(golden('frames'))
    })

    it('supports --all, --depth, --interactive and --boxes', async () => {
        await goto('/index.html')
        await expect(await snapshot('--all')).toMatchFileSnapshot(golden('index-all'))
        await expect(await snapshot('--depth', '2')).toMatchFileSnapshot(golden('index-depth-2'))
        await goto('/form.html')
        await expect(await snapshot('--interactive')).toMatchFileSnapshot(golden('form-interactive'))
        await goto('/frames.html')
        await expect(await snapshot('-i', '--boxes')).toMatchFileSnapshot(golden('frames-boxes'))
    })

    it('ends each ref line with its selector for -i --selectors', async () => {
        await goto('/cart.html')
        await expect(await snapshot('-i', '--selectors')).toMatchFileSnapshot(golden('cart-selectors'))
    })

    it('gives the input inside an ARIA 1.1 combobox wrapper its own ref that fill accepts', async () => {
        await goto('/combobox.html')
        const text = await snapshot('-i')
        await expect(text).toMatchFileSnapshot(golden('combobox-interactive'))
        const filled = await run('fill', refOf(text, 'searchbox'), 'dune')
        expect(filled.code, filled.stderr).toBe(0)
        expect((await run('get', 'value', '#autocomplete-0-input')).stdout.split('\n')[0]).toBe('dune')
    })

    it('keeps the interactive snapshot of the cart page small', async () => {
        await goto('/cart.html')
        expect((await snapshot('-i')).length).toBeLessThanOrEqual(1500)
    })

    it('writes every snapshot to a file and reports it with --json', async () => {
        await goto('/index.html')
        const res = await run('snapshot', '--json')
        expect(res.json).toMatchObject({ ok: true, result: { data: { refs: 4 } } })
        const { text, data: { file } } = res.json.result
        expect(file).toMatch(/snapshots[/\\].*\.yml$/)
        expect(fs.readFileSync(file, 'utf-8')).toBe(text + '\n')
        const summary = await run('snapshot', '--file-only')
        expect(summary.stdout).toMatch(/^Snapshot: \d+ lines, 4 refs, \d+ chars → .*\.yml\n/)
    })

    it('keeps refs stable across snapshots of the same page', async () => {
        await goto('/form.html')
        const first = await snapshot()
        const second = await snapshot()
        expect(second).toBe(first)
        const res = await run('exec', '-e', `await ref('${refOf(first, 'textbox "Email"')}').getAttribute('id')`)
        expect(res.stdout).toBe('email\n')
    })

    it('resolves every stable selector to the element the ref points to', async () => {
        await goto('/form.html')
        const text = await snapshot()
        const ids = [...text.matchAll(/\[ref=(e\d+)\]/g)].map((m) => m[1])
        expect(ids.length).toBeGreaterThan(10)
        const selectors: Record<string, string> = {}
        for (const id of ids) {
            const shot = await run('screenshot', id, '--json')
            expect(shot.code, shot.stderr).toBe(0)
            selectors[id] = shot.json.result.data.selector
        }
        expect(selectors[refOf(text, 'textbox "Email"')]).toBe('role/textbox[name="Email"]')
        const res = await run('exec', '-e', `
            const out = []
            for (const [id, selector] of Object.entries(${JSON.stringify(selectors)})) {
                const els = await $$(selector).getElements()
                if (els.length !== 1 || !(await els[0].isEqual(await ref(id)))) out.push(id + ' ' + selector)
            }
            out
        `)
        expect(res.code, res.stderr).toBe(0)
        expect(JSON.parse(res.stdout)).toEqual([])
    })

    it('reports stale and unknown refs', async () => {
        await goto('/form.html')
        const email = refOf(await snapshot(), 'textbox "Email"')
        await goto('/index.html')
        const stale = await run('screenshot', email, '--json')
        expect(stale.code).toBe(1)
        expect(stale.json.error.code).toBe('REF_STALE')
        const unknown = await run('screenshot', 'e999', '--json')
        expect(unknown.json.error.code).toBe('REF_NOT_FOUND')
    })

    it('finds lines with context and exits 1 without a match', async () => {
        await goto('/index.html')
        const res = await run('find', 'Say hello')
        expect(res.code).toBe(0)
        expect(res.stdout).toMatch(/^\d+- {4}- paragraph .*\n\d+: {4}- button "Say hello" \[ref=e\d+\]\n/m)
        const none = await run('find', 'does not exist', '--json')
        expect(none.code).toBe(1)
        expect(none.json.error.code).toBe('NO_MATCH')
    })

    it('diffs against the previous snapshot', async () => {
        await goto('/index.html')
        const hello = refOf(await snapshot(), 'button "Say hello"')
        expect((await run('diff')).stdout).toBe('No changes\n')
        await run('exec', '-e', "await $('#hello').click()")
        const res = await run('diff')
        expect(res.code, res.stderr).toBe(0)
        const changes = res.stdout.split('\n').filter((l) => /^[+-]/.test(l))
        expect(changes).toEqual([
            `-    - button "Say hello" [ref=${hello}]`,
            `+    - button "Say hello" [ref=${hello}] [focused]`,
            '+    - paragraph "Hello, agent!"'
        ])
    })

    it('takes viewport, element and full-page screenshots', async () => {
        await goto('/form.html')
        const submit = refOf(await snapshot(), 'button "Submit"')
        const size = (file: string) => {
            const buf = fs.readFileSync(file)
            expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
            expect(buf.subarray(12, 16).toString()).toBe('IHDR')
            return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
        }
        const viewport = await run('screenshot', '--json')
        expect(viewport.code, viewport.stderr).toBe(0)
        const vp = size(viewport.json.result.data.file)
        const client = await run('exec', '-e', 'await browser.execute(() => [document.documentElement.clientWidth, document.documentElement.clientHeight])')
        expect([vp.width, vp.height]).toEqual(JSON.parse(client.stdout))

        const element = await run('screenshot', submit, '--json')
        const el = size(element.json.result.data.file)
        expect(el.width).toBeLessThan(vp.width)
        expect(el.height).toBeLessThan(vp.height)

        const full = await run('screenshot', '--full', '--json')
        expect(size(full.json.result.data.file).height).toBeGreaterThan(vp.height)

        const custom = path.join(project.dir, 'shot.png')
        const saved = await run('screenshot', '--path', custom)
        expect(saved.stdout).toContain(custom)
        expect(fs.existsSync(custom)).toBe(true)
    })

    it('saves the page source', async () => {
        await goto('/index.html')
        const res = await run('source', '--json')
        expect(res.code, res.stderr).toBe(0)
        expect(fs.readFileSync(res.json.result.data.file, 'utf-8')).toContain('<title>Session Fixture</title>')
    })
})

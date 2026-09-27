import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { helpers } from '../src/actions/helpers.js'
import { formatHelpers, loadHelpers, reloadHelpers, rewriteRelativeImports, type LoadedHelper } from '../src/helpers.js'
import type { Session } from '../src/session.js'

const dirs: string[] = []
const sessions: Session[] = []

function project () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-helpers-'))
    dirs.push(dir)
    fs.mkdirSync(path.join(dir, '.wdio', 'helpers'), { recursive: true })
    return dir
}

function fakeSession (cwd: string) {
    const proto: Record<string, unknown> = {}
    const browser = Object.create(proto) as WebdriverIO.Browser & { calls: string[] }
    browser.calls = []
    browser.addCommand = ((name: string, fn: (...args: unknown[]) => unknown) => {
        proto[name] = fn
    }) as WebdriverIO.Browser['addCommand']
    const store = new Map<string, unknown>()
    return {
        cwd,
        browser,
        store,
        disposers: [] as (() => unknown)[],
        get: (key: string) => store.get(key),
        set: (key: string, value: unknown) => store.set(key, value)
    } as unknown as Session
}

function tracked (cwd: string) {
    const session = fakeSession(cwd)
    sessions.push(session)
    return session
}

afterEach(async () => {
    for (const session of sessions.splice(0)) {
        for (const dispose of session.disposers.splice(0).reverse()) {
            await dispose()
        }
    }
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('rewriteRelativeImports', () => {
    it('rewrites relative specifiers and leaves packages alone', () => {
        const dir = '/proj/.wdio/helpers'
        const out = rewriteRelativeImports([
            "import { x } from './util.js'",
            "import './side.js'",
            "const y = import('./dyn.js')",
            "import fs from 'node:fs'"
        ].join('\n'), dir, 5)
        const file = (name: string) => `${pathToFileURL(path.join(dir, name)).href}?v=5`
        expect(out).toContain(`from '${file('util.js')}'`)
        expect(out).toContain(`import '${file('side.js')}'`)
        expect(out).toContain(`import('${file('dyn.js')}'`)
        expect(out).toContain("from 'node:fs'")
    })

    it('leaves specifiers inside strings and comments unchanged', () => {
        const dir = '/proj/.wdio/helpers'
        const out = rewriteRelativeImports([
            "const note = \"from './util.js'\"",
            "// import './skip.js'",
            "/* import('./nope.js') */",
            "import { x } from './util.js'"
        ].join('\n'), dir, 5)
        expect(out).toContain("const note = \"from './util.js'\"")
        expect(out).toContain("// import './skip.js'")
        expect(out).toContain("/* import('./nope.js') */")
        expect(out).not.toContain('skip.js?v=')
        expect(out).not.toContain('nope.js?v=')
        expect(out).toContain(`from '${pathToFileURL(path.join(dir, 'util.js')).href}?v=5'`)
    })
})

describe('loadHelpers', () => {
    it('registers commands, reports a broken file, and picks up edits', async () => {
        const dir = project()
        const helpers = path.join(dir, '.wdio', 'helpers')
        fs.writeFileSync(path.join(helpers, 'util.js'), 'export const mark = "v1"\n')
        fs.writeFileSync(path.join(helpers, 'login.ts'), [
            "import { mark } from './util.js'",
            'export default function (browser: { addCommand: Function }) {',
            "    browser.addCommand('fillLogin', async (email: string) => email + mark)",
            '}'
        ].join('\n'))
        fs.writeFileSync(path.join(helpers, 'broken.ts'), 'export default function ( {\n')
        const session = fakeSession(dir)
        await loadHelpers(session)
        const loaded = session.get<LoadedHelper[]>('helpers')!
        expect(loaded.find((h) => h.file.endsWith('login.ts'))?.commands).toEqual(['fillLogin'])
        expect(loaded.find((h) => h.file.endsWith('broken.ts'))?.error).toMatch(/SyntaxError|Unexpected|invalid JS syntax/)
        expect(formatHelpers(loaded)).toContain('fillLogin (login.ts)')
        expect(formatHelpers(loaded)).toContain('broken.ts:')
        const fill = (session.browser as unknown as { fillLogin: (email: string) => Promise<string> }).fillLogin
        expect(await fill('a')).toBe('av1')

        fs.writeFileSync(path.join(helpers, 'util.js'), 'export const mark = "v2"\n')
        await reloadHelpers(session)
        const fill2 = (session.browser as unknown as { fillLogin: (email: string) => Promise<string> }).fillLogin
        expect(await fill2('a')).toBe('av2')
        expect(session.get<LoadedHelper[]>('helpers')!.find((h) => h.file.endsWith('broken.ts'))?.error).toBeTruthy()
        expect(fs.readdirSync(helpers)).not.toContain('.cache')
        expect(String(session.get('helperCache'))).toContain(`${path.sep}helper-cache${path.sep}`)
    })

    it('keeps a dynamic import alive and does not reload from its own cache', async () => {
        const dir = project()
        const helpers = path.join(dir, '.wdio', 'helpers')
        fs.writeFileSync(path.join(helpers, 'dyn.js'), 'export const mark = "d1"\n')
        fs.writeFileSync(path.join(helpers, 'main.js'), [
            'export default function (browser) {',
            "    browser.addCommand('loadDyn', () => import('./dyn.js').then((mod) => mod.mark))",
            '}'
        ].join('\n'))
        const session = tracked(dir)
        await loadHelpers(session, { watch: true })
        const loadDyn = () => (session.browser as unknown as { loadDyn: () => Promise<string> }).loadDyn()
        expect(await loadDyn()).toBe('d1')
        const cache = session.get('helperCache')
        await new Promise((resolve) => setTimeout(resolve, 500))
        expect(session.get('helperCache')).toBe(cache)
        expect(await loadDyn()).toBe('d1')

        fs.writeFileSync(path.join(helpers, 'dyn.js'), 'export const mark = "d2"\n')
        const started = Date.now()
        let mark = 'd1'
        while (Date.now() - started < 3000 && mark !== 'd2') {
            mark = await loadDyn()
            if (mark !== 'd2') {
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        }
        expect(mark).toBe('d2')
    })

    it('reloads a same-size edit that keeps its modification time', async () => {
        const dir = project()
        const helpers = path.join(dir, '.wdio', 'helpers')
        const file = path.join(helpers, 'dyn.js')
        fs.writeFileSync(file, 'export const mark = "d1"\n')
        fs.writeFileSync(path.join(helpers, 'main.js'), [
            'export default function (browser) {',
            "    browser.addCommand('loadDyn', () => import('./dyn.js').then((mod) => mod.mark))",
            '}'
        ].join('\n'))
        const frozen = new Date(Math.floor(Date.now() / 1000) * 1000)
        fs.utimesSync(file, frozen, frozen)
        const session = tracked(dir)
        await loadHelpers(session, { watch: true })
        const loadDyn = () => (session.browser as unknown as { loadDyn: () => Promise<string> }).loadDyn()
        expect(await loadDyn()).toBe('d1')
        const before = fs.statSync(file)
        fs.writeFileSync(file, 'export const mark = "d9"\n')
        fs.utimesSync(file, frozen, frozen)
        const after = fs.statSync(file)
        expect(after.size).toBe(before.size)
        expect(after.mtimeMs).toBe(before.mtimeMs)

        const started = Date.now()
        let mark = 'd1'
        while (Date.now() - started < 3000 && mark !== 'd9') {
            mark = await loadDyn()
            if (mark !== 'd9') {
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        }
        expect(mark).toBe('d9')
    })

    it('reloads when a helper reads a sibling file that changes', async () => {
        const dir = project()
        const helpers = path.join(dir, '.wdio', 'helpers')
        const settings = path.join(helpers, 'settings.json')
        fs.writeFileSync(settings, '{"label":"one"}\n')
        fs.writeFileSync(path.join(helpers, 'main.js'), [
            "import fs from 'node:fs'",
            `const settings = ${JSON.stringify(settings)}`,
            'const label = JSON.parse(fs.readFileSync(settings, "utf8")).label',
            'export default function (browser) {',
            "    browser.addCommand('label', () => label)",
            '}'
        ].join('\n'))
        const session = tracked(dir)
        await loadHelpers(session, { watch: true })
        const read = () => (session.browser as unknown as { label: () => string }).label()
        expect(read()).toBe('one')
        fs.writeFileSync(settings, '{"label":"two"}\n')
        const started = Date.now()
        let label = 'one'
        while (Date.now() - started < 3000 && label !== 'two') {
            label = read()
            if (label !== 'two') {
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        }
        expect(label).toBe('two')
    })

    it('does not reread an unchanged data file when a helper changes', async () => {
        const dir = project()
        const helpers = path.join(dir, '.wdio', 'helpers')
        const data = path.join(helpers, 'payload.bin')
        const main = path.join(helpers, 'main.js')
        fs.writeFileSync(data, Buffer.alloc(1024, 7))
        const source = (mark: string) => [
            'export default function (browser) {',
            `    browser.addCommand('mark', () => ${JSON.stringify(mark)})`,
            '}'
        ].join('\n')
        fs.writeFileSync(main, source('a'))
        const session = tracked(dir)
        await loadHelpers(session, { watch: true })
        const read = () => (session.browser as unknown as { mark: () => string }).mark()
        expect(read()).toBe('a')
        await new Promise((resolve) => setTimeout(resolve, 500))
        const spy = vi.spyOn(fs, 'readFileSync')
        fs.writeFileSync(main, source('b'))
        const started = Date.now()
        let mark = 'a'
        while (Date.now() - started < 3000 && mark !== 'b') {
            mark = read()
            if (mark !== 'b') {
                await new Promise((resolve) => setTimeout(resolve, 50))
            }
        }
        const reread = spy.mock.calls.some((args) => String(args[0]) === data)
        spy.mockRestore()
        expect(mark).toBe('b')
        expect(reread).toBe(false)
    })

    it('resolves a bare package import from the project', async () => {
        const dir = project()
        const dep = path.join(dir, 'node_modules', 'helper-dep')
        fs.mkdirSync(dep, { recursive: true })
        fs.writeFileSync(path.join(dep, 'package.json'), JSON.stringify({ name: 'helper-dep', type: 'module', main: 'index.js' }))
        fs.writeFileSync(path.join(dep, 'index.js'), 'export const mark = "pkg"\n')
        fs.writeFileSync(path.join(dir, '.wdio', 'helpers', 'pkg.js'), [
            "import { mark } from 'helper-dep'",
            'export default function (browser) {',
            "    browser.addCommand('fromPkg', () => mark)",
            '}'
        ].join('\n'))
        const session = tracked(dir)
        await loadHelpers(session)
        const fromPkg = (session.browser as unknown as { fromPkg: () => string }).fromPkg
        expect(fromPkg()).toBe('pkg')
    })

    it('starts watching when the helpers directory appears after open', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-helpers-'))
        dirs.push(dir)
        const session = tracked(dir)
        await loadHelpers(session, { watch: true })
        expect(session.get<LoadedHelper[]>('helpers')).toEqual([])
        const helpersDir = path.join(dir, '.wdio', 'helpers')
        fs.mkdirSync(helpersDir, { recursive: true })
        await new Promise((resolve) => setTimeout(resolve, 50))
        fs.writeFileSync(path.join(helpersDir, 'cmd.js'), [
            'export default function (browser) {',
            "    browser.addCommand('ping', () => 'pong')",
            '}'
        ].join('\n'))
        const started = Date.now()
        let ping: (() => string) | undefined
        while (Date.now() - started < 3000) {
            ping = (session.browser as unknown as { ping?: () => string }).ping
            if (ping) {
                break
            }
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
        expect(ping?.()).toBe('pong')
    })

    it('reload starts the watcher', async () => {
        const dir = project()
        const session = tracked(dir)
        await helpers(session, { reload: true })
        expect(session.get('helpersWatch')).toBe(true)
    })

    it('prints a placeholder when the directory is empty', async () => {
        const session = fakeSession(project())
        await loadHelpers(session)
        expect(formatHelpers(session.get<LoadedHelper[]>('helpers')!)).toBe('No helpers.')
    })
})

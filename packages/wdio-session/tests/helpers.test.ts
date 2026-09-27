import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, it, expect, afterEach } from 'vitest'

import { formatHelpers, loadHelpers, reloadHelpers, rewriteRelativeImports, type LoadedHelper } from '../src/helpers.js'
import type { Session } from '../src/session.js'

const dirs: string[] = []

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

afterEach(() => {
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
        expect(loaded.find((h) => h.file.endsWith('broken.ts'))?.error).toMatch(/SyntaxError|Unexpected/)
        expect(formatHelpers(loaded)).toContain('fillLogin (login.ts)')
        expect(formatHelpers(loaded)).toContain('broken.ts:')
        const fill = (session.browser as unknown as { fillLogin: (email: string) => Promise<string> }).fillLogin
        expect(await fill('a')).toBe('av1')

        fs.writeFileSync(path.join(helpers, 'util.js'), 'export const mark = "v2"\n')
        await reloadHelpers(session)
        const fill2 = (session.browser as unknown as { fillLogin: (email: string) => Promise<string> }).fillLogin
        expect(await fill2('a')).toBe('av2')
        expect(session.get<LoadedHelper[]>('helpers')!.find((h) => h.file.endsWith('broken.ts'))?.error).toBeTruthy()
    })

    it('prints a placeholder when the directory is empty', async () => {
        const session = fakeSession(project())
        await loadHelpers(session)
        expect(formatHelpers(session.get<LoadedHelper[]>('helpers')!)).toBe('No helpers.')
    })
})

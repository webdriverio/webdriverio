import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio session state', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('state')
        await run('open', 'chrome', `${server.url}/index.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('saves cookies and storage and restores them in a new session', async () => {
        expect((await run('cookies', 'set', 'a', '1')).stdout).toContain("→ await browser.setCookies({ name: 'a', value: '1' })")
        await run('storage', 'set', 'k', 'v')
        await run('storage', 'set', 's', 't', '--session-storage')
        const file = path.join(project.dir, 'state.json')
        const saved = await run('state', 'save', file)
        expect(saved.stdout).toContain(`→ ${file}`)
        const json = JSON.parse(fs.readFileSync(file, 'utf-8'))
        expect(json).toMatchObject({
            version: 1,
            origin: server.url,
            localStorage: { k: 'v' },
            sessionStorage: { s: 't' }
        })
        expect(json.cookies).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'a', value: '1' })]))

        await run('close')
        await run('open', 'chrome', 'about:blank')
        const loaded = await run('state', 'load', file)
        expect(loaded.stdout).toContain('Restored')
        expect(loaded.stdout).toContain(server.url)
        expect((await run('cookies', 'get', 'a')).stdout).toBe('1\n')
        expect((await run('storage', 'get', 'k')).stdout).toBe('v\n')
        expect((await run('storage', 'get', 's', '--session-storage')).stdout).toBe('t\n')
    })

    it('clears every cookie', async () => {
        await run('cookies', 'clear')
        expect((await run('cookies')).stdout).toBe('No cookies.\n')
        const missing = await project.run(['cookies', 'get', 'a'])
        expect(missing.code).toBe(1)
        expect(missing.stderr).toContain('No cookie "a".')
    })
})

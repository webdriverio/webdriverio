import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, waitFor, type FixtureServer, type Project } from './helpers.js'

describe('wdio session helpers', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('helpers')
        const dir = path.join(project.dir, '.wdio', 'helpers')
        fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(path.join(dir, 'login.ts'), `
export default function (browser: { addCommand: Function }) {
    browser.addCommand('fillLogin', async function (email: string, password: string) {
        await this.$('#email').setValue(email)
        await this.$('#password').setValue(password)
    })
}
`)
        await run('open', 'chrome', `${server.url}/form.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('lists fillLogin and runs it', async () => {
        expect((await run('helpers')).stdout).toContain('fillLogin (login.ts)')
        await run('exec', '-e', "await browser.fillLogin('a@b.c', 'secret')")
        expect((await run('exec', '-e', "await $('#email').getValue()")).stdout).toBe('a@b.c\n')
        expect((await run('exec', '-e', "await $('#password').getValue()")).stdout).toBe('secret\n')
    })

    it('picks up an edit without reopening', async () => {
        const file = path.join(project.dir, '.wdio', 'helpers', 'login.ts')
        fs.writeFileSync(file, `
export default function (browser: { addCommand: Function }) {
    browser.addCommand('fillLogin', async function (email: string, password: string) {
        await this.$('#email').setValue(email + '-v2')
        await this.$('#password').setValue(password)
    })
}
`)
        const updated = await waitFor(async () => {
            const res = await project.run(['exec', '-e', "await browser.fillLogin('a@b.c', 'secret')"])
            if (res.code !== 0) {
                return false
            }
            const value = await project.run(['exec', '-e', "await $('#email').getValue()"])
            return value.stdout.trim() === 'a@b.c-v2'
        }, 2000, 150)
        expect(updated, 'helper was not reloaded within 2s').toBe(true)
    })

    it('reports a syntax error and keeps the other helper', async () => {
        fs.writeFileSync(path.join(project.dir, '.wdio', 'helpers', 'broken.ts'), 'export default function ( {\n')
        const started = Date.now()
        let text = ''
        const seen = await waitFor(async () => {
            const res = await project.run(['helpers'])
            text = res.stdout
            return res.code === 0 && text.includes('broken.ts:') && text.includes('fillLogin (login.ts)')
        }, 2000, 150)
        expect(seen, text || `helpers did not report the error after ${Date.now() - started}ms`).toBe(true)
        expect((await run('exec', '-e', "await browser.fillLogin('z@b.c', 'secret')")).code).toBe(0)
    })
})

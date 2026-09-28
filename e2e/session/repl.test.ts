import { describe, expect, it, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio repl --session', () => {
    let server: FixtureServer
    let project: Project

    beforeAll(async () => {
        server = await startServer()
        project = createProject('repl')
        const open = await project.run(['open', 'chrome', `${server.url}/index.html`])
        expect(open.code, open.stderr).toBe(0)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('evaluates code and leaves the session running', async () => {
        const repl = await project.wdio(['repl', '--session', 'default'], {
            stdin: 'await browser.getTitle()\n.exit\n'
        })
        expect(repl.code, repl.stdout + repl.stderr).toBe(0)
        expect(repl.stdout).toContain('Session Fixture')
        expect(repl.stdout).toContain('Detached from "default" (still running)')
        const status = await project.run(['status'])
        expect(status.code).toBe(0)
        expect(status.stdout).toContain('running')
    })
})
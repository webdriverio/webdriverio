import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, FIXTURES, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio session --selector-provider', () => {
    let server: FixtureServer
    let project: Project

    const run = (...args: string[]) => project.run(args)

    beforeAll(async () => {
        server = await startServer()
        project = createProject('selector-provider')
        const provider = path.join(FIXTURES, 'selector-provider.mjs')
        const open = await project.run(['open', 'chrome', `${server.url}/selector-provider.html`, '--no-snapshot', '--selector-provider', provider])
        expect(open.code, open.stderr).toBe(0)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('ranks the provider attribute first and clicks the ref it selects', async () => {
        const snapshot = await run('snapshot', '-i', '--selectors')
        expect(snapshot.code, snapshot.stderr).toBe(0)
        expect(snapshot.stdout).toContain('[data-e2e=')
        const id = snapshot.stdout.match(/button "Save" \[ref=(e\d+)\]/)?.[1]
        expect(id, snapshot.stdout).toBeDefined()

        const clicked = await run('click', id!)
        expect(clicked.code, clicked.stderr).toBe(0)
        const marked = await run('exec', '-e', 'return await browser.execute(() => [...document.querySelectorAll("[data-e2e]")].map((el) => el.hasAttribute("data-clicked")))')
        expect(JSON.parse(marked.stdout)).toEqual([true, false])
    })
})

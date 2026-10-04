import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

/**
 * Output an agent can act on: long pages in parts, searches that find what a
 * person would, code that reports what it did.
 */
describe('wdio session output for agents', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const load = (page: string) => run('navigate', `${server.url}/${page}.html`)

    beforeAll(async () => {
        server = await startServer()
        project = createProject('agent-output')
        await run('open', 'chrome', `${server.url}/findable.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('prints a long snapshot in parts', async () => {
        await load('long')
        const first = (await run('snapshot', '-i', '--max-chars', '1000')).stdout
        expect(first).toMatch(/link "Item 1" \[ref=e\d+\]/)
        // the hint repeats the flags, the part size included
        const next = first.match(/`wdio session snapshot -i --max-chars 1000 --offset (\d+)`/)
        expect(next, first).toBeTruthy()
        const second = (await run('snapshot', '-i', '--max-chars', '1000', '--offset', next![1])).stdout
        expect(second).not.toContain('link "Item 1" ')
        expect(second).toMatch(new RegExp(`… lines ${next![1]}–\\d+ of \\d+`))
    })

    it('cuts a line longer than the budget and says how to read it whole', async () => {
        await load('findable')
        const res = (await run('snapshot', '--max-chars', '20')).stdout
        expect(res.split('\n')[0].length).toBeLessThanOrEqual(20)
        const whole = res.match(/Line 1 is cut; `wdio session snapshot --max-chars (\d+) --offset 1` shows all of it\./)
        expect(whole, res).toBeTruthy()
        expect((await run('snapshot', '--max-chars', whole![1], '--offset', '1')).stdout.split('\n')[0]).toMatch(/^- document "Findable Fixture" url=\S+findable\.html$/)
    })

    it('finds text split by markup, ignoring spaces', async () => {
        await load('findable')
        const res = await run('find', 'SO2')
        expect(res.stdout).toContain('lines that do without the spaces')
        expect(res.stdout).toMatch(/heading "SO 2 Excellent"/)
    })

    it('says when the text is only in a hidden part of the page', async () => {
        await load('findable')
        const res = await run('find', 'Fall 2023')
        expect(res.stdout).toContain('It is on the page but hidden')
        expect(res.stdout).toMatch(/button "Fall 2023"[^\n]*\[hidden\]/)
    })

    it('searches below a scope', async () => {
        await load('findable')
        const page = (await run('snapshot', '-i')).stdout
        const term = page.match(/group "Term" \[ref=(e\d+)\]|group "Term"/)
        expect(term, page).toBeTruthy()
        const res = await run('find', 'Show more', '--scope', 'aria/Subject')
        expect(res.stdout.match(/button "Show more"/g)).toHaveLength(1)
    })

    it('keeps the names of groups in interactive snapshots', async () => {
        await load('findable')
        const page = (await run('snapshot', '-i')).stdout
        expect(page).toMatch(/group "Term"[^\n]*\n\s+- button "Show more"/)
        expect(page).toMatch(/group "Subject"[^\n]*\n\s+- button "Show more"/)
    })

    it('reports what code changed on the page', async () => {
        await load('findable')
        const res = await run('exec', '-e', 'await $("#add").click()')
        expect(res.stdout).toContain('Added to cart')
    })

    it('prints what code printed before it ran out of time', async () => {
        const res = await project.run(['exec', '--timeout', '4000', '-e', 'console.log("first slider set"); await new Promise((r) => setTimeout(r, 20000))'])
        expect(res.code).not.toBe(0)
        expect(res.stderr).toContain('did not finish within 4000ms')
        expect(res.stderr).toContain('first slider set')
    }, 60_000)
})

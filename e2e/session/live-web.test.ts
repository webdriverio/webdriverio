import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

/**
 * What agents run into on real sites: links that open tabs, bot checks,
 * search words that don't match the page's wording, frames that go away,
 * pages that draw with WebGL.
 */
describe('wdio session on live-web pages', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const load = (page = 'live') => run('navigate', `${server.url}/${page}.html`)

    beforeAll(async () => {
        server = await startServer()
        project = createProject('live-web')
        await run('open', 'chrome', `${server.url}/live.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('reports a tab that a link opened', async () => {
        await load()
        const res = await run('click', 'aria/Open home in a new tab')
        expect(res.stdout).toMatch(/Opened a new tab \[1\]: http:\/\/localhost:\d+\/index\.html\. This tab stays current; `wdio session tabs switch 1` works in the new one\./)
        await run('tabs', 'close', '1')
    })

    it('reports a tab that a script opened', async () => {
        await load()
        const res = await run('click', '#popup')
        expect(res.stdout).toMatch(/Opened a new tab \[1\]: http:\/\/localhost:\d+\/form\.html/)
        await run('tabs', 'close', '1')
    })

    it('says no tab opened when none did', async () => {
        await load()
        const res = await run('click', 'aria/Giving')
        expect(res.stdout).not.toContain('Opened a new tab')
    })

    it('says when a page is a bot check, once per page', async () => {
        const res = await run('navigate', `${server.url}/challenge.html`)
        expect(res.stdout).toContain('This page is a Cloudflare bot check, not the site.')
        expect(res.stdout).toContain(`\`wdio session open chrome ${server.url}/challenge.html --headed --replace\``)
        const again = await run('snapshot', '-i')
        expect(again.stdout).not.toContain('bot check')
        const elsewhere = await load()
        expect(elsewhere.stdout).not.toContain('bot check')
    })

    it('says it on open, from the first snapshot', async () => {
        const other = createProject('live-web-open')
        try {
            const res = await other.run(['open', 'chrome', `${server.url}/challenge.html`])
            expect(res.code, res.stderr).toBe(0)
            expect(res.stdout).toContain('This page is a Cloudflare bot check, not the site.')
        } finally {
            await other.cleanup()
        }
    })

    it('finds words like the one searched for', async () => {
        await load()
        const res = await run('find', 'Give')
        expect(res.stdout).toContain('No line contains "Give"; lines with words like it:')
        expect(res.stdout).toMatch(/link "Giving" \[ref=e\d+\]/)
    })

    it('reports a frame that went away and keeps the session', async () => {
        await load()
        const snapshot = (await run('snapshot', '-i')).stdout
        const frame = snapshot.match(/iframe "Reloading widget" \[ref=(e\d+)\]/)![1]
        await run('frame', frame)
        await run('exec', '-e', "await browser.execute(() => window.parent.document.getElementById('widget').remove())").catch(() => {})
        const gone = await project.run(['click', 'button=Frame button'])
        expect(gone.code).not.toBe(0)
        expect(gone.stderr).toContain('The frame went away while the action ran')
        expect((await run('info', '--json')).json.result.data.frame).toBe('top')
        expect((await run('snapshot', '-i')).stdout).toContain('"Live Web Fixture"')
    })

    it('has WebGL in headless Chrome', async () => {
        await load()
        const res = await run('exec', '-e', "JSON.stringify(await browser.execute(() => Boolean(document.getElementById('gl').getContext('webgl'))))")
        expect(res.stdout.trim()).toBe('true')
    })
})

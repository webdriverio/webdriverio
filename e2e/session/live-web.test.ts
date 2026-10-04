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

    it('leaves out decoy elements a bot check plants', async () => {
        await load('decoy')
        const page = (await run('snapshot', '-i')).stdout
        expect(page).toContain('button "Real button"')
        expect(page).toContain('button "Hold to verify"')
        await run('frame', page.match(/iframe "Verification" \[ref=(e\d+)\]/)![1])
        const frame = (await run('snapshot')).stdout
        expect(frame).toContain('heading "Quick verification"')
        expect((await run('find', 'Hold')).stdout).toContain('button "Hold to verify"')
        await run('frame', 'top')
    })

    it('prints the start of a long page on open', async () => {
        const other = createProject('live-web-long')
        try {
            const res = await other.run(['open', 'chrome', `${server.url}/long.html`])
            expect(res.code, res.stderr).toBe(0)
            expect(res.stdout).toMatch(/link "Item 1" \[ref=e\d+\]/)
            expect(res.stdout).toMatch(/… lines 1–\d+ of \d+\. `wdio session snapshot -i --offset \d+` shows the next part, `find <text>` searches all of it\./)
        } finally {
            await other.cleanup()
        }
    })

    it('closes a session whose page is frozen', async () => {
        const other = createProject('live-web-busy')
        try {
            const opened = await other.run(['open', 'chrome', `${server.url}/busy.html`])
            expect(opened.code, opened.stderr).toBe(0)
            const frozen = await other.run(['click', 'aria/Freeze the page', '--timeout', '3000'])
            expect(frozen.code).not.toBe(0)
            expect(frozen.stderr).toContain('did not finish within 3000ms')
            const started = Date.now()
            const closed = await other.run(['close'])
            expect(closed.code, closed.stderr).toBe(0)
            // the page stays frozen for a minute; close doesn't wait for it
            expect(Date.now() - started).toBeLessThan(30_000)
            expect((await other.run(['list', '--json'])).json.result.data.sessions).toEqual([])

            // and while the click is still waiting on the frozen page
            const reopened = await other.run(['open', 'chrome', `${server.url}/busy.html`])
            expect(reopened.code, reopened.stderr).toBe(0)
            const waiting = other.run(['click', 'aria/Freeze the page'])
            await new Promise((resolve) => setTimeout(resolve, 2000))
            const startedAgain = Date.now()
            const closedAgain = await other.run(['close'])
            expect(closedAgain.code, closedAgain.stderr).toBe(0)
            expect(Date.now() - startedAgain).toBeLessThan(30_000)
            expect((await waiting).code).not.toBe(0)
        } finally {
            await other.cleanup()
        }
    }, 150_000)

    it('leaves the frame of an action it gave up on', async () => {
        await load('busy-frame')
        const page = (await run('snapshot', '-i')).stdout
        const button = page.match(/button "Freeze for a while" \[ref=(e\d+)\]/)![1]
        const frozen = await project.run(['click', button, '--timeout', '2000'])
        expect(frozen.code).not.toBe(0)
        // the page is frozen for 12s; the session gives the click up after a grace period
        await new Promise((resolve) => setTimeout(resolve, 12_000))
        expect((await run('info', '--json')).json.result.data.frame).toBe('top')
        expect((await run('snapshot', '-i')).stdout).toContain('"Busy Frame Fixture"')
    }, 60_000)

    it('says when a page did not load', async () => {
        await load('broken')
        const res = await run('click', 'aria/A site that refuses the connection')
        expect(res.stdout).toMatch(/The page did not load: the browser shows its error page \(ERR_[A-Z_]+\)\./)
    })

    it('says when a click changed nothing', async () => {
        await load('broken')
        const res = await run('click', 'aria/Does nothing')
        expect(res.stdout).toContain('No visible change on the page.')
    })

    it('does not call a navigation to a large page no change', async () => {
        await load('broken')
        const res = await run('click', 'aria/A long page')
        expect(res.stdout).toContain('Navigated to')
        expect(res.stdout).not.toContain('No visible change on the page.')
    })

    it('keeps the session when code leaves a rejected promise behind', async () => {
        await load('broken')
        // a command on a chainable that is never awaited rejects with nobody listening
        await project.run(['exec', '-e', 'const el = $("#does-not-exist"); el.click(); await new Promise((r) => setTimeout(r, 200))'])
        await new Promise((resolve) => setTimeout(resolve, 6000))
        expect((await run('get', 'title')).stdout).toContain('Broken Links Fixture')
    }, 60_000)

    it('has WebGL in headless Chrome', async () => {
        await load()
        const res = await run('exec', '-e', "JSON.stringify(await browser.execute(() => Boolean(document.getElementById('gl').getContext('webgl'))))")
        expect(res.stdout.trim()).toBe('true')
    })
})

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio session contexts and dialogs', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const text = async (selector: string) => (await run('exec', '-e', `await $(${JSON.stringify(selector)}).getText()`)).stdout.trim()
    const waitForDialog = async () => {
        for (let i = 0; i < 50; i++) {
            if ((await run('info', '--json')).json.result.data.dialog) {
                return
            }
            await new Promise((r) => setTimeout(r, 100))
        }
        throw new Error('dialog did not open')
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('contexts')
        await run('open', 'chrome', `${server.url}/index.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('lists, opens, switches and closes tabs', async () => {
        const one = await run('tabs', '--json')
        expect(one.json.result.data.tabs).toHaveLength(1)
        expect(one.json.result.text).toBe(`[0]* Session Fixture — ${server.url}/index.html`)
        expect((await run('tabs')).stdout).toBe(`[0]* Session Fixture — ${server.url}/index.html\n`)

        const opened = await run('tabs', 'new', `${server.url}/cart.html`)
        expect(opened.stdout).toBe(`Opened tab [1] ${server.url}/cart.html\n→ await browser.newWindow('${server.url}/cart.html')\n`)
        const two = await run('tabs', '--json')
        expect(two.json.result.data.tabs.map((t: { title: string, current: boolean }) => [t.title, t.current]))
            .toEqual([['Session Fixture', false], ['Shop · Cart', true]])

        const switched = await run('tabs', 'switch', '0')
        expect(switched.stdout).toContain(`→ const page = (await browser.browsingContexts()).find((context) => context.url === '${server.url}/index.html')!`)
        expect((await run('exec', '-e', 'await browser.getTitle()')).stdout).toBe('Session Fixture\n')

        const closed = await run('tabs', 'close', '1')
        expect(closed.stdout).toContain(`→ const page2 = (await browser.browsingContexts()).find((context) => context.url === '${server.url}/cart.html')!\nawait page2.closeWindow()\n`)
        expect((await run('tabs', '--json')).json.result.data.tabs).toHaveLength(1)
        const last = await project.run(['tabs', 'close', '0'])
        expect(last.code).toBe(2)
        expect(last.stderr).toContain('Cannot close the last tab.')
    })

    it('switches into frames and scopes snapshots to them', async () => {
        await run('navigate', `${server.url}/frames.html?cross=${server.url.replace('localhost', '127.0.0.1')}`)
        const top = (await run('snapshot')).stdout
        const cross = top.match(/iframe "Cross origin frame" \[ref=(e\d+)\]/)![1]
        // the frame's content is part of the page's snapshot, with refs
        expect(top).toMatch(new RegExp(`iframe "Cross origin frame" \\[ref=${cross}\\]\n    - heading "Inside frame" \\[level=2\\]\n    - button "Frame button" \\[ref=e\\d+\\]`))

        const switched = await run('frame', cross)
        expect(switched.stdout).toMatch(new RegExp(`^Switched to frame ${cross} \\(iframe "Cross origin frame"\\)\nFrame:\n- document "Child frame"`))
        expect(switched.stdout).toMatch(/button "Frame button" \[ref=e\d+\]/)
        expect(switched.stdout).toContain("→ const frame = await page.frame(page.$('aria/Cross origin frame'))")
        const inner = (await run('snapshot')).stdout
        expect(inner.split('\n')[0]).toBe(`- document "Child frame" url=${server.url.replace('localhost', '127.0.0.1')}/frame-child.html`)
        expect(inner).toMatch(/button "Frame button" \[ref=e\d+\]/)
        expect((await run('info', '--json')).json.result.data.frame).toBe(`${cross} (iframe "Cross origin frame")`)
        const clicked = await run('click', 'button=Frame button')
        expect(clicked.stdout).toContain("→ await frame.$('button=Frame button').click()")
        expect((await run('snapshot')).stdout).toMatch(/button "Frame clicked" \[ref=e\d+\]/)
        const ref = (await run('snapshot')).stdout.match(/button "Frame clicked" \[ref=(e\d+)\]/)![1]
        expect((await run('click', ref)).code).toBe(0)

        expect((await run('frame', 'top')).stdout.startsWith('Switched to the top document\nPage: ')).toBe(true)
        expect((await run('snapshot')).stdout.split('\n')[0]).toContain('"Frames Fixture"')
        expect((await run('info', '--json')).json.result.data.frame).toBe('top')

        await run('frame', cross)
        expect((await run('frame', 'parent')).stdout.startsWith('Switched to the top document\n')).toBe(true)
        const notFrame = await project.run(['frame', 'aria/Frames'])
        expect(notFrame.code).toBe(2)
        expect(notFrame.stderr).toContain('is not a frame')
    })

    it('acts on a ref inside a cross-origin frame from the top document', async () => {
        const page = `${server.url}/frames.html?cross=${server.url.replace('localhost', '127.0.0.1')}`
        await run('navigate', page)
        const top = (await run('snapshot', '-i')).stdout
        const button = top.split('\n').slice(top.split('\n').findIndex((l) => l.includes('Cross origin frame'))).find((l) => l.includes('Frame button'))!.match(/\[ref=(e\d+)\]/)![1]
        const res = await run('click', button, '--json')
        expect(res.json.result.text).toContain('button "Frame clicked"')
        const code: string = res.json.result.code
        expect(code).toMatch(/^\{\n {4}const page = \(await browser\.browsingContexts\(\)\)\.find\(.*\)!\n {4}const frame = await page\.frame\(page\.\$\('aria\/Cross origin frame'\)\)\n {4}await frame\.\$\('role\/button\[name="Frame button"\]'\)\.click\(\)\n\}$/)
        // the session is back on the top document
        expect((await run('info', '--json')).json.result.data.frame).toBe('top')

        await run('navigate', page)
        await run('exec', '-e', code)
        const after = (await run('snapshot', '-i')).stdout
        expect(after.split('\n').slice(after.split('\n').findIndex((l) => l.includes('Cross origin frame'))).join('\n'), `replaying ${code}`).toContain('button "Frame clicked"')
    })

    it('keeps the frame the user entered when acting on a ref of another frame', async () => {
        await run('navigate', `${server.url}/frames.html?cross=${server.url.replace('localhost', '127.0.0.1')}`)
        const top = (await run('snapshot', '-i')).stdout
        const same = top.match(/iframe "Same origin frame" \[ref=(e\d+)\]/)![1]
        const lines = top.split('\n')
        const button = lines.slice(lines.findIndex((l) => l.includes('Cross origin frame'))).find((l) => l.includes('Frame button'))!.match(/\[ref=(e\d+)\]/)![1]
        await run('frame', same)
        await run('click', button)
        expect((await run('info', '--json')).json.result.data.frame).toContain(same)
        // the button that changed is in the cross-origin frame, not in the one the session holds
        const held = (await run('snapshot')).stdout
        expect(held.split('\n')[0]).toBe(`- document "Child frame" url=${server.url}/frame-child.html`)
        expect(held).toContain('button "Frame button"')
        await run('frame', 'top')
        const after = (await run('snapshot', '-i')).stdout
        expect(after.split('\n').slice(after.split('\n').findIndex((l) => l.includes('Cross origin frame'))).join('\n')).toContain('button "Frame clicked"')
    })

    it('goes back to the top document when the entered frame was removed by the action', async () => {
        await run('navigate', `${server.url}/frames-remove.html`)
        const top = (await run('snapshot', '-i')).stdout
        const kept = top.match(/iframe "Frame to remove" \[ref=(e\d+)\]/)![1]
        const remover = top.match(/button "Remove the other frame" \[ref=(e\d+)\]/)![1]
        await run('frame', kept)
        await run('click', remover)
        expect((await run('info', '--json')).json.result.data.frame).toBe('top')
        const after = (await run('snapshot', '-i')).stdout
        expect(after.split('\n')[0]).toContain('"Removed Frame Fixture"')
        expect(after).not.toContain('Frame to remove')
    })

    it('reads a ref of an inlined frame with --scope', async () => {
        await run('navigate', `${server.url}/frames.html?cross=${server.url.replace('localhost', '127.0.0.1')}`)
        const top = (await run('snapshot', '-i')).stdout
        const lines = top.split('\n')
        const button = lines.slice(lines.findIndex((l) => l.includes('Cross origin frame'))).find((l) => l.includes('Frame button'))!.match(/\[ref=(e\d+)\]/)![1]
        expect((await run('snapshot', '--scope', button)).stdout).toContain('button "Frame button"')
        expect((await run('info', '--json')).json.result.data.frame).toBe('top')
    })

    it('enters an iframe nested in an inlined frame by its ref', async () => {
        await run('navigate', `${server.url}/nested-frames.html`)
        const top = (await run('snapshot')).stdout
        const inner = top.match(/iframe "Inner frame" \[ref=(e\d+)\]/)![1]
        const entered = await run('frame', inner)
        expect(entered.stdout).toContain(`Switched to frame ${inner}`)
        expect(entered.stdout).toContain('button "Frame button"')
        expect(entered.stdout).toMatch(/const (frame\d*) = await page\.frame\(page\.\$\('aria\/Outer frame'\)\)\nconst frame\d* = await \1\.frame\(\1\.\$\('aria\/Inner frame'\)\)/)
        expect((await run('snapshot')).stdout.split('\n')[0]).toBe(`- document "Child frame" url=${server.url}/frame-child.html`)
        expect((await run('info', '--json')).json.result.data.frame).toContain(inner)
        await run('frame', 'parent')
        expect((await run('snapshot')).stdout.split('\n')[0]).toBe(`- document "Outer frame" url=${server.url}/nested-outer.html`)
        await run('frame', 'top')
    })

    it('navigating from inside a frame navigates the tab', async () => {
        await run('navigate', `${server.url}/frames.html`)
        const ref = (await run('snapshot')).stdout.match(/iframe "Same origin frame" \[ref=(e\d+)\]/)![1]
        await run('frame', ref)
        await run('navigate', `${server.url}/index.html`)
        expect((await run('exec', '-e', 'await browser.getTitle()')).stdout).toBe('Session Fixture\n')
        expect((await run('info', '--json')).json.result.data.frame).toBe('top')
    })

    it('accepts an alert and blocks other actions while it is open', async () => {
        await run('navigate', `${server.url}/dialogs.html`)
        await run('click', 'aria/Alert')
        await waitForDialog()
        expect((await run('info')).stdout).toMatch(/^dialog {10}alert "Hello"$/m)
        const blocked = await project.run(['snapshot', '--json'])
        expect(blocked.code).toBe(1)
        expect(blocked.json.error).toMatchObject({ code: 'DIALOG_OPEN', message: 'An alert dialog is open: "Hello"' })

        const accepted = await run('dialog', 'accept')
        expect(accepted.stdout).toBe('Accepted alert "Hello"\n→ browser.once(\'dialog\', (dialog) => dialog.accept())\n')
        expect(await text('#result')).toBe('accepted')
    })

    it('answers a prompt and dismisses a confirm', async () => {
        await run('click', 'aria/Prompt')
        await waitForDialog()
        await run('dialog', 'accept', '--text', 'Ada')
        expect(await text('#result')).toBe('answer: Ada')

        await run('click', 'aria/Confirm')
        await waitForDialog()
        await run('dialog', 'dismiss')
        expect(await text('#result')).toBe('cancelled')
    })

    it('fails when no dialog is open', async () => {
        const res = await project.run(['dialog', 'accept', '--json'])
        expect(res.code).toBe(1)
        expect(res.json.error).toMatchObject({ code: 'NOT_SUPPORTED', message: 'No dialog open.' })
    })

    it('rejects mobile-only context actions', async () => {
        for (const args of [['contexts'], ['rotate', 'portrait']]) {
            const res = await project.run([...args, '--json'])
            expect(res.code).toBe(1)
            expect(res.json.error).toMatchObject({ code: 'NOT_SUPPORTED', message: `"${args[0]}" is not supported for chrome sessions.` })
        }
    })
})

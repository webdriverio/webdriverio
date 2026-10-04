import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

/**
 * Widgets from live sites the session used to miss or fail on.
 */
describe('wdio session on widgets', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const refOf = (text: string, line: RegExp) => {
        const match = text.split('\n').find((l) => line.test(l))?.match(/\[ref=(e\d+)\]/)
        expect(match, `no ref for ${line} in\n${text}`).toBeTruthy()
        return match![1]
    }
    const load = () => run('navigate', `${server.url}/widgets.html`)
    const text = async (selector: string) => (await run('get', 'text', selector)).stdout.split('\n')[0]

    beforeAll(async () => {
        server = await startServer()
        project = createProject('widgets')
        await run('open', 'chrome', `${server.url}/widgets.html`)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('gives refs to elements that are clickable only by their cursor', async () => {
        await load()
        const page = (await run('snapshot', '-i')).stdout
        await run('click', refOf(page, /"1Y"/))
        expect(await text('#range')).toBe('Range: 1Y')
    })

    it('gives the options of a popover refs of their own', async () => {
        await load()
        await run('click', refOf((await run('snapshot', '-i')).stdout, /"More"/))
        const page = (await run('snapshot', '-i')).stdout
        expect(page).not.toContain('tooltip "5 years All"')
        await run('click', refOf(page, /"5 years"/))
        expect(await text('#range')).toBe('Range: 5Y')
    })

    it('shows icons that carry a name', async () => {
        await load()
        expect((await run('find', 'Benefit available')).stdout).toContain('img "Benefit available"')
    })

    it('checks a box that is hidden behind its label', async () => {
        await load()
        const res = await run('check', refOf((await run('snapshot', '-i')).stdout, /checkbox "Black"/))
        expect(res.stdout).toContain('Checked')
        expect((await run('exec', '-e', 'console.log(await browser.execute(() => document.getElementById("black").checked))')).stdout).toContain('true')
    })

    it('sets a slider widget that only follows the keyboard', async () => {
        await load()
        await run('fill', refOf((await run('snapshot', '-i')).stdout, /slider "Retirement age"/), '65')
        expect(await text('#age-result')).toBe('Retire at 65')
    })

    it('selects an option in a select inside a shadow root, also by a looser text', async () => {
        await load()
        const select = refOf((await run('snapshot', '-i')).stdout, /combobox "Condition/)
        await run('select', select, 'used')
        expect(await text('#condition')).toBe('Condition: Used')
        const missing = await project.run(['select', select, 'Refurbished'])
        expect(missing.code).toBe(2)
        expect(missing.stderr).toContain('Its options: "Any", "New", "Used".')
    })

    it('replaces a value the page puts back when it is cleared', async () => {
        await load()
        await run('fill', refOf((await run('snapshot', '-i')).stdout, /textbox "Location"/), '90210')
        expect((await run('get', 'value', '#where')).stdout.split('\n')[0]).toBe('90210')
    })
})

import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

/**
 * Inputs a person picks a value for (range, date, ARIA sliders) and the
 * actions agents use on pages that aren't plain forms: `press --times`,
 * `read`, coordinate clicks, scroll reports and refs in `exec`.
 */
interface Case {
    name: string
    args: string[]
    /** browser side expression returning the state the action changes */
    read: string
    expected: unknown
}

const CASES: Case[] = [
    { name: 'fill a range input', args: ['fill', '#volume', '70'], read: '[volume.value, changes.includes("volume")]', expected: ['70', true] },
    { name: 'fill a date input', args: ['fill', '#start', '2026-10-04'], read: '[start.value, changes.includes("start")]', expected: ['2026-10-04', true] },
    { name: 'fill a month input', args: ['fill', '#billing', '2026-10'], read: 'billing.value', expected: '2026-10' },
    { name: 'fill a time input', args: ['fill', '#meeting', '14:30'], read: 'meeting.value', expected: '14:30' },
    { name: 'fill an ARIA slider', args: ['fill', '#age', '31'], read: "age.getAttribute('aria-valuenow')", expected: '31' },
    { name: 'focus', args: ['focus', '#age'], read: 'document.activeElement.id', expected: 'age' },
    { name: 'press --times', args: ['press', 'ArrowRight', '--times', '4'], read: "age.getAttribute('aria-valuenow')", expected: '29' },
    { name: 'click a hidden checkbox through its label', args: ['click', '#terms'], read: 'terms.checked', expected: true },
    { name: 'click x,y', args: ['click', '{pad:50,40}'], read: "document.getElementById('pad-hit').textContent", expected: '50,40' }
]

describe('wdio session on picked inputs', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const load = () => run('navigate', `${server.url}/inputs.html`)
    const read = async (expr: string) => {
        const res = await run('exec', '-e', `JSON.stringify(await browser.execute(() => (${expr})) ?? null)`)
        return JSON.parse(res.stdout) ?? undefined
    }
    /** `{pad:x,y}` is a point inside the canvas, in viewport coordinates */
    const withPoints = async (args: string[]) => {
        const point = args.find((a) => a.startsWith('{pad:'))
        if (!point) {
            return args
        }
        const [x, y] = point.slice(5, -1).split(',').map(Number)
        const origin = await read('(() => { const r = pad.getBoundingClientRect(); return [r.left, r.top] })()') as number[]
        return args.map((a) => a === point ? `${Math.round(origin[0] + x)},${Math.round(origin[1] + y)}` : a)
    }
    const prepare = async (c: Case) => {
        await load()
        if (c.name === 'press --times') {
            await run('exec', '-e', "await browser.execute(() => document.getElementById('age').focus())")
        }
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('inputs')
        await run('open', 'chrome', `${server.url}/inputs.html`, '--viewport', '1280x720')
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    for (const c of CASES) {
        it(`${c.name}: changes the page and the printed code reproduces it`, async () => {
            await prepare(c)
            const res = await run(...await withPoints(c.args), '--json')
            const code: string = res.json.result.code
            expect(code).toMatch(/^await |^for /)
            expect(await read(c.read)).toEqual(c.expected)

            await prepare(c)
            await run('exec', '-e', code)
            expect(await read(c.read), `replaying ${code}`).toEqual(c.expected)
        })
    }

    it('reports the value a range input took', async () => {
        await load()
        const res = await run('fill', '#volume', '67')
        expect(res.stdout).toContain('to 65 (it took 65: the nearest allowed value)')
    })

    it('rejects a date in the wrong format with the format it takes', async () => {
        await load()
        const res = await project.run(['fill', '#start', '10/04/2026'])
        expect(res.code).not.toBe(0)
        expect(res.stderr).toContain('did not take "10/04/2026"')
        expect(res.stderr).toContain('2026-10-04')
    })

    it('reports where an ARIA slider stops at its bound', async () => {
        await load()
        const res = await project.run(['fill', '#age', '99'])
        expect(res.code).not.toBe(0)
        expect(res.stderr).toContain('stopped at 85, not 99')
    })

    it('says what covers an element instead of clicking it', async () => {
        await load()
        const res = await project.run(['click', '#under'])
        expect(res.code).not.toBe(0)
        expect(res.stderr).toContain('is covered by')
        expect(res.stderr).toContain('Cookie banner')
    })

    it('says when nothing is at a point', async () => {
        await load()
        const res = await project.run(['click', '5000,5000'])
        expect(res.code).not.toBe(0)
    })

    it('reads the main content as text, without navigation', async () => {
        await load()
        const res = await run('read')
        expect(res.stdout).toContain('# Inputs')
        expect(res.stdout).toContain('- First point')
        expect(res.stdout).toContain('| Basic | $5 |')
        expect(res.stdout).toContain('[the form page](')
        expect(res.stdout).not.toContain('Skip me in read')
        const short = await run('read', '--max-chars', '20')
        expect(short.stdout).toContain('cut at 20 characters')
    })

    it('lists what is in view after scrolling', async () => {
        await load()
        const top = await run('scroll', 'top')
        expect(top.stdout).toContain('In view:')
        expect(top.stdout).not.toContain('Far down')
        const bottom = await run('scroll', 'bottom')
        expect(bottom.stdout).toContain('In view:')
        expect(bottom.stdout).toContain('Far down')
    })

    it('takes refs in exec code', async () => {
        await load()
        const snapshot = (await run('snapshot', '-i')).stdout
        const ref = snapshot.split('\n').find((l) => l.includes('slider "Age"'))?.match(/\[ref=(e\d+)\]/)?.[1]
        expect(ref, snapshot).toBeTruthy()
        const res = await run('exec', '-e', `await $('${ref}').getAttribute('aria-valuenow')`)
        expect(res.stdout.trim()).toContain('25')
    })

    it('points exec code that uses the page globals to browser.execute', async () => {
        const res = await project.run(['exec', '-e', 'document.title'])
        expect(res.code).not.toBe(0)
        expect(res.stderr).toContain('browser.execute')
    })
})

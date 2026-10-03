import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, SITE, type FixtureServer, type Project } from './helpers.js'

interface Case {
    name: string
    page: string
    /**
     * action arguments, `{ref:Name}` is replaced by the ref of the snapshot
     * line containing `Name`
     */
    args: string[]
    setup?: string[][]
    /**
     * browser side expression returning the state the action changes
     */
    read: string
    expected: unknown
}

const AVATAR = path.join(SITE, 'style.css')

const CASES: Case[] = [
    { name: 'fill', page: 'form', args: ['fill', '{ref:textbox "Email"}', 'agent@example.com'], read: 'email.value', expected: 'agent@example.com' },
    { name: 'click', page: 'form', args: ['click', '{ref:checkbox "Remember me"}'], read: 'remember.checked', expected: false },
    { name: 'click (selector)', page: 'cart', args: ['click', '[data-testid="add-red"]'], read: "document.getElementById('cart-link').textContent", expected: 'Cart (1)' },
    { name: 'click --double', page: 'form', args: ['click', '#hover-target', '--double'], setup: [['exec', '-e', "await browser.execute(() => document.getElementById('hover-target').addEventListener('dblclick', (e) => { e.target.dataset.double = 'yes' }))"]], read: "document.getElementById('hover-target').dataset.double", expected: 'yes' },
    { name: 'click --right', page: 'form', args: ['click', '#hover-target', '--right'], setup: [['exec', '-e', "await browser.execute(() => document.getElementById('hover-target').addEventListener('contextmenu', (e) => { e.preventDefault(); e.target.dataset.right = 'yes' }))"]], read: "document.getElementById('hover-target').dataset.right", expected: 'yes' },
    { name: 'select', page: 'form', args: ['select', '{ref:combobox "Country"}', 'France'], read: 'country.value', expected: 'fr' },
    { name: 'select --by value', page: 'form', args: ['select', '#country', 'us', '--by', 'value'], read: 'country.value', expected: 'us' },
    { name: 'select --by index', page: 'form', args: ['select', '#country', '1', '--by', 'index'], read: 'country.value', expected: 'fr' },
    { name: 'upload', page: 'form', args: ['upload', '{ref:textbox "Avatar"}', AVATAR], read: 'avatar.files.length + avatar.files[0].name', expected: '1style.css' },
    { name: 'hover', page: 'form', args: ['hover', '#hover-target'], read: "document.getElementById('hover-target').dataset.hovered", expected: 'yes' },
    { name: 'drag', page: 'form', args: ['drag', '{ref:button "Drag me"}', '{ref:region "Drop zone"}'], read: "document.getElementById('drop-status').textContent", expected: 'Dropped' },
    { name: 'type', page: 'form', setup: [['click', '#keys']], args: ['type', 'hello'], read: 'keys.value', expected: 'hello' },
    { name: 'press', page: 'form', setup: [['click', '#keys']], args: ['press', 'Control+a'], read: 'keys.dataset.last', expected: 'Control+a' },
    { name: 'press Enter submits', page: 'form', setup: [['fill', '#email', 'a@b.c']], args: ['press', 'Enter'], read: "document.getElementById('status').textContent", expected: 'Submitted a@b.c' },
    { name: 'scroll <target>', page: 'form', args: ['scroll', '{ref:button "Bottom button"}'], read: "(() => { const r = document.getElementById('bottom').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight })()", expected: true },
    { name: 'scroll down', page: 'form', args: ['scroll', 'down', '--px', '300'], read: 'Math.round(scrollY)', expected: 300 },
    { name: 'scroll bottom', page: 'form', args: ['scroll', 'bottom'], read: 'Math.round(scrollY + innerHeight) >= document.documentElement.scrollHeight - 1', expected: true },
    { name: 'scroll top', page: 'form', setup: [['scroll', 'bottom']], args: ['scroll', 'top'], read: 'scrollY', expected: 0 }
]

describe('wdio session interaction shortcuts', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }
    const load = (page: string) => run('navigate', `${server.url}/${page}.html`)
    const read = async (expr: string) => {
        const res = await run('exec', '-e', `JSON.stringify(await browser.execute(() => (${expr})) ?? null)`)
        return JSON.parse(res.stdout) ?? undefined
    }
    const withRefs = async (args: string[]) => {
        if (!args.some((a) => a.startsWith('{ref:'))) {
            return args
        }
        const text = (await run('snapshot')).stdout.split('\n')
        return args.map((arg) => {
            const name = arg.match(/^\{ref:(.*)\}$/)?.[1]
            if (!name) {
                return arg
            }
            const ref = text.find((l) => l.includes(`- ${name}`))?.match(/\[ref=(e\d+)\]/)?.[1]
            expect(ref, `no ref for ${name}`).toBeTruthy()
            return ref!
        })
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('interact')
        await run('open', 'chrome', `${server.url}/form.html`, '--viewport', '1280x720')
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    for (const c of CASES) {
        it(`${c.name}: changes the page and the printed code reproduces it`, async () => {
            await load(c.page)
            for (const step of c.setup || []) {
                await run(...step)
            }
            const res = await run(...await withRefs(c.args), '--json')
            const code: string = res.json.result.code
            expect(code).toMatch(/^(const remotePath = )?await /)
            expect(code).not.toMatch(/\be\d+\b/)
            expect(await read(c.read)).toEqual(c.expected)

            await load(c.page)
            for (const step of c.setup || []) {
                await run(...step)
            }
            await run('exec', '-e', code)
            expect(await read(c.read), `replaying ${code}`).toEqual(c.expected)
        })
    }

    it('prints the action and the code in text mode', async () => {
        await load('cart')
        const res = await run('click', 'aria/Cart (0)')
        expect(res.stdout.startsWith('Clicked "aria/Cart (0)"\n')).toBe(true)
        expect(res.stdout.endsWith('→ await $(\'aria/Cart (0)\').click()\n')).toBe(true)
        const quiet = await run('click', '[data-testid="add-blue"]', '-q')
        expect(quiet.stdout).toBe('')
    })

    it('reports navigation caused by a click', async () => {
        await load('index')
        const res = await run('click', 'aria/Form')
        // a navigation lists the new page's elements, so the next step needs no snapshot
        expect(res.stdout.startsWith(`Clicked "aria/Form"\nNavigated to ${server.url}/form.html\nPage: ${server.url}/form.html\n- document "Form Fixture"`)).toBe(true)
        expect(res.stdout).toMatch(/textbox "Email" \[ref=e\d+\]/)
        expect(res.stdout.endsWith('→ await $(\'aria/Form\').click()\n')).toBe(true)
    })

    it('navigates, goes back and forward and reloads', async () => {
        const nav = await run('navigate', `localhost:${server.port}/index.html`)
        expect(nav.stdout.startsWith(`Navigated to ${server.url}/index.html — Session Fixture\nPage: ${server.url}/index.html\n`)).toBe(true)
        expect(nav.stdout.endsWith(`→ await browser.url('${server.url}/index.html')\n`)).toBe(true)
        await load('cart')
        const back = (await run('back')).stdout
        expect(back.startsWith(`Went back → ${server.url}/index.html\nPage: ${server.url}/index.html\n`)).toBe(true)
        expect(back.endsWith('→ await browser.back()\n')).toBe(true)
        const forward = (await run('forward')).stdout
        expect(forward.startsWith(`Went forward → ${server.url}/cart.html\nPage: ${server.url}/cart.html\n`)).toBe(true)
        expect(forward.endsWith('→ await browser.forward()\n')).toBe(true)
        await run('click', '[data-testid="add-blue"]')
        expect(await read("document.getElementById('cart-link').textContent")).toBe('Cart (1)')
        const reloaded = (await run('reload')).stdout
        expect(reloaded.startsWith(`Reloaded → ${server.url}/cart.html\n`)).toBe(true)
        expect(reloaded.endsWith('→ await browser.refresh()\n')).toBe(true)
        expect(await read("document.getElementById('cart-link').textContent")).toBe('Cart (0)')
    })

    it('fails with a clear error for ambiguous and missing targets', async () => {
        await load('cart')
        const ambiguous = await project.run(['click', 'aria/Add to cart', '--json'])
        expect(ambiguous.code).toBe(1)
        expect(ambiguous.json.error.code).toBe('ELEMENT_NOT_FOUND')
        const missing = await project.run(['click', '#nope', '--json'])
        expect(missing.json.error).toMatchObject({ code: 'ELEMENT_NOT_FOUND', message: 'No element matches "#nope".' })
        const badKey = await project.run(['press', 'Control+Foo'])
        expect(badKey.code).toBe(2)
        expect(badKey.stderr).toContain('Unknown key "Foo".')
    })

    it('rejects mobile-only actions in Chrome', async () => {
        for (const args of [['tap', '#email'], ['swipe', 'up'], ['long-press', '#email']]) {
            const res = await project.run([...args, '--json'])
            expect(res.code).toBe(1)
            expect(res.json.error).toMatchObject({ code: 'NOT_SUPPORTED', message: `"${args[0]}" is not supported for chrome sessions.` })
        }
    })
})

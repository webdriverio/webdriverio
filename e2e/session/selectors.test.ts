import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

/**
 * The selector a snapshot attaches to a ref must find exactly that element when a script
 * runs it later, in a WebDriver BiDi session and in a classic one (#16095).
 */
describe.each([
    ['WebDriver BiDi', []],
    ['WebDriver classic', ['--no-bidi']]
])('wdio session snapshot selectors (%s)', (_protocol, openArgs) => {
    let server: FixtureServer
    let project: Project

    const run = (...args: string[]) => project.run(args)

    beforeAll(async () => {
        server = await startServer()
        project = createProject('selectors')
        const open = await project.run(['open', 'chrome', `${server.url}/names.html`, '--no-snapshot', ...openArgs])
        expect(open.code, open.stderr).toBe(0)
    }, 60_000)

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('attaches only selectors that find exactly the element of their ref', async () => {
        const snapshot = await run('snapshot', '-i', '--selectors')
        expect(snapshot.code, snapshot.stderr).toBe(0)
        const refs = snapshot.stdout.split('\n')
            .map((line) => line.match(/\[ref=(e\d+)\].*?(?: {2}→ (.+?)(?: \(positional\))?)?$/))
            .filter((match): match is RegExpMatchArray => Boolean(match))
            .map(([, id, selector]) => ({ id, selector }))
        const withSelector = refs.filter(({ selector }) => selector)
        // 3 links, Submit, Save draft and the 2 "Same" buttons
        expect(withSelector.length, snapshot.stdout).toBeGreaterThanOrEqual(7)

        for (const { id, selector } of withSelector) {
            const check = await run('exec', '-e', [
                `const found = await $$(${JSON.stringify(selector)}).getElements()`,
                `return found.length === 1 && await found[0].isEqual(await ref(${JSON.stringify(id)})) ? 'ok' : 'found ' + found.length`
            ].join('; '))
            expect(check.code, check.stderr).toBe(0)
            expect(`${id} ${selector}: ${check.stdout.trim()}`).toBe(`${id} ${selector}: ok`)
        }
    })

    it('acts on a nameless button repeated in shadow roots, which has no selector of its own', async () => {
        const snapshot = await run('snapshot', '-i', '--selectors')
        const nameless = snapshot.stdout.split('\n').filter((line) => /- button \[ref=e\d+\]/.test(line))
        expect(nameless, snapshot.stdout).toHaveLength(3)
        const id = nameless[1].match(/\[ref=(e\d+)\]/)![1]

        const clicked = await run('click', id)
        expect(clicked.code, clicked.stderr).toBe(0)
        const marked = await run('exec', '-e', 'return await browser.execute(() => [...document.querySelectorAll("icon-button")].map((el) => el.hasAttribute("data-clicked")))')
        expect(JSON.parse(marked.stdout)).toEqual([false, true, false])
    })
})

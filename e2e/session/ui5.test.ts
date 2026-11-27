import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, FIXTURES, type Project } from './helpers.js'

const UI5_APP_URL = 'https://sdk.openui5.org/test-resources/sap/m/demokit/cart/webapp/index.html'
const UI5_TEST_TIMEOUT_MS = 120_000
const UI5_RENDER_LIMIT_MS = 30_000
const ACCESSORIES = 'Accessories'
const ACCESSORIES_HASH = '#/category/AC'
const ACCESSORIES_RENDERED = `window.sap?.ui?.core?.Element?.registry.filter((x) => x.getMetadata().getName() === 'sap.m.StandardListItem' && x.getTitle() === '${ACCESSORIES}').some((c) => c.getDomRef())`
const ACCESSORIES_ITEM = `"Open category ${ACCESSORIES}"`
const ACCESSORIES_SELECTOR = `ui5:${JSON.stringify({ controlType: 'sap.m.StandardListItem', properties: { title: ACCESSORIES } })}`
const SEARCH_FIELD_SELECTOR = 'ui5:{"id":"container-cart---homeView--searchField"}'
const UI5_CALL = 'custom$(\'ui5\''

describe('wdio session with the ui5 selector provider', () => {
    let project: Project

    const run = (...args: string[]) => project.run(args)
    const accessoriesLine = (stdout: string) => stdout.split('\n').find((line) => line.includes(ACCESSORIES_ITEM)) ?? ''
    const sandbox = process.platform === 'linux' ? ['--arg=--no-sandbox'] : []
    const provider = path.join(FIXTURES, 'ui5-selector-provider.mjs')

    const openApp = async (...extra: string[]) => {
        const opened = await run('open', 'chrome', UI5_APP_URL, '--no-snapshot', ...sandbox, ...extra)
        expect(opened.code, opened.stderr).toBe(0)
        const rendered = await run('wait', '--fn', ACCESSORIES_RENDERED, '--limit', String(UI5_RENDER_LIMIT_MS))
        expect(rendered.code, rendered.stderr).toBe(0)
    }

    beforeAll(() => {
        project = createProject('ui5')
    })

    afterAll(async () => {
        await project.cleanup()
    })

    it('baseline without provider has no ui5 selectors', async () => {
        await openApp()
        const snapshot = await run('snapshot', '-i', '--selectors')
        expect(snapshot.code, snapshot.stderr).toBe(0)
        expect(snapshot.stdout).not.toContain('ui5:')
        expect(accessoriesLine(snapshot.stdout)).toContain(ACCESSORIES_ITEM)
    }, UI5_TEST_TIMEOUT_MS)

    it('provider replaces selectors with ui5 control selectors', async () => {
        await openApp('--replace', '--selector-provider', provider)
        const snapshot = await run('snapshot', '-i', '--selectors')
        expect(snapshot.code, snapshot.stderr).toBe(0)
        const line = accessoriesLine(snapshot.stdout)
        expect(line).toContain(ACCESSORIES_SELECTOR)
        expect(snapshot.stdout).toContain(SEARCH_FIELD_SELECTOR)
    }, UI5_TEST_TIMEOUT_MS)

    it('resolves a typed ui5 selector', async () => {
        const waited = await run('wait', SEARCH_FIELD_SELECTOR)
        expect(waited.code, waited.stderr).toBe(0)
        const history = await run('history')
        expect(history.stdout).toContain(UI5_CALL)
    }, UI5_TEST_TIMEOUT_MS)

    it('clicks a ref resolved through the ui5 locator', async () => {
        const snapshot = await run('snapshot', '-i', '--selectors')
        expect(snapshot.code, snapshot.stderr).toBe(0)
        const ref = accessoriesLine(snapshot.stdout).match(/\[ref=(e\d+)\]/)?.[1]
        expect(ref, snapshot.stdout).toBeDefined()

        const clicked = await run('click', ref!)
        expect(clicked.code, clicked.stderr).toBe(0)
        const history = await run('history')
        expect(history.stdout).toContain(UI5_CALL)
        const hash = await run('exec', '-e', 'return await browser.execute(() => location.hash)')
        expect(hash.stdout).toContain(ACCESSORIES_HASH)
    }, UI5_TEST_TIMEOUT_MS)
})

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { loadSelectorProviders, serializeSelectorProviders, type SelectorProvider } from '../src/providers.js'

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url))
const PACKAGES_CWD = path.join(FIXTURES, 'providers-cwd')
const NODE_MODULES = path.join(PACKAGES_CWD, 'node_modules')

/**
 * Packages live under `cwd/node_modules` only, so discovery must resolve from `cwd`.
 * Generated, not committed: `node_modules` is gitignored.
 */
function writePackage (name: string, files: Record<string, string>) {
    const dir = path.join(NODE_MODULES, name)
    fs.mkdirSync(dir, { recursive: true })
    for (const [file, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(dir, file), content)
    }
}

describe('loadSelectorProviders', () => {
    beforeAll(() => {
        writePackage('@wdio/fixture-selector-service', {
            'package.json': JSON.stringify({ name: '@wdio/fixture-selector-service', type: 'module', exports: { '.': './index.js', './selector-provider': './provider.js' } }),
            'index.js': 'export default {}\n',
            'provider.js': "export default { name: 'fixture', attributes: ['data-fixture'] }\n"
        })
        writePackage('@wdio/fixture-bare-service', {
            'package.json': JSON.stringify({ name: '@wdio/fixture-bare-service', type: 'module', exports: { '.': './index.js' } }),
            'index.js': 'export default {}\n'
        })
        writePackage('fixture-default-provider', {
            'package.json': JSON.stringify({ name: 'fixture-default-provider', type: 'module', exports: { '.': './index.js' } }),
            'index.js': "export default { name: 'pkgdefault', attributes: ['data-pkg'] }\n"
        })
    })

    afterAll(() => {
        fs.rmSync(PACKAGES_CWD, { recursive: true, force: true })
    })

    it('loads a provider from a path relative to cwd', async () => {
        const list = await loadSelectorProviders(['./providers/attribute-provider.mjs'], { cwd: FIXTURES })
        expect(list).toEqual([{ name: 'e2e', attributes: ['data-e2e'] }])
    })

    it('calls a factory default export with the tuple options', async () => {
        const list = await loadSelectorProviders([['./providers/factory-provider.mjs', { name: 'attr', attribute: 'data-id' }]], { cwd: FIXTURES })
        expect(list).toEqual([{ name: 'attr', attributes: ['data-id'] }])
    })

    it('finds the selector-provider subpath of a service in cwd', async () => {
        const list = await loadSelectorProviders([], { cwd: PACKAGES_CWD, services: ['fixture-selector'] })
        expect(list).toEqual([{ name: 'fixture', attributes: ['data-fixture'] }])
    })

    it('skips a service whose package has no selector-provider subpath', async () => {
        const list = await loadSelectorProviders([], { cwd: PACKAGES_CWD, services: ['fixture-bare', 'no-such-thing'] })
        expect(list).toEqual([])
    })

    it('loads an explicit package name from its selector-provider subpath', async () => {
        const list = await loadSelectorProviders(['@wdio/fixture-selector-service'], { cwd: PACKAGES_CWD })
        expect(list).toEqual([{ name: 'fixture', attributes: ['data-fixture'] }])
    })

    it('loads an explicit package name from its default export when it has no subpath', async () => {
        const list = await loadSelectorProviders(['fixture-default-provider'], { cwd: PACKAGES_CWD })
        expect(list).toEqual([{ name: 'pkgdefault', attributes: ['data-pkg'] }])
    })

    it('throws on an explicit entry that resolves to nothing, naming the specifiers tried', async () => {
        await expect(loadSelectorProviders(['no-such-provider'], { cwd: PACKAGES_CWD }))
            .rejects.toThrow('Selector provider "no-such-provider" not found, tried: @wdio/no-such-provider-service/selector-provider, wdio-no-such-provider-service/selector-provider, no-such-provider/selector-provider, no-such-provider')
    })

    it('throws on a provider name outside the selector prefix grammar', async () => {
        await expect(loadSelectorProviders([{ name: 'Bad Name', attributes: ['data-x'] }], { cwd: FIXTURES }))
            .rejects.toThrow('Invalid selector provider name "Bad Name"')
    })

    it('throws on a provider without a name', async () => {
        await expect(loadSelectorProviders([{ attributes: ['data-x'] } as unknown as SelectorProvider], { cwd: FIXTURES }))
            .rejects.toThrow('Invalid selector provider name "undefined"')
    })
})

describe('serializeSelectorProviders', () => {
    it('stores the functions as source and keeps the rest', () => {
        const candidates = (el: { id: string }) => el.id
        const locator = (arg: string) => globalThis.document?.querySelector(arg) ?? null
        const [serialized] = serializeSelectorProviders([{ name: 'ui5', attributes: ['data-id'], candidates, locator }])
        expect(serialized).toEqual({ name: 'ui5', attributes: ['data-id'], candidates: candidates.toString(), locator: locator.toString() })
    })

    it('omits the functions a provider does not have', () => {
        expect(serializeSelectorProviders([{ name: 'e2e', attributes: ['data-e2e'] }])).toEqual([{ name: 'e2e', attributes: ['data-e2e'] }])
        expect(serializeSelectorProviders([{ name: 'e2e' }])[0]).not.toHaveProperty('candidates')
    })

    it('throws on a generator method, which the page cannot run', () => {
        const candidates = { * candidates (el: Element) {
            yield el.id
        } }.candidates as unknown as SelectorProvider['candidates']
        expect(() => serializeSelectorProviders([{ name: 'gen', candidates }]))
            .toThrow('Selector provider "gen": candidates cannot be serialized (generators, getters and computed names are unsupported)')
    })
})

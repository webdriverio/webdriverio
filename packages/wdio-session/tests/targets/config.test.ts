import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type * as UtilsNode from '@wdio/utils/node'
import type * as Providers from '@wdio/snapshot/providers'
import { describe, it, expect, afterEach, vi } from 'vitest'

const resolveOptionalDependency = vi.hoisted(() => vi.fn())
vi.mock('@wdio/utils/node', async (importActual) => ({
    ...await importActual<typeof UtilsNode>(),
    resolveOptionalDependency
}))

const loadSelectorProviders = vi.hoisted(() => vi.fn(async (): Promise<unknown[]> => []))
vi.mock('@wdio/snapshot/providers', async (importActual) => ({
    ...await importActual<typeof Providers>(),
    loadSelectorProviders
}))

import { buildPlan } from '../../src/targets/index.js'

const dirs: string[] = []

function writeConfig (name: string, body: string) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-config-target-'))
    dirs.push(dir)
    fs.writeFileSync(path.join(dir, name), body)
    return dir
}

const ctx = (cwd: string) => ({
    name: 'default',
    cwd,
    runtimeDir: path.join(cwd, 'run'),
    artifactsDir: path.join(cwd, 'artifacts'),
    argv: ['open', './wdio.conf.ts', '0'],
    env: {} as NodeJS.ProcessEnv,
    platform: 'linux' as const
})

afterEach(() => {
    resolveOptionalDependency.mockReset()
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

const chrome = `{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] }
}`

describe('config targets', () => {
    it('loads a TypeScript config without tsx through Node type stripping', async () => {
        resolveOptionalDependency.mockResolvedValue(null)
        const dir = writeConfig('wdio.conf.ts', `
            const caps: Record<string, unknown>[] = [${chrome}]
            export const config = { capabilities: caps }
        `)
        const plan = await buildPlan({ target: './wdio.conf.ts', url: '0' }, ctx(dir))
        expect(plan.label).toBe('chrome')
        expect(resolveOptionalDependency).toHaveBeenCalledWith('tsx', expect.anything())
    })

    it('reports MISSING_DEPENDENCY when tsx is missing and the TypeScript config cannot load', async () => {
        resolveOptionalDependency.mockResolvedValue(null)
        const dir = writeConfig('wdio.conf.ts', 'throw new Error("cannot load")')
        await expect(buildPlan({ target: './wdio.conf.ts', url: '0' }, ctx(dir))).rejects.toMatchObject({
            code: 'MISSING_DEPENDENCY',
            package: 'tsx'
        })
    })

    it('loads a TypeScript config capability, baseUrl and ignores other services', async () => {
        const dir = writeConfig('wdio.conf.ts', `
            export const config = {
                baseUrl: 'http://localhost:9',
                hostname: '127.0.0.1',
                port: 4444,
                waitforTimeout: 5000,
                services: ['shared-store', ['visual', { baselineFolder: '/baselines' }]],
                capabilities: [${chrome}]
            }
        `)
        const plan = await buildPlan({ target: './wdio.conf.ts', url: '0' }, ctx(dir))
        expect(plan.capabilities).toMatchObject({
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] }
        })
        expect(plan.remote).toMatchObject({
            baseUrl: 'http://localhost:9',
            hostname: '127.0.0.1',
            port: 4444,
            waitforTimeout: 5000
        })
        expect(plan.configPath).toBe(path.join(dir, 'wdio.conf.ts'))
        expect(plan.headless).toBe(true)
        expect(plan.display).toBe(false)
        expect(plan.platform).toBe('browser')
        expect(plan.visualOptions).toEqual({ baselineFolder: '/baselines' })
        expect(plan.notes).toEqual([
            'Ignoring service "shared-store"; wdio session only applies visual, electron, tauri, dioxus and appium service options.'
        ])
        expect(plan.url).toBeUndefined()
    })

    it('loads the snapshots entries with every service name into the plan', async () => {
        const dir = writeConfig('wdio.conf.ts', `
            export const config = {
                services: ['e2e-tools', ['visual', {}]],
                snapshots: ['./providers/e2e.mjs'],
                capabilities: [${chrome}]
            }
        `)
        loadSelectorProviders.mockResolvedValueOnce([{ name: 'e2e', attributes: ['data-e2e'] }])
        const plan = await buildPlan({ target: './wdio.conf.ts', url: '0' }, ctx(dir))
        expect(loadSelectorProviders).toHaveBeenCalledWith(['./providers/e2e.mjs'], { cwd: dir, services: ['e2e-tools', 'visual'] })
        expect(plan.selectorProviders).toEqual([{ name: 'e2e', attributes: ['data-e2e'] }])
        expect(plan.notes).toContain('Loaded selector provider "e2e"')
    })

    it('adds the --selector-provider entries after the config providers', async () => {
        const dir = writeConfig('wdio.conf.ts', `export const config = { snapshots: ['./cfg.mjs'], capabilities: [${chrome}] }`)
        loadSelectorProviders
            .mockResolvedValueOnce([{ name: 'cfg' }])
            .mockResolvedValueOnce([{ name: 'flag', attributes: ['data-flag'] }])
        const plan = await buildPlan({ target: './wdio.conf.ts', url: '0', selectorProvider: ['./flag.mjs'] }, ctx(dir))
        expect(loadSelectorProviders).toHaveBeenLastCalledWith(['./flag.mjs'], { cwd: dir })
        expect(plan.selectorProviders).toEqual([{ name: 'cfg' }, { name: 'flag', attributes: ['data-flag'] }])
    })

    it('rejects a provider name that the config and a flag both load', async () => {
        const dir = writeConfig('wdio.conf.ts', `export const config = { snapshots: ['./cfg.mjs'], capabilities: [${chrome}] }`)
        loadSelectorProviders
            .mockResolvedValueOnce([{ name: 'cfg' }])
            .mockResolvedValueOnce([{ name: 'cfg' }])
        await expect(buildPlan({ target: './wdio.conf.ts', url: '0', selectorProvider: ['./flag.mjs'] }, ctx(dir)))
            .rejects.toThrow('Selector provider "cfg" is loaded more than once.')
    })

    it('loads --selector-provider for a browser target too', async () => {
        const dir = writeConfig('unused.txt', '')
        loadSelectorProviders.mockResolvedValueOnce([{ name: 'flag' }])
        const plan = await buildPlan({ target: 'chrome', selectorProvider: ['./flag.mjs'] }, ctx(dir))
        expect(loadSelectorProviders).toHaveBeenCalledWith(['./flag.mjs'], { cwd: dir })
        expect(plan.selectorProviders).toEqual([{ name: 'flag' }])
    })

    it('selects a named multi-remote capability', async () => {
        const dir = writeConfig('wdio.conf.js', `
            export const config = {
                capabilities: {
                    browserA: { capabilities: { browserName: 'firefox' } }
                }
            }
        `)
        const plan = await buildPlan({ target: 'wdio.conf.js', url: 'browserA' }, ctx(dir))
        expect(plan.capabilities).toMatchObject({ browserName: 'firefox' })
        expect(plan.label).toBe('firefox')
    })

    it('rejects a missing capability index', async () => {
        const dir = writeConfig('wdio.conf.js', `export const config = { capabilities: [${chrome}] }`)
        await expect(buildPlan({ target: 'wdio.conf.js', url: '3' }, ctx(dir))).rejects.toThrow('No capability at index 3')
        await expect(buildPlan({ target: 'wdio.conf.js' }, ctx(dir))).rejects.toThrow('Name the capability')
    })
})

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

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
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

const chrome = `{
    browserName: 'chrome',
    'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu'] }
}`

describe('config targets', () => {
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

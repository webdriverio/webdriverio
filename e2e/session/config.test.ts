import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio session config target', () => {
    let server: FixtureServer
    let project: Project

    const run = async (...args: string[]) => {
        const res = await project.run(args)
        expect(res.code, `${args.join(' ')}\n${res.stderr}`).toBe(0)
        return res
    }

    beforeAll(async () => {
        server = await startServer()
        project = createProject('config')
        fs.writeFileSync(path.join(project.dir, 'wdio.conf.ts'), `
export const config = {
    runner: 'local',
    specs: [],
    baseUrl: ${JSON.stringify(server.url)},
    services: ['shared-store'],
    logLevel: 'error',
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': { args: ['--headless=new', '--disable-gpu', '--window-size=1280,720'] }
    }]
}
`)
    })

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('opens a config capability, resolves baseUrl, and notes an unsupported service', async () => {
        const opened = await project.run(['open', './wdio.conf.ts', '0'])
        expect(opened.code, opened.stderr + opened.stdout).toBe(0)
        expect(opened.stderr).toContain('shared-store')
        const info = await run('info', '--json')
        expect(info.json.result.data.capabilities.browserName).toBe('chrome')
        expect(info.json.result.data.config).toContain('wdio.conf.ts')
        await run('navigate', '/cart.html')
        const url = (await run('exec', '-e', 'await browser.getUrl()')).stdout.trim()
        expect(url).toBe(`${server.url}/cart.html`)
    }, 60_000)
})
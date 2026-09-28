import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { createProject, startServer, type FixtureServer, type Project } from './helpers.js'

describe('wdio session missing dependencies', () => {
    let server: FixtureServer
    let project: Project
    let fakePrefix: string

    beforeAll(async () => {
        server = await startServer()
        project = createProject('deps')
        fakePrefix = path.join(project.dir, 'global-prefix')
        fs.mkdirSync(fakePrefix)
        fs.writeFileSync(path.join(project.dir, 'package.json'), JSON.stringify({ name: 'deps-project', private: true }))
        fs.writeFileSync(path.join(project.dir, 'pnpm-lock.yaml'), '')
    })

    afterAll(async () => {
        await project.cleanup()
        await server.close()
    })

    it('exits 3 when Appium is not installed', async () => {
        const env = { npm_config_prefix: fakePrefix, NPM_CONFIG_PREFIX: fakePrefix }
        const { code, json } = await project.run(['open', 'android', '--app', './app.apk', '--json'], { env })
        expect(code).toBe(3)
        expect(json).toEqual({
            ok: false,
            session: 'default',
            action: 'open',
            error: {
                code: 'MISSING_DEPENDENCY',
                message: 'Cannot open an Android session: Appium is not installed.',
                hint: 'Run `wdio session doctor android` to check your whole setup.',
                package: 'appium',
                install: ['pnpm add -D appium@^3', 'npx appium driver install uiautomator2']
            }
        })
        expect(fs.existsSync(project.runtimeDir) ? fs.readdirSync(project.runtimeDir) : []).toEqual([])
    })

    it('renders install instructions in text mode', async () => {
        const env = { npm_config_prefix: fakePrefix, NPM_CONFIG_PREFIX: fakePrefix }
        const { code, stdout, stderr } = await project.run(['open', 'ios', '--bundle-id', 'com.example'], { env })
        expect(code).toBe(3)
        expect(stdout).toBe('')
        expect(stderr).toContain('✖ Cannot open an iOS session: Appium is not installed.')
        expect(stderr).toContain('pnpm add -D appium@^3')
        expect(stderr).toContain('npx appium driver install xcuitest')
    })

    it('exits 3 on the first visual action without @wdio/visual-service', async () => {
        const open = await project.run(['open', 'chrome', `${server.url}/index.html`])
        expect(open.code, open.stderr).toBe(0)
        const { code, json } = await project.run(['visual', 'save', 'home', '--json'])
        expect(code).toBe(3)
        expect(json.error).toMatchObject({
            code: 'MISSING_DEPENDENCY',
            package: '@wdio/visual-service',
            install: ['pnpm add -D @wdio/visual-service']
        })
        const info = await project.run(['info'])
        expect(info.code).toBe(0)
    })
})

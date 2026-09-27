import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { electronPlan } from '../../src/targets/electron.js'

const dirs: string[] = []

function tempDir () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-electron-plan-'))
    dirs.push(dir)
    return dir
}

function write (dir: string, name: string) {
    const file = path.join(dir, name)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, 'module.exports = {}\n')
    return file
}

function installElectron (dir: string, version = '44.4.5') {
    const pkg = path.join(dir, 'node_modules', 'electron')
    fs.mkdirSync(pkg, { recursive: true })
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: 'electron', version, main: 'index.js' }))
    fs.writeFileSync(path.join(pkg, 'index.js'), 'export {}\n')
}

const ctx = (cwd: string, env: NodeJS.ProcessEnv = { DISPLAY: ':1' }) => ({
    cwd,
    artifactsDir: path.join(cwd, 'artifacts'),
    env,
    platform: 'linux' as const
})

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('electron targets', () => {
    it('treats a .js path as an entry point and records the log directory', async () => {
        const dir = tempDir()
        installElectron(dir)
        const entry = write(dir, 'app/main.js')
        const plan = await electronPlan({ target: 'electron', url: 'app/main.js', appArg: '--debug' }, ctx(dir))
        expect(plan.electron).toMatchObject({
            appEntryPoint: entry,
            appArgs: ['--debug'],
            logDir: path.join(dir, 'artifacts', 'electron-logs')
        })
        expect(plan.capabilities).toMatchObject({
            browserName: 'electron',
            webSocketUrl: false,
            browserVersion: '44.4.5',
            'wdio:electronServiceOptions': {
                appEntryPoint: entry,
                logDir: path.join(dir, 'artifacts', 'electron-logs'),
                captureMainProcessLogs: true,
                appArgs: ['--debug']
            }
        })
        expect(plan).toMatchObject({ platform: 'electron', mode: 'electron', headless: false, display: false, bidi: false })
    })

    it('treats other paths as a binary and honors chromedriver and version flags', async () => {
        const dir = tempDir()
        const binary = write(dir, 'dist/my-app')
        const plan = await electronPlan({
            target: 'electron',
            url: binary,
            chromedriver: 'drivers/chromedriver',
            electronVersion: '30.0.0',
            bidi: false
        }, ctx(dir))
        expect(plan.electron).toMatchObject({
            appBinaryPath: binary,
            chromedriver: path.join(dir, 'drivers', 'chromedriver'),
            electronVersion: '30.0.0'
        })
        expect(plan.capabilities).toMatchObject({
            browserVersion: '30.0.0',
            'wdio:chromedriverOptions': { binary: path.join(dir, 'drivers', 'chromedriver') },
            'goog:chromeOptions': { binary, args: [] }
        })
        expect(plan.capabilities).not.toHaveProperty('webSocketUrl', true)
        expect((plan.capabilities as Record<string, unknown>).webSocketUrl).toBe(false)
    })

    it('does not pin browserVersion from the electron package for a packaged binary', async () => {
        const dir = tempDir()
        installElectron(dir)
        const binary = write(dir, 'dist/my-app')
        const plan = await electronPlan({ target: 'electron', url: binary }, ctx(dir))
        expect(plan.capabilities).not.toHaveProperty('browserVersion')
        expect(plan.electron).not.toHaveProperty('electronVersion')
        expect((plan.capabilities as Record<string, unknown>)['goog:chromeOptions']).toMatchObject({ args: [] })
    })

    it('requires the electron package for an entry point', async () => {
        const dir = tempDir()
        write(dir, 'main.js')
        await expect(electronPlan({ target: 'electron', url: 'main.js' }, ctx(dir)))
            .rejects.toMatchObject({ code: 'MISSING_DEPENDENCY', package: 'electron' })
    })

    it('requires an app path and a file that exists', async () => {
        const dir = tempDir()
        await expect(electronPlan({ target: 'electron' }, ctx(dir))).rejects.toMatchObject({ code: 'USAGE' })
        await expect(electronPlan({ target: 'electron', url: 'missing' }, ctx(dir))).rejects.toMatchObject({ code: 'USAGE' })
    })

    it('asks for a virtual display on Linux without one', async () => {
        const dir = tempDir()
        const binary = write(dir, 'MyApp')
        const bin = path.join(dir, 'bin')
        fs.mkdirSync(bin)
        fs.writeFileSync(path.join(bin, 'Xvfb'), '#!/bin/sh\n', { mode: 0o755 })
        const plan = await electronPlan({ target: 'electron', url: binary }, ctx(dir, { PATH: bin }))
        expect(plan.display).toBe(true)
    })
})

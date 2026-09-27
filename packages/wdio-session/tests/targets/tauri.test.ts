import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { nativeWebviewPlan, startDriver } from '../../src/targets/webview.js'

function isAlive (pid: number) {
    try {
        process.kill(pid, 0)
        return true
    } catch {
        return false
    }
}

const dirs: string[] = []

function tempDir () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-tauri-plan-'))
    dirs.push(dir)
    return dir
}

function installService (dir: string) {
    const pkg = path.join(dir, 'node_modules', '@wdio', 'tauri-service')
    fs.mkdirSync(pkg, { recursive: true })
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: '@wdio/tauri-service', type: 'module', main: 'index.js' }))
    fs.writeFileSync(path.join(pkg, 'index.js'), 'export {}\n')
}

function installBinary (dir: string, name: string) {
    const bin = path.join(dir, 'bin')
    fs.mkdirSync(bin, { recursive: true })
    const file = path.join(bin, name)
    fs.writeFileSync(file, '#!/bin/sh\nsleep 30\n')
    fs.chmodSync(file, 0o755)
    return bin
}

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('tauri targets', () => {
    it('builds wry capabilities and tauri-driver arguments', async () => {
        const dir = tempDir()
        installService(dir)
        const bin = installBinary(dir, 'tauri-driver')
        fs.writeFileSync(path.join(dir, 'my-app'), '')
        const plan = await nativeWebviewPlan('tauri', { target: 'tauri', url: 'my-app', appArg: ['--flag'] }, {
            cwd: dir,
            platform: 'linux',
            env: { DISPLAY: ':1', PATH: `${bin}${path.delimiter}${process.env.PATH || ''}` }
        })
        expect(plan.capabilities).toEqual({
            browserName: 'wry',
            'tauri:options': { application: path.join(dir, 'my-app'), args: ['--flag'] }
        })
        expect(plan.driver?.args).toEqual(['--port', String(plan.driver?.port)])
        expect(plan.driver?.binary).toBe(path.join(bin, 'tauri-driver'))
        expect(plan.remote).toMatchObject({ hostname: 'localhost', port: plan.driver?.port, path: '/' })
        expect(plan).toMatchObject({ platform: 'tauri', mode: 'driver', display: false })
    })

    it('skips tauri-driver when the service exports startWdioSession', async () => {
        const dir = tempDir()
        const pkg = path.join(dir, 'node_modules', '@wdio', 'tauri-service')
        fs.mkdirSync(pkg, { recursive: true })
        fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: '@wdio/tauri-service', type: 'module', main: 'index.js' }))
        fs.writeFileSync(path.join(pkg, 'index.js'), 'export function startWdioSession () { return {} }\n')
        fs.writeFileSync(path.join(dir, 'my-app'), '')
        const plan = await nativeWebviewPlan('tauri', { target: 'tauri', url: 'my-app' }, {
            cwd: dir,
            platform: 'linux',
            env: { DISPLAY: ':1', PATH: path.join(dir, 'empty') }
        })
        expect(plan.mode).toBe('remote')
        expect(plan.driver).toBeUndefined()
    })

    it('fails with MISSING_BINARY when tauri-driver is not on PATH', async () => {
        const dir = tempDir()
        installService(dir)
        fs.writeFileSync(path.join(dir, 'my-app'), '')
        await expect(nativeWebviewPlan('tauri', { target: 'tauri', url: 'my-app' }, {
            cwd: dir,
            platform: 'linux',
            env: { DISPLAY: ':1', PATH: path.join(dir, 'empty') }
        })).rejects.toMatchObject({ code: 'MISSING_BINARY', package: 'tauri-driver' })
    })

    it('stops the driver process it started', async () => {
        const dir = tempDir()
        const bin = installBinary(dir, 'tauri-driver')
        const driver = startDriver({ binary: path.join(bin, 'tauri-driver'), args: ['--port', '9'], port: 9 })
        expect(isAlive(driver.pid)).toBe(true)
        await driver.stop()
        expect(isAlive(driver.pid)).toBe(false)
    })

    it('rejects ready when the driver binary cannot be spawned', async () => {
        const dir = tempDir()
        const driver = startDriver({ binary: path.join(dir, 'missing-tauri-driver'), args: [], port: 1 })
        await expect(driver.ready).rejects.toThrow(/ENOENT|missing-tauri-driver/)
    })
})

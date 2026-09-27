import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, afterEach } from 'vitest'

import { nativeWebviewPlan } from '../../src/targets/webview.js'

const dirs: string[] = []

function tempDir () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-dioxus-plan-'))
    dirs.push(dir)
    return dir
}

function installService (dir: string) {
    const pkg = path.join(dir, 'node_modules', '@wdio', 'dioxus-service')
    fs.mkdirSync(pkg, { recursive: true })
    fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({ name: '@wdio/dioxus-service', type: 'module', main: 'index.js' }))
    fs.writeFileSync(path.join(pkg, 'index.js'), 'export {}\n')
}

function installBinary (dir: string) {
    const bin = path.join(dir, 'bin')
    fs.mkdirSync(bin, { recursive: true })
    fs.writeFileSync(path.join(bin, 'wdio-dioxus-driver'), '#!/bin/sh\nexit 0\n')
    fs.chmodSync(path.join(bin, 'wdio-dioxus-driver'), 0o755)
    return bin
}

afterEach(() => {
    for (const dir of dirs.splice(0)) {
        fs.rmSync(dir, { recursive: true, force: true })
    }
})

describe('dioxus targets', () => {
    it('builds wry capabilities and wdio-dioxus-driver arguments', async () => {
        const dir = tempDir()
        installService(dir)
        const bin = installBinary(dir)
        fs.writeFileSync(path.join(dir, 'my-app'), '')
        const plan = await nativeWebviewPlan('dioxus', { target: 'dioxus', url: './my-app' }, {
            cwd: dir,
            platform: 'darwin',
            env: { PATH: bin }
        })
        expect(plan.capabilities).toEqual({
            browserName: 'wry',
            'dioxus:options': { application: path.join(dir, 'my-app'), args: [] }
        })
        expect(plan.driver?.args).toEqual(['--port', String(plan.driver?.port)])
        expect(path.basename(plan.driver?.binary || '')).toBe('wdio-dioxus-driver')
        expect(plan).toMatchObject({ platform: 'dioxus', mode: 'driver', display: false })
    })

    it('fails with MISSING_BINARY when wdio-dioxus-driver is not on PATH', async () => {
        const dir = tempDir()
        installService(dir)
        fs.writeFileSync(path.join(dir, 'my-app'), '')
        await expect(nativeWebviewPlan('dioxus', { target: 'dioxus', url: 'my-app' }, {
            cwd: dir,
            platform: 'linux',
            env: { DISPLAY: ':1', PATH: '' }
        })).rejects.toMatchObject({ code: 'MISSING_BINARY', package: 'wdio-dioxus-driver' })
    })
})

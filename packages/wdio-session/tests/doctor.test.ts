import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { STATE_VERSION } from '../src/constants.js'
import { runDoctor, versionBelow } from '../src/doctor.js'
import { SessionError } from '../src/errors.js'
import type { DoctorCheck } from '../src/doctor.js'

function writePackage (root: string, name: string, files: Record<string, string> = {}, pkg: Record<string, unknown> = {}) {
    const dir = path.join(root, 'node_modules', ...name.split('/'))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version: '3.0.0', type: 'module', main: 'index.js', ...pkg }))
    fs.writeFileSync(path.join(dir, 'index.js'), 'export default 1\n')
    for (const [file, content] of Object.entries(files)) {
        fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
        fs.writeFileSync(path.join(dir, file), content)
    }
    return dir
}

function ids (checks: DoctorCheck[]) {
    return checks.map((row) => row.id)
}

describe('doctor', () => {
    let tmp: string
    let runtimeDir: string

    const savedPrefix = process.env.npm_config_prefix

    beforeEach(() => {
        tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-session-doctor-')))
        runtimeDir = path.join(tmp, 'run')
        fs.writeFileSync(path.join(tmp, 'package-lock.json'), '{}')
        process.env.npm_config_prefix = path.join(tmp, 'global')
    })

    afterEach(() => {
        fs.rmSync(tmp, { recursive: true, force: true })
        if (savedPrefix === undefined) {
            delete process.env.npm_config_prefix
        } else {
            process.env.npm_config_prefix = savedPrefix
        }
    })

    const ctx = () => ({
        cwd: tmp,
        runtimeDir,
        env: {
            ...process.env,
            PATH: path.join(tmp, 'bin'),
            ANDROID_HOME: '',
            ANDROID_SDK_ROOT: '',
            BROWSERSTACK_USERNAME: '',
            BROWSERSTACK_ACCESS_KEY: '',
            SAUCE_USERNAME: '',
            SAUCE_ACCESS_KEY: '',
            TESTINGBOT_KEY: '',
            TESTINGBOT_SECRET: '',
            LT_USERNAME: '',
            LT_ACCESS_KEY: '',
            DISPLAY: '',
            WAYLAND_DISPLAY: ''
        }
    })

    it('compares versions numerically', () => {
        expect(versionBelow('22.18.0', '22.19.0')).toBe(true)
        expect(versionBelow('22.19.0', '22.19.0')).toBe(false)
        expect(versionBelow('v24.4.0', '22.19.0')).toBe(false)
        expect(versionBelow('2.19.0', '3.0.0')).toBe(true)
    })

    it('rejects an unknown target', async () => {
        const err = await runDoctor({ target: 'nokia' }, ctx(), { platform: 'linux' }).catch((e) => e)
        expect(err).toBeInstanceOf(SessionError)
        expect(err.code).toBe('USAGE')
    })

    it('limits android to the checks that target needs', async () => {
        const result = await runDoctor({ target: 'android' }, ctx(), { platform: 'linux' })
        const checks = result.data as { checks: DoctorCheck[], exitCode: number }
        expect(ids(checks.checks)).toEqual([
            'node', 'webdriverio', 'runtime-dir', 'sessions',
            'appium', 'appium-driver:uiautomator2', 'android-sdk'
        ])
        expect(checks.checks.find((row) => row.id === 'appium')).toMatchObject({
            status: 'fail',
            fix: 'npm i -D appium@^3'
        })
        expect(checks.checks.find((row) => row.id === 'appium-driver:uiautomator2')?.fix).toBe('npx appium driver install uiautomator2')
        expect(checks.exitCode).toBe(1)
        expect(result.text).toContain('✖ appium not installed → fix: npm i -D appium@^3')
    })

    it('fails Appium older than 3 and a missing driver', async () => {
        const listed = JSON.stringify({ xcuitest: { version: '1.0.0' } })
        writePackage(tmp, 'appium', {
            'build/lib/main.js': 'export default 1\n',
            'index.js': `console.log(${JSON.stringify(listed)})\n`
        }, { version: '2.19.0', main: 'build/lib/main.js', bin: { appium: 'index.js' } })
        const result = await runDoctor({ target: 'android' }, ctx(), { platform: 'linux' })
        const checks = (result.data as { checks: DoctorCheck[] }).checks
        expect(checks.find((row) => row.id === 'appium')).toMatchObject({
            status: 'fail',
            message: '2.19.0 is older than 3'
        })
        expect(checks.find((row) => row.id === 'appium-driver:uiautomator2')?.status).toBe('fail')
    })

    it('does not print credential values', async () => {
        const env = {
            ...ctx().env,
            BROWSERSTACK_USERNAME: 'super-secret-user',
            BROWSERSTACK_ACCESS_KEY: 'super-secret-key'
        }
        const present = await runDoctor({ target: 'browserstack' }, { ...ctx(), env }, { platform: 'linux' })
        expect(JSON.stringify(present)).not.toContain('super-secret')
        expect((present.data as { checks: DoctorCheck[] }).checks.find((row) => row.id === 'credentials:browserstack')).toMatchObject({
            status: 'ok',
            message: 'BrowserStack credentials are set'
        })

        const missing = await runDoctor({ target: 'browserstack' }, ctx(), { platform: 'linux' })
        const row = (missing.data as { checks: DoctorCheck[] }).checks.find((item) => item.id === 'credentials:browserstack')
        expect(row?.status).toBe('fail')
        expect(row?.message).toContain('BROWSERSTACK_USERNAME')
        expect(row?.message).toContain('BROWSERSTACK_ACCESS_KEY')
    })

    it('warns and removes a stale session', async () => {
        fs.mkdirSync(runtimeDir, { recursive: true })
        fs.writeFileSync(path.join(runtimeDir, 'gone.json'), JSON.stringify({
            version: STATE_VERSION,
            name: 'gone',
            pid: 2_147_483_646,
            status: 'ready',
            cwd: tmp,
            artifactsDir: path.join(tmp, 'artifacts'),
            startedAt: new Date().toISOString()
        }))
        const result = await runDoctor({ target: 'chrome' }, ctx(), { platform: 'darwin' })
        const checks = (result.data as { checks: DoctorCheck[] }).checks
        expect(checks.find((row) => row.id === 'sessions')).toMatchObject({
            status: 'warn',
            message: 'removed stale session "gone"'
        })
        expect(fs.existsSync(path.join(runtimeDir, 'gone.json'))).toBe(false)
        expect(ids(checks)).not.toContain('display')
        expect(ids(checks)).toContain('browser:chrome')
    })

    it('fails Safari off macOS and warns when Chrome will be downloaded', async () => {
        const result = await runDoctor({}, ctx(), { platform: 'linux', nodeVersion: '24.4.0' })
        const checks = (result.data as { checks: DoctorCheck[], ok: boolean }).checks
        expect(checks.find((row) => row.id === 'node')).toMatchObject({ status: 'ok', message: '24.4.0' })
        expect(checks.find((row) => row.id === 'browser:safari')).toMatchObject({ status: 'fail', message: 'Safari requires macOS' })
        expect(checks.find((row) => row.id === 'browser:chrome')).toMatchObject({ status: 'warn', message: 'downloaded on first use' })
        expect(checks.find((row) => row.id === 'package:electron')?.status).toBe('warn')
        expect(checks.find((row) => row.id === 'binary:ffmpeg')?.status).toBe('warn')
        expect(ids(checks)).not.toContain('xcode')
        expect(result.text?.startsWith('✔ node 24.4.0')).toBe(true)
    })

    it('fails a package the electron target needs', async () => {
        const result = await runDoctor({ target: 'electron' }, ctx(), { platform: 'linux' })
        const row = (result.data as { checks: DoctorCheck[] }).checks.find((item) => item.id === 'package:electron')
        expect(row?.status).toBe('fail')
        expect(row?.fix).toBe('npm i -D electron')
        expect(ids((result.data as { checks: DoctorCheck[] }).checks)).toContain('display')
    })

    it('checks the dioxus driver and a display on Linux', async () => {
        const result = await runDoctor({ target: 'dioxus' }, ctx(), { platform: 'linux' })
        const checks = (result.data as { checks: DoctorCheck[] }).checks
        expect(ids(checks)).toContain('binary:wdio-dioxus-driver')
        expect(ids(checks)).toContain('display')
    })

    it('keeps a session that is still starting and drops one that never started', async () => {
        fs.mkdirSync(runtimeDir, { recursive: true })
        const young = {
            version: STATE_VERSION,
            name: 'booting',
            pid: null,
            status: 'starting',
            cwd: tmp,
            artifactsDir: path.join(tmp, 'artifacts'),
            startedAt: new Date().toISOString()
        }
        const abandoned = {
            ...young,
            name: 'abandoned',
            startedAt: new Date(Date.now() - 60_000).toISOString()
        }
        fs.writeFileSync(path.join(runtimeDir, 'booting.json'), JSON.stringify(young))
        fs.writeFileSync(path.join(runtimeDir, 'abandoned.json'), JSON.stringify(abandoned))
        const result = await runDoctor({ target: 'chrome' }, ctx(), { platform: 'darwin' })
        const checks = (result.data as { checks: DoctorCheck[] }).checks
        expect(checks.filter((row) => row.id === 'sessions').map((row) => row.message)).toEqual(['removed stale session "abandoned"'])
        expect(fs.existsSync(path.join(runtimeDir, 'booting.json'))).toBe(true)
        expect(fs.existsSync(path.join(runtimeDir, 'abandoned.json'))).toBe(false)
    })

    it('does not remove a session replaced before the stale file is deleted', async () => {
        fs.mkdirSync(runtimeDir, { recursive: true })
        const file = path.join(runtimeDir, 'swap.json')
        const original = {
            version: STATE_VERSION,
            name: 'swap',
            pid: 2_147_483_646,
            status: 'ready',
            cwd: tmp,
            artifactsDir: path.join(tmp, 'artifacts'),
            startedAt: new Date(Date.now() - 60_000).toISOString()
        }
        fs.writeFileSync(file, JSON.stringify(original))
        const real = fs.readFileSync.bind(fs)
        let seen = 0
        const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(((target: fs.PathOrFileDescriptor, encoding?: unknown) => {
            if (String(target) === file) {
                seen++
                if (seen > 1) {
                    return JSON.stringify({ ...original, pid: process.pid, startedAt: new Date().toISOString() })
                }
            }
            return real(target, encoding as BufferEncoding)
        }) as typeof fs.readFileSync)
        try {
            const result = await runDoctor({ target: 'chrome' }, ctx(), { platform: 'darwin' })
            const checks = (result.data as { checks: DoctorCheck[] }).checks
            expect(checks.find((row) => row.id === 'sessions')).toMatchObject({ status: 'ok', message: 'no stale sessions' })
            expect(fs.existsSync(file)).toBe(true)
        } finally {
            spy.mockRestore()
        }
    })
})

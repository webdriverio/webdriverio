import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
    appiumCliPath, checkAppium, checkBinary, checkVisualDependency, findBinary,
    parseDriverList, requirePackage
} from '../src/deps.js'
import { SessionError } from '../src/errors.js'

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

/**
 * fake Appium whose `driver list --installed --json` prints the given drivers
 */
function writeAppium (root: string, drivers: string[] | string) {
    const output = typeof drivers === 'string' ? drivers : JSON.stringify(Object.fromEntries(drivers.map((d) => [d, { version: '1.0.0' }])))
    return writePackage(root, 'appium', {
        'build/lib/main.js': 'export default 1\n',
        'index.js': `console.log(${JSON.stringify(output)})\n`
    }, { main: 'build/lib/main.js', bin: { appium: 'index.js' } })
}

describe('deps', () => {
    let tmp: string
    const env = { ...process.env, npm_config_prefix: '/nonexistent-wdio-prefix', NPM_CONFIG_PREFIX: '/nonexistent-wdio-prefix' }
    const savedPrefix = process.env.npm_config_prefix

    beforeEach(() => {
        tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-session-deps-')))
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

    it('requirePackage fails with MISSING_DEPENDENCY and a package manager specific install command', async () => {
        fs.writeFileSync(path.join(tmp, 'yarn.lock'), '')
        const err = await requirePackage('@wdio/electron-service', { cwd: tmp, feature: 'open an Electron session' }).catch((e) => e)
        expect(err).toBeInstanceOf(SessionError)
        expect(err.code).toBe('MISSING_DEPENDENCY')
        expect(err.exitCode).toBe(3)
        expect(err.message).toBe('Cannot open an Electron session: @wdio/electron-service is not installed.')
        expect(err.install).toEqual(['yarn add -D @wdio/electron-service'])
    })

    it('requirePackage resolves packages from the project', async () => {
        const dir = writePackage(tmp, '@wdio/visual-service')
        expect(await requirePackage('@wdio/visual-service', { cwd: tmp, feature: 'x' })).toBe(path.join(dir, 'index.js'))
    })

    it('checkAppium reports missing Appium with the driver install step', async () => {
        fs.writeFileSync(path.join(tmp, 'pnpm-lock.yaml'), '')
        const err = await checkAppium('android', { cwd: tmp, env }).catch((e) => e)
        expect(err.toJSON()).toEqual({
            code: 'MISSING_DEPENDENCY',
            message: 'Cannot open an Android session: Appium is not installed.',
            hint: 'Run `wdio session doctor android` to check your whole setup.',
            package: 'appium',
            install: ['pnpm add -D appium@^3', 'npx appium driver install uiautomator2']
        })
    })

    it('checkAppium finds a global Appium install', async () => {
        const project = path.join(tmp, 'project')
        fs.mkdirSync(project)
        const globalRoot = process.platform === 'win32' ? path.join(tmp, 'global') : path.join(tmp, 'global', 'lib')
        writeAppium(globalRoot, ['uiautomator2'])
        const result = await checkAppium('android', { cwd: project, env })
        expect(result.drivers).toEqual(['uiautomator2'])
        expect(result.cli).toBe(path.join(globalRoot, 'node_modules', 'appium', 'index.js'))
    })

    it('checkAppium fails with MISSING_APPIUM_DRIVER when the driver is not installed', async () => {
        writeAppium(tmp, ['xcuitest'])
        const err = await checkAppium('android', { cwd: tmp, env }).catch((e) => e)
        expect(err.code).toBe('MISSING_APPIUM_DRIVER')
        expect(err.exitCode).toBe(3)
        expect(err.install).toEqual(['npx appium driver install uiautomator2'])
        await expect(checkAppium('ios', { cwd: tmp, env })).resolves.toMatchObject({ drivers: ['xcuitest'] })
    })

    it('checkAppium skips the driver check when Appium output is unreadable', async () => {
        writeAppium(tmp, 'not json')
        await expect(checkAppium('windows', { cwd: tmp, env })).resolves.toMatchObject({ drivers: undefined })
    })

    it('parseDriverList ignores log lines before the JSON', () => {
        expect(parseDriverList('[Appium] something\n{"mac2":{}}')).toEqual(['mac2'])
        expect(parseDriverList('')).toBe(undefined)
        expect(parseDriverList('[1,2]')).toBe(undefined)
    })

    it('appiumCliPath falls back to the entry without a package root', () => {
        expect(appiumCliPath(path.join(tmp, 'x.js'))).toBe(path.join(tmp, 'x.js'))
    })

    it('findBinary and checkBinary search PATH', () => {
        const bin = path.join(tmp, 'bin')
        fs.mkdirSync(bin)
        fs.writeFileSync(path.join(bin, 'tauri-driver'), '#!/bin/sh\n', { mode: 0o755 })
        const pathEnv = { PATH: bin, PATHEXT: '' }
        if (process.platform !== 'win32') {
            expect(findBinary('tauri-driver', pathEnv)).toBe(path.join(bin, 'tauri-driver'))
        }
        expect(() => checkBinary('ffmpeg', { feature: 'record a video', install: ['brew install ffmpeg'], env: pathEnv }))
            .toThrow(expect.objectContaining({ code: 'MISSING_BINARY', install: ['brew install ffmpeg'] }))
    })

    it('checkVisualDependency accepts the package from either project', async () => {
        const cli = path.join(tmp, 'cli')
        const session = path.join(tmp, 'session')
        fs.mkdirSync(cli)
        writePackage(session, '@wdio/visual-service')
        await expect(checkVisualDependency(cli, session)).resolves.toBe(undefined)
        const err = await checkVisualDependency(cli).catch((e) => e)
        expect(err.code).toBe('MISSING_DEPENDENCY')
        expect(err.package).toBe('@wdio/visual-service')
    })
})

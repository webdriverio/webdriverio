import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import cp from 'node:child_process'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
    resolveOptionalDependency, importOptionalDependency, MissingDependencyError,
    detectPackageManager, installCommand
} from '../../src/node/optionalDependency.js'

vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof cp>()
    const execSync = vi.fn()
    return { ...actual, default: { ...actual, execSync }, execSync }
})

function writePackage (root: string, name: string, source = 'export default 42\n') {
    const dir = path.join(root, 'node_modules', ...name.split('/'))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version: '1.0.0', type: 'module', main: 'index.js' }))
    fs.writeFileSync(path.join(dir, 'index.js'), source)
    return path.join(dir, 'index.js')
}

describe('optional dependencies', () => {
    let tmp: string

    beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-optional-'))
    })

    afterEach(() => {
        fs.rmSync(tmp, { recursive: true, force: true })
        vi.mocked(cp.execSync).mockReset()
    })

    describe('resolveOptionalDependency', () => {
        it('resolves from the project node_modules', async () => {
            const project = path.join(tmp, 'project')
            const entry = writePackage(project, 'fake-dep')
            expect(await resolveOptionalDependency('fake-dep', { cwd: project })).toBe(fs.realpathSync(entry))
        })

        it('resolves scoped packages', async () => {
            const project = path.join(tmp, 'project')
            const entry = writePackage(project, '@fake/dep')
            expect(await resolveOptionalDependency('@fake/dep', { cwd: project })).toBe(fs.realpathSync(entry))
        })

        it('falls back to the location given in `from`', async () => {
            const project = path.join(tmp, 'project')
            fs.mkdirSync(project, { recursive: true })
            const owner = path.join(tmp, 'owner')
            const entry = writePackage(owner, 'fake-dep')
            fs.writeFileSync(path.join(owner, 'index.js'), '')
            expect(await resolveOptionalDependency('fake-dep', { cwd: project, from: path.join(owner, 'index.js') })).toBe(fs.realpathSync(entry))
        })

        it('only searches the project without `from`', async () => {
            const project = path.join(tmp, 'project')
            fs.mkdirSync(project, { recursive: true })
            expect(await resolveOptionalDependency('import-meta-resolve', { cwd: project })).toBe(null)
            expect(await resolveOptionalDependency('import-meta-resolve', { cwd: project, from: import.meta.url })).toEqual(expect.any(String))
        })

        it('searches the global npm prefix only with `global: true`', async () => {
            const project = path.join(tmp, 'project')
            fs.mkdirSync(project, { recursive: true })
            const prefix = path.join(tmp, 'prefix')
            const globalRoot = process.platform === 'win32' ? prefix : path.join(prefix, 'lib')
            const entry = writePackage(globalRoot, 'fake-global-dep')
            vi.mocked(cp.execSync).mockReturnValue(`${prefix}\n` as never)

            expect(await resolveOptionalDependency('fake-global-dep', { cwd: project })).toBe(null)
            expect(cp.execSync).not.toHaveBeenCalled()
            expect(await resolveOptionalDependency('fake-global-dep', { cwd: project, global: true })).toBe(fs.realpathSync(entry))
            expect(cp.execSync).toHaveBeenCalledWith('npm config get prefix', expect.objectContaining({ encoding: 'utf-8' }))
        })

        it('returns null when the package is missing', async () => {
            vi.mocked(cp.execSync).mockImplementation(() => {
                throw new Error('no npm')
            })
            expect(await resolveOptionalDependency('surely-not-installed-anywhere', { cwd: tmp, global: true })).toBe(null)
        })
    })

    describe('importOptionalDependency', () => {
        it('imports the resolved module', async () => {
            writePackage(tmp, 'fake-dep')
            const mod = await importOptionalDependency<{ default: number }>('fake-dep', { cwd: tmp, feature: 'test' })
            expect(mod.default).toBe(42)
        })

        it('throws a MissingDependencyError with install commands', async () => {
            fs.writeFileSync(path.join(tmp, 'pnpm-lock.yaml'), '')
            const err = await importOptionalDependency('surely-not-installed-anywhere', { cwd: tmp, feature: 'open an Android session' })
                .catch((e) => e)
            expect(err).toBeInstanceOf(MissingDependencyError)
            expect(err.code).toBe('MISSING_DEPENDENCY')
            expect(err.package).toBe('surely-not-installed-anywhere')
            expect(err.feature).toBe('open an Android session')
            expect(err.message).toBe('Cannot open an Android session: surely-not-installed-anywhere is not installed.')
            expect(err.install).toEqual(['pnpm add -D surely-not-installed-anywhere'])
        })

        it('uses custom install commands and messages', async () => {
            const err = await importOptionalDependency('surely-not-installed-anywhere', {
                cwd: tmp,
                feature: 'x',
                message: 'Custom',
                install: ['a', 'b']
            }).catch((e) => e)
            expect(err.message).toBe('Custom')
            expect(err.install).toEqual(['a', 'b'])
        })
    })

    describe('detectPackageManager', () => {
        it.each([
            ['pnpm-lock.yaml', 'pnpm'],
            ['yarn.lock', 'yarn'],
            ['bun.lock', 'bun'],
            ['bun.lockb', 'bun'],
            ['package-lock.json', 'npm']
        ])('detects %s', (lockfile, pm) => {
            fs.writeFileSync(path.join(tmp, lockfile), '')
            expect(detectPackageManager(tmp, {})).toBe(pm)
        })

        it('prefers the packageManager field', () => {
            fs.writeFileSync(path.join(tmp, 'package-lock.json'), '')
            fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.1.0' }))
            expect(detectPackageManager(tmp, {})).toBe('yarn')
        })

        it('walks up to find the lockfile', () => {
            const nested = path.join(tmp, 'a', 'b')
            fs.mkdirSync(nested, { recursive: true })
            fs.writeFileSync(path.join(tmp, 'pnpm-lock.yaml'), '')
            expect(detectPackageManager(nested, {})).toBe('pnpm')
        })

        it('uses the user agent and defaults to npm', () => {
            const isolated = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-pm-'))
            try {
                const hasLockfileAbove = ['pnpm-lock.yaml', 'yarn.lock', 'package-lock.json', 'bun.lock', 'package.json']
                    .some((f) => fs.existsSync(path.join(path.dirname(isolated), f)))
                if (hasLockfileAbove) {
                    return
                }
                expect(detectPackageManager(isolated, { npm_config_user_agent: 'yarn/4.0.0 npm/? node/v22' })).toBe('yarn')
                expect(detectPackageManager(isolated, { npm_config_user_agent: 'bun/1.1.0' })).toBe('bun')
                expect(detectPackageManager(isolated, {})).toBe('npm')
            } finally {
                fs.rmSync(isolated, { recursive: true, force: true })
            }
        })
    })

    describe('installCommand', () => {
        it.each([
            ['npm', 'npm i -D appium@^3'],
            ['pnpm', 'pnpm add -D appium@^3'],
            ['yarn', 'yarn add -D appium@^3'],
            ['bun', 'bun add -d appium@^3']
        ] as const)('for %s', (pm, expected) => {
            expect(installCommand('appium@^3', { packageManager: pm })).toBe(expected)
        })

        it('without --dev', () => {
            expect(installCommand('appium', { packageManager: 'npm', dev: false })).toBe('npm i appium')
        })

        it('detects the package manager from cwd', () => {
            fs.writeFileSync(path.join(tmp, 'yarn.lock'), '')
            expect(installCommand('x', { cwd: tmp })).toBe('yarn add -D x')
        })
    })
})

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { PNPM_SKIP_BUILDS_FLAG, preparePnpmInstall, savePnpmBuildSetting } from '../src/pnpm.js'

describe('savePnpmBuildSetting', () => {
    let tmpDir: string
    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-wdio-pnpm-'))
    })
    afterEach(async () => {
        await fs.rm(tmpDir, { recursive: true, force: true })
    })
    const workspaceFile = () => path.join(tmpDir, 'pnpm-workspace.yaml')

    it('creates pnpm-workspace.yaml', async () => {
        expect(await savePnpmBuildSetting(tmpDir)).toEqual({ result: 'written', file: workspaceFile() })
        expect(await fs.readFile(workspaceFile(), 'utf8')).toBe('strictDepBuilds: false\n')
    })

    it('adds the line to an existing file', async () => {
        await fs.writeFile(workspaceFile(), 'overrides:\n  a: b')
        expect(await savePnpmBuildSetting(tmpDir)).toEqual({ result: 'written', file: workspaceFile() })
        expect(await fs.readFile(workspaceFile(), 'utf8')).toBe('overrides:\n  a: b\nstrictDepBuilds: false\n')
    })

    it('keeps the user value', async () => {
        await fs.writeFile(workspaceFile(), 'strictDepBuilds: true\n')
        expect(await savePnpmBuildSetting(tmpDir)).toEqual({ result: 'kept', file: workspaceFile() })
        expect(await fs.readFile(workspaceFile(), 'utf8')).toBe('strictDepBuilds: true\n')
    })

    it('writes nothing inside a parent workspace', async () => {
        await fs.writeFile(workspaceFile(), 'packages:\n  - app\n')
        const app = path.join(tmpDir, 'app')
        await fs.mkdir(app)
        expect(await savePnpmBuildSetting(app)).toEqual({ result: 'parent-workspace', file: workspaceFile() })
        await expect(fs.access(path.join(app, 'pnpm-workspace.yaml'))).rejects.toThrow()
        expect(await fs.readFile(workspaceFile(), 'utf8')).toBe('packages:\n  - app\n')
    })
})

describe('preparePnpmInstall', () => {
    let tmpDir: string
    beforeEach(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'create-wdio-pnpm-'))
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.stubEnv('npm_config_user_agent', 'pnpm/12.18.0 npm/? node/v24.22.1 darwin arm64')
    })
    afterEach(async () => {
        vi.restoreAllMocks()
        vi.unstubAllEnvs()
        await fs.rm(tmpDir, { recursive: true, force: true })
    })
    const logged = () => vi.mocked(console.log).mock.calls.flat().join('\n')

    it('does nothing for another package manager', async () => {
        expect(await preparePnpmInstall('npm', tmpDir)).toEqual([])
        await expect(fs.access(path.join(tmpDir, 'pnpm-workspace.yaml'))).rejects.toThrow()
        expect(logged()).toBe('')
    })

    it('saves the setting and needs no flag in a project', async () => {
        expect(await preparePnpmInstall('pnpm', tmpDir)).toEqual([])
        expect(await fs.readFile(path.join(tmpDir, 'pnpm-workspace.yaml'), 'utf8')).toBe('strictDepBuilds: false\n')
        expect(logged()).toContain('pnpm will skip the build scripts')
    })

    it('keeps the setting of the user without a message', async () => {
        await fs.writeFile(path.join(tmpDir, 'pnpm-workspace.yaml'), 'strictDepBuilds: true\n')
        expect(await preparePnpmInstall('pnpm', tmpDir)).toEqual([])
        expect(logged()).toBe('')
    })

    it('passes the flag inside a parent workspace', async () => {
        await fs.writeFile(path.join(tmpDir, 'pnpm-workspace.yaml'), 'packages:\n  - app\n')
        const app = path.join(tmpDir, 'app')
        await fs.mkdir(app)
        expect(PNPM_SKIP_BUILDS_FLAG).toBe('--config.strict-dep-builds=false')
        expect(await preparePnpmInstall('pnpm', app)).toEqual(['--config.strict-dep-builds=false'])
        expect(logged()).toContain('pnpm will skip the build scripts')
        // a later `pnpm install` of the workspace fails on the new build scripts: tell the user what to do
        expect(logged()).toContain(path.join(tmpDir, 'pnpm-workspace.yaml'))
        expect(logged()).toContain('strictDepBuilds: false')
        expect(logged()).toContain('pnpm approve-builds')
    })

    it.each(['9.15.9', '10.34.0'])('does nothing with pnpm %s, which does not fail on build scripts', async (version) => {
        // pnpm 9 also rejects a pnpm-workspace.yaml without a `packages` field
        vi.stubEnv('npm_config_user_agent', `pnpm/${version} npm/? node/v24.22.1 darwin arm64`)
        expect(await preparePnpmInstall('pnpm', tmpDir)).toEqual([])
        await expect(fs.access(path.join(tmpDir, 'pnpm-workspace.yaml'))).rejects.toThrow()
        expect(logged()).toBe('')
    })
})

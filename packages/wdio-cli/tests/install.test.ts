import { describe, it, vi } from 'vitest'

import { execa } from 'execa'

import { installPackages, getInstallCommand } from '../src/install.js'

vi.mock('execa', () => ({
    execa: vi.fn().mockResolvedValue({ stdout: 'foo', stderr: 'bar', exitCode: 0 })
}))

vi.mock('detect', () => ({
    detect: vi.fn().mockResolvedValue('pnpm')
}))

describe('install', () => {
    it('installPackages passing', async () => {
        expect(await installPackages('/foo/bar', ['foo', 'bar'], true))
            .toBe(true)
    })

    it('installPackages failing', async () => {
        vi.mocked(execa).mockResolvedValue({ stdout: 'foo', stderr: 'bar', exitCode: 1 } as any)
        expect(await installPackages('/foo/bar', ['foo', 'bar'], false))
            .toBe(false)
    })

    it('getInstallCommand', () => {
        expect(getInstallCommand('pnpm', ['foo', 'bar'], true))
            .toBe('pnpm install foo bar --dev')
    })
})

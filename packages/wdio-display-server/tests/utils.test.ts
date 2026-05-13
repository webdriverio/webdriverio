import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockExecAsync = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync),
}))

const { detectPackageManager } = await import('../src/utils.js')

describe('detectPackageManager', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns "apt" when apt-get is available', async () => {
        mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('apt')
        expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
    })

    it('returns "dnf" when apt-get is missing but dnf is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/dnf', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('dnf')
        expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
        expect(mockExecAsync).toHaveBeenCalledWith('which dnf')
    })

    it('returns "yum" when only yum is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/yum', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('yum')
    })

    it('returns "zypper" when only zypper is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/zypper', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('zypper')
    })

    it('returns "pacman" when only pacman is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/pacman', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('pacman')
    })

    it('returns "apk" when only apk is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/sbin/apk', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('apk')
    })

    it('returns "xbps" when only xbps-install is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/xbps-install', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('xbps')
        expect(mockExecAsync).toHaveBeenCalledWith('which xbps-install')
    })

    it('returns "unknown" when no package manager is found', async () => {
        mockExecAsync.mockRejectedValue(new Error('not found'))

        const result = await detectPackageManager()

        expect(result).toBe('unknown')
        // Should have probed all 7 known package managers
        expect(mockExecAsync).toHaveBeenCalledTimes(7)
    })

    it('probes package managers in priority order, stopping at first hit', async () => {
        mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })

        await detectPackageManager()

        expect(mockExecAsync).toHaveBeenCalledTimes(1)
        expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
    })
})

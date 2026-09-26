import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'

import { runAsRoot, runAsUser } from './helpers.js'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockPlatform = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
    execFile: vi.fn()
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync)
}))

vi.mock('node:fs/promises', () => ({
    readdir: vi.fn(),
    access: vi.fn(),
}))

vi.mock('node:os', () => ({
    default: {
        platform: mockPlatform
    }
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

// This suite predates the @wdio/xvfb -> @wdio/display-server rename; it's kept
// under the legacy describe name for its broad DisplayServerManager coverage,
// with the class imported directly and locally aliased.
const { DisplayServerManager: XvfbManager } = await import('../src/DisplayServerManager.js')

describe('XvfbManager', () => {
    let manager: InstanceType<typeof XvfbManager>
    let savedWaylandDisplay: string | undefined

    beforeEach(() => {
        vi.clearAllMocks()

        manager = new XvfbManager({ displayServer: 'xvfb' })

        // Clear both display vars so shouldRun() behaves as if headless.
        delete process.env.DISPLAY
        savedWaylandDisplay = process.env.WAYLAND_DISPLAY
        delete process.env.WAYLAND_DISPLAY
        mockPlatform.mockReturnValue('linux')
    })

    afterEach(() => {
        if (savedWaylandDisplay !== undefined) {
            process.env.WAYLAND_DISPLAY = savedWaylandDisplay
        }
        vi.restoreAllMocks()
    })

    describe('constructor', () => {
        it('creates an instance with default options', () => {
            const manager = new XvfbManager({ displayServer: 'xvfb' })
            expect(manager).toBeInstanceOf(XvfbManager)
        })

        it('creates an instance with custom options', () => {
            const manager = new XvfbManager({
                displayServer: 'xvfb',
                force: true,
                autoInstallMode: 'sudo'
            })
            expect(manager).toBeInstanceOf(XvfbManager)
        })
    })

    describe('shouldRun', () => {
        it('returns true when forced', () => {
            const manager = new XvfbManager({ displayServer: 'xvfb', force: true })
            mockPlatform.mockReturnValue('darwin')

            expect(manager.shouldRun()).toBe(true)
        })

        it('returns false on non-Linux platforms', () => {
            mockPlatform.mockReturnValue('darwin')

            expect(manager.shouldRun()).toBe(false)
        })

        it('returns true on Linux without DISPLAY', () => {
            mockPlatform.mockReturnValue('linux')
            delete process.env.DISPLAY

            expect(manager.shouldRun()).toBe(true)
        })

        it('returns false on Linux when DISPLAY is set', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'

            expect(manager.shouldRun()).toBe(false)
        })

        it('returns false when disabled via enabled:false', () => {
            const disabledManager = new XvfbManager({ displayServer: 'xvfb', enabled: false })
            mockPlatform.mockReturnValue('linux')
            delete process.env.DISPLAY

            expect(disabledManager.shouldRun()).toBe(false)
        })
    })

    describe('init', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('sets up xvfb-run when needed', async () => {
            mockExecAsync.mockResolvedValue({ stdout: '/usr/bin/xvfb-run\n', stderr: '' })

            const result = await manager.init()

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith('which Xvfb')
        })

        it('does not set up when not needed', async () => {
            mockPlatform.mockReturnValue('darwin')

            const result = await manager.init()

            expect(result).toBe(false)
        })

        it('returns false and skips setup when disabled via enabled:false', async () => {
            const disabledManager = new XvfbManager({ displayServer: 'xvfb', enabled: false })
            mockPlatform.mockReturnValue('linux')
            delete process.env.DISPLAY

            const result = await disabledManager.init()
            expect(result).toBe(false)
            expect(mockExecAsync).not.toHaveBeenCalled()
        })

        describe('autoInstall', () => {
            it('installs xvfb with sudo -n when allowed and available (non-root, apt)', async () => {
                // which Xvfb twice (initial probe, then before installing) -> which apt-get
                // -> which sudo -> run install -> which Xvfb (re-probe after installing)
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found'))
                    .mockRejectedValueOnce(new Error('Command not found'))
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })
                    .mockResolvedValueOnce({ stdout: '/usr/bin/sudo', stderr: '' })
                    .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' })
                    .mockResolvedValueOnce({ stdout: '/usr/bin/Xvfb', stderr: '' })

                runAsUser()

                const manager = new XvfbManager({ displayServer: 'xvfb', autoInstall: true, autoInstallMode: 'sudo' })

                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()

                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith('which Xvfb')
                expect(mockExecAsync).toHaveBeenCalledWith('which', ['apt-get'])
                expect(mockExecAsync).toHaveBeenCalledWith('which', ['sudo'])
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'sudo',
                    ['-n', 'sh', '-c', 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb'],
                    { timeout: 240000 }
                )
            })

            it('does not install and returns false when xvfb-run is not available and autoInstall is disabled', async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found'))

                const manager = new XvfbManager({ displayServer: 'xvfb' })

                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()

                expect(result).toBe(false)
                expect(mockExecAsync).toHaveBeenCalledWith('which Xvfb')
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['apt-get'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['dnf'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['zypper'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['pacman'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['apk'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['xbps-install'])
            })
        })
    })

})

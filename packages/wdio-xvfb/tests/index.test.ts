import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'

import XvfbManager, { xvfb } from '../src/index.js'

vi.mock('node:child_process')
vi.mock('node:util')
vi.mock('node:os')
vi.mock('@wdio/logger', () => ({
    default: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

const mockSpawn = vi.mocked(spawn)
const mockExecAsync = vi.fn()
const mockPlatform = vi.mocked(os.platform)

vi.mocked(promisify).mockReturnValue(mockExecAsync)

describe('XvfbManager', () => {
    let manager: XvfbManager
    let mockProcess: Partial<ChildProcess>

    beforeEach(() => {
        vi.clearAllMocks()
        process.env.DISPLAY = undefined
        process.env.CI = undefined
        process.env.GITHUB_ACTIONS = undefined
        process.env.JENKINS_URL = undefined

        mockProcess = {
            pid: 12345,
            kill: vi.fn(),
            on: vi.fn().mockReturnValue(mockProcess),
            stdout: { on: vi.fn() } as any,
            stderr: { on: vi.fn() } as any,
        }

        mockSpawn.mockReturnValue(mockProcess as ChildProcess)
        mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' })
    })

    afterEach(async () => {
        vi.restoreAllMocks()
        if (manager) {
            await manager.stop()
        }
    })

    describe('constructor', () => {
        it('should create instance with default options', () => {
            manager = new XvfbManager()
            expect(manager).toBeInstanceOf(XvfbManager)
            expect(manager.getDisplay()).toBe(':99')
        })

        it('should create instance with custom options', () => {
            manager = new XvfbManager({ display: 42, screen: '800x600x24' })
            expect(manager.getDisplay()).toBe(':42')
        })
    })

    describe('shouldRun', () => {
        it('should return true when forced', () => {
            manager = new XvfbManager({ force: true })
            mockPlatform.mockReturnValue('darwin')

            expect(manager.shouldRun()).toBe(true)
        })

        it('should return false on non-Linux platforms', () => {
            manager = new XvfbManager()
            mockPlatform.mockReturnValue('darwin')

            expect(manager.shouldRun()).toBe(false)
        })

        it('should return true on Linux without DISPLAY', () => {
            manager = new XvfbManager()
            mockPlatform.mockReturnValue('linux')

            expect(manager.shouldRun()).toBe(true)
        })

        it('should return true on Linux in CI environment', () => {
            manager = new XvfbManager()
            mockPlatform.mockReturnValue('linux')
            process.env.CI = 'true'
            process.env.DISPLAY = ':0'

            expect(manager.shouldRun()).toBe(true)
        })

        it('should return false on Linux with existing DISPLAY (not in CI)', () => {
            manager = new XvfbManager()
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'

            expect(manager.shouldRun()).toBe(false)
        })
    })

    describe('start', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('should start Xvfb when needed', async () => {
            manager = new XvfbManager()

            const result = await manager.start()

            expect(result).toBe(true)
            expect(manager.isXvfbRunning()).toBe(true)
            expect(mockSpawn).toHaveBeenCalled()
        })

        it('should not start when not needed', async () => {
            manager = new XvfbManager()
            mockPlatform.mockReturnValue('darwin')

            const result = await manager.start()

            expect(result).toBe(false)
            expect(manager.isXvfbRunning()).toBe(false)
            expect(mockSpawn).not.toHaveBeenCalled()
        })

        it('should not start if already running', async () => {
            manager = new XvfbManager()

            await manager.start()
            mockSpawn.mockClear()

            const result = await manager.start()

            expect(result).toBe(true)
            expect(mockSpawn).not.toHaveBeenCalled()
        })

        it('should set environment variables', async () => {
            manager = new XvfbManager({ display: 42 })

            await manager.start()

            expect(process.env.DISPLAY).toBe(':42')
            expect(process.env.XDG_SESSION_TYPE).toBe('x11')
            expect(process.env.XDG_CURRENT_DESKTOP).toBeDefined()
        })

        it('should start Xvfb with correct arguments', async () => {
            manager = new XvfbManager({
                display: 42,
                screen: '800x600x16',
                dpi: 72,
                args: ['--test-arg'],
            })

            await manager.start()

            expect(mockSpawn).toHaveBeenCalledWith(
                'Xvfb',
                [
                    ':42',
                    '-screen',
                    '0',
                    '800x600x16',
                    '-ac',
                    '-nolisten',
                    'tcp',
                    '-dpi',
                    '72',
                    '--test-arg',
                ],
                {
                    detached: false,
                    stdio: ['ignore', 'pipe', 'pipe'],
                }
            )
        })

        it('should handle process events', async () => {
            const onMock = vi.fn()
            mockProcess.on = onMock

            manager = new XvfbManager()

            await manager.start()

            expect(onMock).toHaveBeenCalledWith('error', expect.any(Function))
            expect(onMock).toHaveBeenCalledWith('exit', expect.any(Function))
        })
    })

    describe('stop', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('should stop Xvfb process', async () => {
            const killMock = vi.fn()
            mockProcess.kill = killMock

            manager = new XvfbManager()
            await manager.start()
            await manager.stop()

            expect(killMock).toHaveBeenCalledWith('SIGTERM')
            expect(manager.isXvfbRunning()).toBe(false)
        })

        it('should restore original DISPLAY environment', async () => {
            process.env.DISPLAY = ':original'
            manager = new XvfbManager()

            await manager.start()
            expect(process.env.DISPLAY).toBe(':99')

            await manager.stop()
            expect(process.env.DISPLAY).toBe(':original')
        })

        it('should cleanup remaining processes', async () => {
            manager = new XvfbManager({ display: 42 })

            await manager.start()
            await manager.stop()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'pkill -f "Xvfb :42" || true'
            )
        })

        it('should do nothing if not running', async () => {
            manager = new XvfbManager()

            await manager.stop()

            expect(manager.isXvfbRunning()).toBe(false)
        })
    })

    describe('cross-distribution support', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('should detect Ubuntu distribution', async () => {
            mockExecAsync
                .mockResolvedValueOnce({
                    stdout: 'NAME="Ubuntu 20.04 LTS"',
                    stderr: '',
                })
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // which Xvfb (fails)
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // apt-get install
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // xdpyinfo check

            manager = new XvfbManager()
            await manager.start()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo apt-get update -qq && sudo apt-get install -y xvfb x11-utils'
            )
        })

        it('should detect Fedora distribution', async () => {
            mockExecAsync
                .mockResolvedValueOnce({
                    stdout: 'NAME="Fedora Linux 35"',
                    stderr: '',
                })
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // which Xvfb (fails)
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // dnf install
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // xdpyinfo check

            manager = new XvfbManager()
            await manager.start()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo dnf install -y xorg-x11-server-Xvfb xorg-x11-utils'
            )
        })

        it('should detect Arch Linux distribution', async () => {
            mockExecAsync
                .mockResolvedValueOnce({
                    stdout: 'NAME="Arch Linux"',
                    stderr: '',
                })
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // which Xvfb (fails)
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // pacman install
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // xdpyinfo check

            manager = new XvfbManager()
            await manager.start()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo pacman -S --noconfirm xorg-server-xvfb xorg-xdpyinfo'
            )
        })

        it('should fallback to package manager detection', async () => {
            mockExecAsync
                .mockRejectedValueOnce(new Error('no os-release')) // cat /etc/os-release fails
                .mockRejectedValueOnce(new Error('no apt-get')) // which apt-get fails
                .mockRejectedValueOnce(new Error('no yum')) // which yum fails
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // which dnf succeeds
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // which Xvfb (fails)
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // dnf install
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // xdpyinfo check

            manager = new XvfbManager()
            await manager.start()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo dnf install -y xorg-x11-server-Xvfb xorg-x11-utils'
            )
        })

        it('should handle unsupported distributions gracefully', async () => {
            mockExecAsync
                .mockRejectedValueOnce(new Error('no os-release'))
                .mockRejectedValueOnce(new Error('no apt-get'))
                .mockRejectedValueOnce(new Error('no yum'))
                .mockRejectedValueOnce(new Error('no dnf'))
                .mockRejectedValueOnce(new Error('no zypper'))
                .mockRejectedValueOnce(new Error('no pacman'))
                .mockRejectedValueOnce(new Error('no apk'))
                .mockResolvedValueOnce({ stdout: '', stderr: '' }) // which Xvfb (fails)

            manager = new XvfbManager()

            await expect(manager.start()).rejects.toThrow(
                "Xvfb is not installed. Please install it manually using your distribution's package manager."
            )
        })
    })

    describe('desktop environment detection', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
            // Clear environment variables
            delete process.env.XDG_CURRENT_DESKTOP
            delete process.env.GNOME_DESKTOP_SESSION_ID
            delete process.env.KDE_FULL_SESSION
            delete process.env.XFCE4_SESSION
        })

        it('should use existing XDG_CURRENT_DESKTOP', async () => {
            process.env.XDG_CURRENT_DESKTOP = 'KDE'

            manager = new XvfbManager()
            await manager.start()

            expect(process.env.XDG_CURRENT_DESKTOP).toBe('KDE')
        })

        it('should detect GNOME environment', async () => {
            process.env.GNOME_DESKTOP_SESSION_ID = 'this-session'

            manager = new XvfbManager()
            await manager.start()

            expect(process.env.XDG_CURRENT_DESKTOP).toBe('GNOME')
        })

        it('should fallback to generic desktop', async () => {
            manager = new XvfbManager()
            await manager.start()

            expect(process.env.XDG_CURRENT_DESKTOP).toBe('X-Generic')
        })
    })

    describe('default export (xvfb)', () => {
        it('should export a default instance', () => {
            expect(xvfb).toBeInstanceOf(XvfbManager)
        })

        it('should work with default instance', async () => {
            mockPlatform.mockReturnValue('linux')

            const result = await xvfb.start()
            expect(result).toBe(true)

            await xvfb.stop()
            expect(xvfb.isXvfbRunning()).toBe(false)
        })
    })
})

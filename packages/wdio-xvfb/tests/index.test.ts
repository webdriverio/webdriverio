import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { ChildProcess } from 'node:child_process'

// Use vi.hoisted to ensure mocks are set up before imports
const mockExecAsync = vi.hoisted(() => vi.fn())
const mockSpawn = vi.hoisted(() => vi.fn())
const mockPlatform = vi.hoisted(() => vi.fn())

// Mock all the modules before importing anything else
vi.mock('node:child_process', () => ({
    spawn: mockSpawn,
    exec: vi.fn()
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync)
}))

vi.mock('node:os', () => ({
    default: {
        platform: mockPlatform
    }
}))

vi.mock('@wdio/logger', () => ({
    default: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    }),
}))

// Import after mocking
import XvfbManager, { xvfb } from '../src/index.js'

describe('XvfbManager', () => {
    let manager: XvfbManager
    let mockProcess: Partial<ChildProcess>

    beforeEach(() => {
        vi.clearAllMocks()
        delete process.env.DISPLAY
        delete process.env.CI
        delete process.env.GITHUB_ACTIONS
        delete process.env.JENKINS_URL
        delete process.env.VITEST
        delete process.env.NODE_ENV
        // Clear any other common CI environment variables
        delete process.env.TRAVIS
        delete process.env.CIRCLECI
        delete process.env.GITLAB_CI
        delete process.env.BUILDKITE
        delete process.env.APPVEYOR
        // Clear Vitest/test-specific variables
        delete process.env.VITEST_POOL_ID
        delete process.env.VITEST_WORKER_ID
        delete process.env.TEST
        delete process.env.VITEST_MODE
        delete process.env.WDIO_UNIT_TESTS

        mockProcess = {
            pid: 12345,
            kill: vi.fn(),
            on: vi.fn().mockReturnValue(mockProcess),
            stdout: { on: vi.fn() } as any,
            stderr: { on: vi.fn() } as any,
            unref: vi.fn(),
        }

        mockSpawn.mockReturnValue(mockProcess as ChildProcess)

        // Set up default mock implementation
        mockExecAsync.mockImplementation((cmd: string) => {
            if (cmd === 'which Xvfb') {
                return Promise.resolve({ stdout: '/usr/bin/Xvfb', stderr: '' })
            }
            if (cmd.includes('pgrep')) {
                // By default, no existing Xvfb process found (empty output means no process)
                return Promise.resolve({ stdout: '', stderr: '' })
            }
            if (cmd.includes('xdpyinfo') || cmd.includes('DISPLAY=')) {
                // For waitForXvfb, succeed to indicate display is ready
                return Promise.resolve({ stdout: '', stderr: '' })
            }
            if (cmd.includes('pkill')) {
                return Promise.resolve({ stdout: '', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
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
                    detached: true,
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

        it('should skip startup if display is already in use', async () => {
            // Mock pgrep to return a PID, indicating existing Xvfb process
            mockExecAsync.mockImplementation((cmd: string) => {
                if (cmd === 'which Xvfb') {
                    return Promise.resolve({ stdout: '/usr/bin/Xvfb', stderr: '' })
                }
                if (cmd.includes('pgrep')) {
                    return Promise.resolve({ stdout: '12345', stderr: '' }) // Existing process PID
                }
                if (cmd.includes('xdpyinfo')) {
                    return Promise.resolve({ stdout: 'display info', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()

            const result = await manager.start()

            expect(result).toBe(true)
            expect(mockSpawn).not.toHaveBeenCalled()
            expect(manager.isXvfbRunning()).toBe(false) // Our instance is not running
        })
    })

    describe('stop', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('should stop Xvfb process', async () => {
            const killMock = vi.fn()
            mockProcess.kill = killMock

            // Mock the exit event to be triggered immediately after kill
            const onMock = vi.fn().mockImplementation((event, callback) => {
                if (event === 'exit') {
                    setTimeout(() => callback(0, null), 10)
                }
                return mockProcess
            })
            mockProcess.on = onMock

            manager = new XvfbManager()
            await manager.start()
            await manager.stop()

            expect(killMock).toHaveBeenCalledWith('SIGTERM')
            expect(manager.isXvfbRunning()).toBe(false)
        }, 10000)

        it('should restore original DISPLAY environment', async () => {
            process.env.DISPLAY = ':original'

            // Mock the exit event to resolve immediately
            const onMock = vi.fn().mockImplementation((event, callback) => {
                if (event === 'exit') {
                    setTimeout(() => callback(0, null), 10)
                }
                return mockProcess
            })
            mockProcess.on = onMock

            manager = new XvfbManager({ force: true })

            await manager.start()
            expect(process.env.DISPLAY).toBe(':99')

            await manager.stop()
            expect(process.env.DISPLAY).toBe(':original')
        }, 15000)

        it('should cleanup remaining processes', async () => {
            // Mock the exit event to resolve immediately
            const onMock = vi.fn().mockImplementation((event, callback) => {
                if (event === 'exit') {
                    setTimeout(() => callback(0, null), 10)
                }
                return mockProcess
            })
            mockProcess.on = onMock

            manager = new XvfbManager({ display: 42 })

            await manager.start()
            await manager.stop()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'pkill -f "Xvfb :42" || true'
            )
        }, 10000)

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
            let callCount = 0
            mockExecAsync.mockImplementation((cmd: string) => {
                if (cmd.includes('pgrep')) {
                    return Promise.resolve({ stdout: '', stderr: '' }) // No existing process
                }
                callCount++
                if (cmd === 'which Xvfb' && callCount === 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'cat /etc/os-release') {
                    return Promise.resolve({ stdout: 'NAME="Ubuntu 20.04 LTS"', stderr: '' })
                }
                if (cmd === 'sudo apt-get update -qq && sudo apt-get install -y xvfb x11-utils') {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                if (cmd === 'which Xvfb' && callCount > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/Xvfb', stderr: '' })
                }
                if (cmd.includes('xdpyinfo')) {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            await manager.start()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo apt-get update -qq && sudo apt-get install -y xvfb x11-utils'
            )
        })

        it('should detect Fedora distribution', async () => {
            let callCount = 0
            mockExecAsync.mockImplementation((cmd: string) => {
                if (cmd.includes('pgrep')) {
                    return Promise.resolve({ stdout: '', stderr: '' }) // No existing process
                }
                callCount++
                if (cmd === 'which Xvfb' && callCount === 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'cat /etc/os-release') {
                    return Promise.resolve({ stdout: 'NAME="Fedora Linux 35"', stderr: '' })
                }
                if (cmd === 'sudo dnf install -y xorg-x11-server-Xvfb xorg-x11-utils') {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                if (cmd === 'which Xvfb' && callCount > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/Xvfb', stderr: '' })
                }
                if (cmd.includes('xdpyinfo')) {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            await manager.start()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo dnf install -y xorg-x11-server-Xvfb xorg-x11-utils'
            )
        })

        it('should detect Arch Linux distribution', async () => {
            let callCount = 0
            mockExecAsync.mockImplementation((cmd: string) => {
                if (cmd.includes('pgrep')) {
                    return Promise.resolve({ stdout: '', stderr: '' }) // No existing process
                }
                callCount++
                if (cmd === 'which Xvfb' && callCount === 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'cat /etc/os-release') {
                    return Promise.resolve({ stdout: 'NAME="Arch Linux"', stderr: '' })
                }
                if (cmd === 'sudo pacman -S --noconfirm xorg-server-xvfb xorg-xdpyinfo') {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                if (cmd === 'which Xvfb' && callCount > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/Xvfb', stderr: '' })
                }
                if (cmd.includes('xdpyinfo')) {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            await manager.start()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo pacman -S --noconfirm xorg-server-xvfb xorg-xdpyinfo'
            )
        })

        it('should fallback to package manager detection', async () => {
            let callCount = 0
            mockExecAsync.mockImplementation((cmd: string) => {
                if (cmd.includes('pgrep')) {
                    return Promise.resolve({ stdout: '', stderr: '' }) // No existing process
                }
                callCount++
                if (cmd === 'which Xvfb' && callCount === 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'cat /etc/os-release') {
                    return Promise.reject(new Error('no os-release'))
                }
                if (cmd === 'which apt-get') {
                    return Promise.reject(new Error('no apt-get'))
                }
                if (cmd === 'which yum') {
                    return Promise.reject(new Error('no yum'))
                }
                if (cmd === 'which dnf') {
                    return Promise.resolve({ stdout: '/usr/bin/dnf', stderr: '' })
                }
                if (cmd === 'sudo dnf install -y xorg-x11-server-Xvfb xorg-x11-utils') {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                if (cmd === 'which Xvfb' && callCount > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/Xvfb', stderr: '' })
                }
                if (cmd.includes('xdpyinfo')) {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            await manager.start()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo dnf install -y xorg-x11-server-Xvfb xorg-x11-utils'
            )
        })

        it('should handle unsupported distributions gracefully', async () => {
            mockExecAsync.mockImplementation((cmd: string) => {
                if (cmd === 'which Xvfb') {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'cat /etc/os-release') {
                    return Promise.reject(new Error('no os-release'))
                }
                if (cmd.includes('which ')) {
                    return Promise.reject(new Error('not found'))
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

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

            // Mock the exit event to resolve immediately
            const onMock = vi.fn().mockImplementation((event, callback) => {
                if (event === 'exit') {
                    setTimeout(() => callback(0, null), 10)
                }
                return mockProcess
            })
            mockProcess.on = onMock

            const testManager = new XvfbManager()

            const result = await testManager.start()
            expect(result).toBe(true)

            await testManager.stop()
            expect(testManager.isXvfbRunning()).toBe(false)
        }, 15000)
    })
})
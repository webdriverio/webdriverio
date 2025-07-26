import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { ChildProcess } from 'node:child_process'

// Use vi.hoisted to ensure mocks are set up before imports
const mockExecAsync = vi.hoisted(() => vi.fn())
const mockSpawn = vi.hoisted(() => vi.fn())
const mockPlatform = vi.hoisted(() => vi.fn())
const mockIsCI = vi.hoisted(() => ({ value: false }))

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

vi.mock('is-ci', () => ({
    get default() {
        return mockIsCI.value
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
        mockIsCI.value = false
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

        // Set default mock values (mockIsCI is immutable from hoisted function)

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
            if (cmd === 'which xvfb-run') {
                return Promise.resolve({ stdout: '/usr/bin/xvfb-run', stderr: '' })
            }
            if (cmd.includes('xvfb-run')) {
                // Mock xvfb-run command execution
                return Promise.resolve({ stdout: 'Command executed successfully', stderr: '' })
            }
            if (cmd === 'cat /etc/os-release') {
                return Promise.resolve({ stdout: 'NAME="Ubuntu 20.04 LTS"', stderr: '' })
            }
            if (cmd.includes('apt-get install')) {
                return Promise.resolve({ stdout: 'Packages installed', stderr: '' })
            }
            return Promise.resolve({ stdout: '', stderr: '' })
        })
    })

    afterEach(async () => {
        vi.restoreAllMocks()
    })

    describe('constructor', () => {
        it('should create instance with default options', () => {
            manager = new XvfbManager()
            expect(manager).toBeInstanceOf(XvfbManager)
        })

        it('should create instance with custom options', () => {
            manager = new XvfbManager({ force: true })
            expect(manager).toBeInstanceOf(XvfbManager)
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
            mockIsCI.value = true
            process.env.DISPLAY = ':0'

            expect(manager.shouldRun()).toBe(true)
        })

        it('should return false on Linux with existing DISPLAY (not in CI)', () => {
            manager = new XvfbManager()
            mockPlatform.mockReturnValue('linux')
            mockIsCI.value = false
            process.env.DISPLAY = ':0'

            expect(manager.shouldRun()).toBe(false)
        })
    })

    describe('init', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('should setup xvfb-run when needed', async () => {
            manager = new XvfbManager()

            const result = await manager.init()

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith('which xvfb-run')
        })

        it('should not setup when not needed', async () => {
            manager = new XvfbManager()
            mockPlatform.mockReturnValue('darwin')

            const result = await manager.init()

            expect(result).toBe(false)
        })

        it('should install xvfb when xvfb-run is not available', async () => {
            mockExecAsync.mockImplementation((cmd: string) => {
                if (cmd === 'which xvfb-run' && mockExecAsync.mock.calls.length <= 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'which xvfb-run' && mockExecAsync.mock.calls.length > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/xvfb-run', stderr: '' })
                }
                if (cmd === 'cat /etc/os-release') {
                    return Promise.resolve({ stdout: 'NAME="Ubuntu 20.04 LTS"', stderr: '' })
                }
                if (cmd.includes('apt-get install')) {
                    return Promise.resolve({ stdout: 'Packages installed', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            const result = await manager.init()

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith('sudo apt-get update -qq && sudo apt-get install -y xvfb')
        })
    })

    describe('cross-distribution support', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('should detect Ubuntu distribution', async () => {
            let callCount = 0
            mockExecAsync.mockImplementation((cmd: string) => {
                callCount++
                if (cmd === 'which xvfb-run' && callCount === 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'cat /etc/os-release') {
                    return Promise.resolve({ stdout: 'NAME="Ubuntu 20.04 LTS"', stderr: '' })
                }
                if (cmd === 'sudo apt-get update -qq && sudo apt-get install -y xvfb') {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                if (cmd === 'which xvfb-run' && callCount > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/xvfb-run', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            await manager.init()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo apt-get update -qq && sudo apt-get install -y xvfb'
            )
        })

        it('should detect dnf package manager', async () => {
            let callCount = 0
            mockExecAsync.mockImplementation((cmd: string) => {
                callCount++
                if (cmd === 'which xvfb-run' && callCount === 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'which apt-get') {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'which dnf') {
                    return Promise.resolve({ stdout: '/usr/bin/dnf', stderr: '' })
                }
                if (cmd === 'sudo dnf install -y xorg-x11-server-Xvfb') {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                if (cmd === 'which xvfb-run' && callCount > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/xvfb-run', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            await manager.init()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo dnf install -y xorg-x11-server-Xvfb'
            )
        })

        it('should detect pacman package manager', async () => {
            let callCount = 0
            mockExecAsync.mockImplementation((cmd: string) => {
                callCount++
                if (cmd === 'which xvfb-run' && callCount === 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'which apt-get' || cmd === 'which dnf' || cmd === 'which yum' || cmd === 'which zypper') {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'which pacman') {
                    return Promise.resolve({ stdout: '/usr/bin/pacman', stderr: '' })
                }
                if (cmd === 'sudo pacman -S --noconfirm xorg-server-xvfb') {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                if (cmd === 'which xvfb-run' && callCount > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/xvfb-run', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            await manager.init()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo pacman -S --noconfirm xorg-server-xvfb'
            )
        })

        it('should detect dnf when apt-get is not available', async () => {
            let callCount = 0
            mockExecAsync.mockImplementation((cmd: string) => {
                callCount++
                if (cmd === 'which xvfb-run' && callCount === 1) {
                    return Promise.reject(new Error('not found'))
                }
                if (cmd === 'which apt-get') {
                    return Promise.reject(new Error('no apt-get'))
                }
                if (cmd === 'which dnf') {
                    return Promise.resolve({ stdout: '/usr/bin/dnf', stderr: '' })
                }
                if (cmd === 'sudo dnf install -y xorg-x11-server-Xvfb') {
                    return Promise.resolve({ stdout: '', stderr: '' })
                }
                if (cmd === 'which xvfb-run' && callCount > 1) {
                    return Promise.resolve({ stdout: '/usr/bin/xvfb-run', stderr: '' })
                }
                return Promise.resolve({ stdout: '', stderr: '' })
            })

            manager = new XvfbManager()
            await manager.init()

            expect(mockExecAsync).toHaveBeenCalledWith(
                'sudo dnf install -y xorg-x11-server-Xvfb'
            )
        })

        it('should handle unsupported package managers gracefully', async () => {
            mockExecAsync.mockImplementation((cmd: string) => {
                if (cmd === 'which xvfb-run') {
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

            await expect(manager.init()).rejects.toThrow(
                'Unsupported package manager: unknown. Please install Xvfb manually.'
            )
        })
    })

    describe('default export (xvfb)', () => {
        it('should export a default instance', () => {
            expect(xvfb).toBeInstanceOf(XvfbManager)
        })

        it('should work with default instance', async () => {
            mockPlatform.mockReturnValue('linux')

            const testManager = new XvfbManager()

            const result = await testManager.init()
            expect(result).toBe(true)
        })
    })
})
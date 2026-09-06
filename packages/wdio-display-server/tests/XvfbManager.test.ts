import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'

import { runAsRoot, runAsUser } from './helpers.js'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockPlatform = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
    execFile: vi.fn()
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync)
}))

vi.mock('node:fs/promises', () => ({
    // checkIsCentOS10() reads /etc/os-release directly; readdir/access are stubbed
    // for the paths that aren't exercised by these manager-level tests.
    readFile: mockReadFile,
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

        // XvfbDisplayServer.isAvailable() reads /etc/os-release first for CentOS
        // Stream 10 detection. A rejected read means "not CentOS Stream 10", so each
        // test's sequential execAsync chain stays aligned with `which Xvfb`,
        // `which apt-get`, etc. without the CentOS check consuming a slot.
        mockReadFile.mockRejectedValue(new Error('not centos'))

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
        it('should create instance with default options', () => {
            const manager = new XvfbManager({ displayServer: 'xvfb' })
            expect(manager).toBeInstanceOf(XvfbManager)
        })

        it('should create instance with custom options', () => {
            const manager = new XvfbManager({
                displayServer: 'xvfb',
                force: true,
                autoInstallMode: 'sudo'
            })
            expect(manager).toBeInstanceOf(XvfbManager)
        })
    })

    describe('shouldRun', () => {
        it('should return true when forced', () => {
            const manager = new XvfbManager({ displayServer: 'xvfb', force: true })
            mockPlatform.mockReturnValue('darwin')

            expect(manager.shouldRun()).toBe(true)
        })

        it('should return false on non-Linux platforms', () => {
            mockPlatform.mockReturnValue('darwin')

            expect(manager.shouldRun()).toBe(false)
        })

        it('should return true on Linux without DISPLAY', () => {
            mockPlatform.mockReturnValue('linux')
            delete process.env.DISPLAY

            expect(manager.shouldRun()).toBe(true)
        })

        it('should return false on Linux when DISPLAY is set', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'

            expect(manager.shouldRun()).toBe(false)
        })

        it('should return false when disabled via enabled:false', () => {
            const disabledManager = new XvfbManager({ displayServer: 'xvfb', enabled: false })
            mockPlatform.mockReturnValue('linux')
            delete process.env.DISPLAY

            expect(disabledManager.shouldRun()).toBe(false)
        })

        // A headless capability flag forces the display server on even when DISPLAY
        // is set. The detection branch is identical across vendors and flag
        // spellings, so drive the positive cases from a table.
        it.each([
            ['Chrome', 'goog:chromeOptions', '--headless'],
            ['Chrome', 'goog:chromeOptions', '--headless=new'],
            ['Chrome', 'goog:chromeOptions', '--headless=old'],
            ['Firefox', 'moz:firefoxOptions', '--headless'],
            ['Firefox', 'moz:firefoxOptions', '-headless'],
            ['Edge', 'ms:edgeOptions', '--headless'],
        ])('returns true when the %s headless flag %s is detected', (_vendor, optionsKey, flag) => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'

            const capabilities = {
                [optionsKey]: { args: [flag] },
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(true)
        })

        it('should handle array of capabilities (multiremote)', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'

            const capabilities = {
                browser1: {
                    capabilities: {
                        'goog:chromeOptions': {
                            args: ['--headless']
                        }
                    }
                },
                browser2: {
                    capabilities: {
                        'moz:firefoxOptions': {
                            args: ['--disable-gpu']
                        }
                    }
                }
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(true)
        })

        it('should return false when no headless flags in capabilities', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'

            const capabilities = {
                'goog:chromeOptions': {
                    args: ['--disable-gpu']
                }
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(false)
        })

        it('should handle capabilities without args', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'

            const capabilities = {
                'goog:chromeOptions': {}
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(false)
        })

        it('should handle undefined capabilities', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'

            expect(manager.shouldRun(undefined)).toBe(false)
        })
    })

    describe('init', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('should setup xvfb-run when needed', async () => {
            mockExecAsync.mockResolvedValue({ stdout: '/usr/bin/xvfb-run\n', stderr: '' })

            const result = await manager.init()

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith('which Xvfb')
        })

        it('should not setup when not needed', async () => {
            mockPlatform.mockReturnValue('darwin')

            const result = await manager.init()

            expect(result).toBe(false)
        })

        it('should setup xvfb-run when headless capabilities are provided', async () => {
            process.env.DISPLAY = ':0'
            mockExecAsync.mockResolvedValue({ stdout: '/usr/bin/xvfb-run\n', stderr: '' })

            const capabilities = {
                'goog:chromeOptions': {
                    args: ['--headless']
                }
            } as unknown as WebdriverIO.Config['capabilities']

            const result = await manager.init(capabilities)

            expect(result).toBe(true)
        })

        it('should return false and skip setup when disabled via enabled:false', async () => {
            const disabledManager = new XvfbManager({ displayServer: 'xvfb', enabled: false })
            mockPlatform.mockReturnValue('linux')
            delete process.env.DISPLAY

            const result = await disabledManager.init()
            expect(result).toBe(false)
            expect(mockExecAsync).not.toHaveBeenCalled()
        })

        describe('autoInstall', () => {
            it('should install xvfb with sudo -n when allowed and available (non-root, apt)', async () => {
                // Sequence in install(): which Xvfb -> detectPackageManager (apt-get) -> which sudo -> run install
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which Xvfb (initial)
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // which apt-get
                    .mockResolvedValueOnce({ stdout: '/usr/bin/sudo', stderr: '' }) // which sudo
                    .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' }) // install

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

            it('should not install and return false when xvfb-run is not available and autoInstall is disabled', async () => {
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
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['yum'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['zypper'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['pacman'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['apk'])
                expect(mockExecAsync).not.toHaveBeenCalledWith('which', ['xbps-install'])
            })
        })
    })

})

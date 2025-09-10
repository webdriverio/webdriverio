import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Use vi.hoisted to ensure mocks are set up before imports
const mockExecAsync = vi.hoisted(() => vi.fn())
const mockPlatform = vi.hoisted(() => vi.fn())
const mockIsCI = vi.hoisted(() => ({ value: false }))

// Mock all the modules before importing anything else
vi.mock('node:child_process', () => ({
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
    default: vi.fn(() => ({
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
    }))
}))

// Import after mocks are set up
const { XvfbManager } = await import('../src/XvfbManager.js')

describe('XvfbManager', () => {
    let manager: InstanceType<typeof XvfbManager>

    beforeEach(() => {
        vi.clearAllMocks()
        manager = new XvfbManager()

        // Reset environment
        delete process.env.DISPLAY
        mockIsCI.value = false
        mockPlatform.mockReturnValue('linux')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('constructor', () => {
        it('should create instance with default options', () => {
            const manager = new XvfbManager()
            expect(manager).toBeInstanceOf(XvfbManager)
        })

        it('should create instance with custom options', () => {
            const manager = new XvfbManager({
                force: true,
                packageManager: 'apt',
                xvfbMaxRetries: 5,
                xvfbRetryDelay: 2000
            })
            expect(manager).toBeInstanceOf(XvfbManager)
        })
    })

    describe('shouldRun', () => {
        it('should return true when forced', () => {
            const manager = new XvfbManager({ force: true })
            mockPlatform.mockReturnValue('darwin') // Non-Linux platform

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
            mockIsCI.value = true

            expect(manager.shouldRun()).toBe(false)
        })

        it('should return false on Linux with existing DISPLAY', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            expect(manager.shouldRun()).toBe(false)
        })

        it('should return false when disabled via enabled:false', () => {
            const disabledManager = new XvfbManager({ enabled: false })
            mockPlatform.mockReturnValue('linux')
            delete process.env.DISPLAY

            expect(disabledManager.shouldRun()).toBe(false)
        })

        it('should return true when Chrome headless flag is detected', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            const capabilities = {
                'goog:chromeOptions': {
                    args: ['--headless']
                }
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(true)
        })

        it('should return true when Chrome headless=new flag is detected', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            const capabilities = {
                'goog:chromeOptions': {
                    args: ['--headless=new']
                }
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(true)
        })

        it('should return true when Chrome headless=old flag is detected', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            const capabilities = {
                'goog:chromeOptions': {
                    args: ['--headless=old']
                }
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(true)
        })

        it('should return true when Firefox headless flag is detected', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            const capabilities = {
                'moz:firefoxOptions': {
                    args: ['--headless']
                }
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(true)
        })

        it('should return true when Firefox -headless flag is detected', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            const capabilities = {
                'moz:firefoxOptions': {
                    args: ['-headless']
                }
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(true)
        })

        it('should handle array of capabilities (multiremote)', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

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
            mockIsCI.value = false

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
            mockIsCI.value = false

            const capabilities = {
                'goog:chromeOptions': {}
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(false)
        })

        it('should handle empty capabilities', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            expect(manager.shouldRun(undefined)).toBe(false)
        })

        it('should handle undefined capabilities', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            expect(manager.shouldRun(undefined)).toBe(false)
        })

        it('should return true when Edge headless flag is detected (ms:edgeOptions)', () => {
            mockPlatform.mockReturnValue('linux')
            process.env.DISPLAY = ':0'
            mockIsCI.value = false

            const capabilities = {
                'ms:edgeOptions': {
                    args: ['--headless']
                }
            } as unknown as WebdriverIO.Config['capabilities']

            expect(manager.shouldRun(capabilities)).toBe(true)
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
            expect(mockExecAsync).toHaveBeenCalledWith('which xvfb-run')
        })

        it('should not setup when not needed', async () => {
            mockPlatform.mockReturnValue('darwin')

            const result = await manager.init()

            expect(result).toBe(false)
        })

        it('should setup xvfb-run when headless capabilities are provided', async () => {
            process.env.DISPLAY = ':0'
            mockIsCI.value = false
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
            const disabledManager = new XvfbManager({ enabled: false })
            mockPlatform.mockReturnValue('linux')
            delete process.env.DISPLAY

            const result = await disabledManager.init()
            expect(result).toBe(false)
            expect(mockExecAsync).not.toHaveBeenCalled()
        })

        describe('autoInstall', () => {
            it('should install xvfb with sudo -n when allowed and available (non-root, apt)', async () => {
                // Sequence: which xvfb-run -> which apt-get -> which sudo -> run install -> which xvfb-run (verify)
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run (initial)
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // which apt-get
                    .mockResolvedValueOnce({ stdout: '/usr/bin/sudo', stderr: '' }) // which sudo
                    .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' }) // install
                    .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' }) // which xvfb-run (verify)

                // Mock getuid to return non-root (1000) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'sudo' })

                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()

                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith('which xvfb-run')
                expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
                expect(mockExecAsync).toHaveBeenCalledWith('which sudo')
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'sudo -n DEBIAN_FRONTEND=noninteractive apt-get update -qq && sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
                    { timeout: 240000 }
                )
            })

            it('should not install and return false when xvfb-run is not available and autoInstall is disabled', async () => {
                // Mock xvfb-run not found
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found'))

                const manager = new XvfbManager()

                // Mock platform and environment
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()

                expect(result).toBe(false)
                // Should only check for xvfb-run
                expect(mockExecAsync).toHaveBeenCalledWith('which xvfb-run')
                // And should not attempt any package manager detection or install
                expect(mockExecAsync).not.toHaveBeenCalledWith('which apt-get')
                expect(mockExecAsync).not.toHaveBeenCalledWith('which dnf')
                expect(mockExecAsync).not.toHaveBeenCalledWith('which yum')
                expect(mockExecAsync).not.toHaveBeenCalledWith('which zypper')
                expect(mockExecAsync).not.toHaveBeenCalledWith('which pacman')
                expect(mockExecAsync).not.toHaveBeenCalledWith('which apk')
                expect(mockExecAsync).not.toHaveBeenCalledWith('which xbps-install')
            })

            describe('cross-distribution support', () => {
                beforeEach(() => {
                    mockPlatform.mockReturnValue('linux')
                })

                it('should detect Ubuntu distribution and install without sudo when running as root', async () => {
                    // Mock xvfb-run not found, then package manager detection
                    mockExecAsync
                        .mockRejectedValueOnce(new Error('Command not found'))
                        .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })
                        .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' })
                        .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' })

                    // Mock getuid to return root (0) - works on all platforms
                    ;(process as any).getuid = vi.fn().mockReturnValue(0)

                    const manager = new XvfbManager({ autoInstall: true })
                    delete process.env.DISPLAY

                    await manager.init()

                    expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
                    expect(mockExecAsync).toHaveBeenCalledWith(
                        'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
                        { timeout: 240000 }
                    )
                })

                it('should detect dnf package manager', async () => {
                    // Mock xvfb-run not found, then package manager detection
                    mockExecAsync
                        .mockRejectedValueOnce(new Error('Command not found'))
                        .mockRejectedValueOnce(new Error('apt-get not found'))
                        .mockResolvedValueOnce({ stdout: '/usr/bin/dnf', stderr: '' })
                        .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' })
                        .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' })

                    // Mock getuid to return root (0) - works on all platforms
                    ;(process as any).getuid = vi.fn().mockReturnValue(0)

                    const manager = new XvfbManager({ autoInstall: true })
                    delete process.env.DISPLAY

                    await manager.init()

                    expect(mockExecAsync).toHaveBeenCalledWith('which dnf')
                    expect(mockExecAsync).toHaveBeenCalledWith(
                        'dnf -y makecache && dnf -y install xorg-x11-server-Xvfb',
                        { timeout: 240000 }
                    )
                })

                it('should detect pacman package manager', async () => {
                    // Mock xvfb-run not found, then package manager detection
                    mockExecAsync
                        .mockRejectedValueOnce(new Error('Command not found'))
                        .mockRejectedValueOnce(new Error('apt-get not found'))
                        .mockRejectedValueOnce(new Error('dnf not found'))
                        .mockRejectedValueOnce(new Error('yum not found'))
                        .mockRejectedValueOnce(new Error('zypper not found'))
                        .mockResolvedValueOnce({ stdout: '/usr/bin/pacman', stderr: '' })
                        .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' })
                        .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' })

                    // Mock getuid to return root (0) - works on all platforms
                    ;(process as any).getuid = vi.fn().mockReturnValue(0)

                    const manager = new XvfbManager({ autoInstall: true })
                    delete process.env.DISPLAY

                    await manager.init()

                    expect(mockExecAsync).toHaveBeenCalledWith('which pacman')
                    expect(mockExecAsync).toHaveBeenCalledWith(
                        'pacman -Sy --noconfirm xorg-server-xvfb',
                        { timeout: 240000 }
                    )
                })

                it('should detect dnf when apt-get is not available', async () => {
                    // Mock xvfb-run not found, sudo available, then package manager detection
                    mockExecAsync
                        .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                        .mockResolvedValueOnce({ stdout: '/usr/bin/sudo', stderr: '' }) // which sudo
                        .mockRejectedValueOnce(new Error('apt-get not found')) // which apt-get
                        .mockResolvedValueOnce({ stdout: '/usr/bin/dnf', stderr: '' }) // which dnf
                        .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' }) // dnf install
                        .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' }) // verify which xvfb-run

                    // Mock getuid to return non-root (1000) - works on all platforms
                    ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                    const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'sudo' })
                    delete process.env.DISPLAY

                    await manager.init()

                    expect(mockExecAsync).toHaveBeenCalledWith('which xvfb-run')
                    expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
                    expect(mockExecAsync).toHaveBeenCalledWith('which dnf')
                    expect(mockExecAsync).toHaveBeenCalledWith('which sudo')
                })

                it('should handle unsupported package managers gracefully', async () => {
                    // Mock xvfb-run not found, then all package managers as not found
                    mockExecAsync
                        .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                        .mockRejectedValueOnce(new Error('apt-get not found')) // which apt-get
                        .mockRejectedValueOnce(new Error('dnf not found')) // which dnf
                        .mockRejectedValueOnce(new Error('yum not found')) // which yum
                        .mockRejectedValueOnce(new Error('zypper not found')) // which zypper
                        .mockRejectedValueOnce(new Error('pacman not found')) // which pacman
                        .mockRejectedValueOnce(new Error('apk not found')) // which apk
                        .mockRejectedValueOnce(new Error('xbps-install not found')) // which xbps-install

                    // Mock as root so installation is attempted
                    // Mock getuid to return root (0) - works on all platforms
                    ;(process as any).getuid = vi.fn().mockReturnValue(0)

                    const manager = new XvfbManager({ autoInstall: true })
                    delete process.env.DISPLAY

                    await expect(manager.init()).rejects.toThrow(
                        'Unsupported package manager: unknown. Please install Xvfb manually.'
                    )
                })
            })

            it("should skip install in 'sudo' mode when sudo is not present (non-root)", async () => {
                // Mock xvfb-run not found, then sudo not found (should skip installation)
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                    .mockRejectedValueOnce(new Error('sudo not found')) // which sudo

                // Mock getuid to return non-root (1000) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'sudo' })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(false)
                expect(mockExecAsync).toHaveBeenCalledWith('which xvfb-run')
                expect(mockExecAsync).toHaveBeenCalledWith('which sudo')
                // Should not check package managers since installation is skipped
                expect(mockExecAsync).not.toHaveBeenCalledWith('which apt-get')
                // Should not attempt installation
                expect(mockExecAsync).not.toHaveBeenCalledWith('DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb')
            })

            it('should treat empty object form as root-only: installs when root', async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // which apt-get
                    .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' }) // install
                    .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' }) // verify

                // Mock getuid to return root (0) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(0)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'root' })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
                    { timeout: 240000 }
                )
            })

            it('should treat empty object form as root-only: skips when not root', async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // which apt-get

                // Mock getuid to return non-root (1000) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'root' })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(false)
                // no sudo check, no install
                expect(mockExecAsync).not.toHaveBeenCalledWith('which sudo')
            })

            it("should not use sudo prefix when in 'sudo' mode but running as root", async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // which apt-get
                    .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' }) // install
                    .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' }) // verify

                // Mock getuid to return root (0) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(0)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'sudo' })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
                    { timeout: 240000 }
                )
            })

            it("should check for sudo even with custom command in 'sudo' mode (non-root)", async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // PM detection
                    .mockResolvedValueOnce({ stdout: '/usr/bin/sudo', stderr: '' }) // which sudo
                    .mockResolvedValueOnce({ stdout: 'ok', stderr: '' }) // run custom
                    .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' }) // verify

                // Mock getuid to return non-root (1000) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'sudo', autoInstallCommand: 'echo install' })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith('which sudo')
                expect(mockExecAsync).toHaveBeenCalledWith('echo install', { timeout: 240000 })
            })

            it('should handle zypper install flags (root)', async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                    .mockRejectedValueOnce(new Error('apt-get not found'))
                    .mockRejectedValueOnce(new Error('dnf not found'))
                    .mockRejectedValueOnce(new Error('yum not found'))
                    .mockResolvedValueOnce({ stdout: '/usr/bin/zypper', stderr: '' }) // zypper
                    .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' })
                    .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' })

                // Mock getuid to return root (0) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(0)

                const manager = new XvfbManager({ autoInstall: true })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                await manager.init()
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'zypper --non-interactive refresh && zypper --non-interactive install -y xvfb-run',
                    { timeout: 240000 }
                )
            })

            it('should skip availability check when forceInstall is true and perform install', async () => {
                mockExecAsync
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // which apt-get
                    .mockResolvedValueOnce({ stdout: 'installation success', stderr: '' })
                // no post-verify since forceInstall skips it

                // Mock getuid to return root (0) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(0)

                const manager = new XvfbManager({ autoInstall: true, forceInstall: true })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(true)
                // ensure no initial which xvfb-run call
                expect(mockExecAsync).not.toHaveBeenCalledWith('which xvfb-run')
                // but install was performed
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
                    { timeout: 240000 }
                )
            })
            it('should skip installation when not root and sudo is not allowed', async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run (initial)

                // Mock getuid to return non-root (1000) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'root' })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(false)
                expect(mockExecAsync).toHaveBeenCalledWith('which xvfb-run')
                // should not call package manager detection since installation is skipped
                expect(mockExecAsync).not.toHaveBeenCalledWith('which apt-get')
                // should not check sudo
                expect(mockExecAsync).not.toHaveBeenCalledWith('which sudo')
            })

            it('should use custom install command as-is (no sudo prefix)', async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run (initial)
                    .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // PM detection still runs
                    .mockResolvedValueOnce({ stdout: 'custom ok', stderr: '' }) // install
                    .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' }) // verify

                // Mock getuid to return non-root (1000) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'sudo', autoInstallCommand: 'my-custom-install' })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'my-custom-install',
                    { timeout: 240000 }
                )
            })

            it('should handle object format with array commands', async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                    .mockResolvedValueOnce({ stdout: '/usr/bin/sudo', stderr: '' }) // which sudo
                    .mockResolvedValueOnce({ stdout: 'array command ok', stderr: '' }) // install
                    .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' }) // verify

                // Mock getuid to return non-root (1000) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                const manager = new XvfbManager({
                    autoInstall: true,
                    autoInstallMode: 'sudo',
                    autoInstallCommand: ['custom', 'install', 'command']
                })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'custom install command',
                    { timeout: 240000 }
                )
            })

            it('should handle object format with mode only (defaults to sudo behavior)', async () => {
                mockExecAsync
                    .mockRejectedValueOnce(new Error('Command not found')) // which xvfb-run
                    .mockResolvedValueOnce({ stdout: '/usr/bin/sudo', stderr: '' }) // which sudo
                    .mockRejectedValueOnce(new Error('apt-get not found')) // which apt-get
                    .mockResolvedValueOnce({ stdout: '/usr/bin/dnf', stderr: '' }) // which dnf
                    .mockResolvedValueOnce({ stdout: 'dnf install ok', stderr: '' }) // install
                    .mockResolvedValueOnce({ stdout: '/usr/bin/xvfb-run\n', stderr: '' }) // verify

                // Mock getuid to return non-root (1000) - works on all platforms
                ;(process as any).getuid = vi.fn().mockReturnValue(1000)

                const manager = new XvfbManager({ autoInstall: true, autoInstallMode: 'sudo' })
                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()
                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith('which sudo')
            })
        })
    })

    describe('executeWithRetry', () => {
        beforeEach(() => {
            mockPlatform.mockReturnValue('linux')
        })

        it('should succeed on first attempt', async () => {
            const mockFn = vi.fn().mockResolvedValue('success')

            const result = await manager.executeWithRetry(mockFn, 'test operation')

            expect(result).toBe('success')
            expect(mockFn).toHaveBeenCalledTimes(1)
        })

        it('should retry on xvfb-related errors', async () => {
            const manager = new XvfbManager({ xvfbMaxRetries: 2, xvfbRetryDelay: 10 })
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error('xvfb-run: error: Xvfb failed to start'))
                .mockResolvedValueOnce('success')

            const result = await manager.executeWithRetry(mockFn, 'test operation')

            expect(result).toBe('success')
            expect(mockFn).toHaveBeenCalledTimes(2)
        })

        it('should retry with progressive delay', async () => {
            const manager = new XvfbManager({ xvfbMaxRetries: 3, xvfbRetryDelay: 100 })
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error('Xvfb failed to start'))
                .mockRejectedValueOnce(new Error('xvfb-run: error:'))
                .mockResolvedValueOnce('success')

            const startTime = Date.now()
            const result = await manager.executeWithRetry(mockFn, 'test operation')
            const endTime = Date.now()

            expect(result).toBe('success')
            expect(mockFn).toHaveBeenCalledTimes(3)
            // Should have waited at least 100ms + 200ms = 300ms for two retries
            expect(endTime - startTime).toBeGreaterThan(280)
        })

        it('should not retry on non-xvfb errors', async () => {
            const mockFn = vi.fn().mockRejectedValue(new Error('Regular error'))

            await expect(manager.executeWithRetry(mockFn, 'test operation')).rejects.toThrow('Regular error')
            expect(mockFn).toHaveBeenCalledTimes(1)
        })

        it('should exhaust retries and throw last error', async () => {
            const manager = new XvfbManager({ xvfbMaxRetries: 2, xvfbRetryDelay: 10 })
            const mockFn = vi.fn()
                .mockRejectedValueOnce(new Error('xvfb-run: error: Xvfb failed to start'))
                .mockRejectedValueOnce(new Error('X server died'))

            await expect(manager.executeWithRetry(mockFn, 'test operation')).rejects.toThrow('X server died')
            expect(mockFn).toHaveBeenCalledTimes(2)
        })

        it('should detect various xvfb error patterns', async () => {
            const manager = new XvfbManager({ xvfbMaxRetries: 1, xvfbRetryDelay: 10 })

            const errorPatterns = [
                'xvfb-run: error: Xvfb failed to start',
                'Xvfb failed to start',
                'xvfb-run: error: something else',
                'X server died'
            ]

            for (const errorMessage of errorPatterns) {
                const mockFn = vi.fn().mockRejectedValue(new Error(errorMessage))

                await expect(manager.executeWithRetry(mockFn, 'test')).rejects.toThrow(errorMessage)
                expect(mockFn).toHaveBeenCalledTimes(1)
            }
        })

        it('should handle case insensitive error matching', async () => {
            const manager = new XvfbManager({ xvfbMaxRetries: 1, xvfbRetryDelay: 10 })
            const mockFn = vi.fn().mockRejectedValue(new Error('XVFB-RUN: ERROR: XVFB FAILED TO START'))

            await expect(manager.executeWithRetry(mockFn, 'test')).rejects.toThrow('XVFB-RUN: ERROR: XVFB FAILED TO START')
            expect(mockFn).toHaveBeenCalledTimes(1)
        })
    })

})

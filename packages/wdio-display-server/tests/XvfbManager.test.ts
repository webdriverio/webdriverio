import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'

import { onPath, runAsUser } from './helpers.js'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockPlatform = vi.hoisted(() => vi.fn())
const mockStat = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
    execFile: vi.fn()
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync)
}))

vi.mock('node:fs/promises', () => ({
    stat: mockStat,
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
        mockStat.mockReset()

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
            onPath(mockStat, 'Xvfb')

            const result = await manager.init()

            expect(result).toBe(true)
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
                let installed = false
                mockStat.mockImplementation(async (file: string) => {
                    const name = path.basename(file)
                    if (name === 'apt-get' || name === 'sudo' || (installed && name === 'Xvfb')) {
                        return { isFile: () => true, mode: 0o100755 }
                    }
                    throw new Error(`ENOENT: ${file}`)
                })
                mockExecAsync.mockImplementation(async (command: string) => {
                    installed ||= command === 'sudo'
                    return { stdout: 'installation success', stderr: '' }
                })

                runAsUser()

                const manager = new XvfbManager({ displayServer: 'xvfb', autoInstall: true, autoInstallMode: 'sudo' })

                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()

                expect(result).toBe(true)
                expect(mockExecAsync).toHaveBeenCalledWith(
                    'sudo',
                    ['-n', 'sh', '-c', 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb'],
                    { timeout: 240000 }
                )
            })

            it('does not install and returns false when xvfb-run is not available and autoInstall is disabled', async () => {
                onPath(mockStat)

                const manager = new XvfbManager({ displayServer: 'xvfb' })

                mockPlatform.mockReturnValue('linux')
                delete process.env.DISPLAY

                const result = await manager.init()

                expect(result).toBe(false)
                expect(new Set(mockStat.mock.calls.map(([file]) => path.basename(file)))).toEqual(new Set(['Xvfb'])) // no package manager is probed without autoInstall
            })
        })
    })

})

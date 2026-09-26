import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'

import { PM_NAME_TO_CMD, arrangeDisplayFdSpawn, onPath, runAsRoot, trackExitListeners } from './helpers.js'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockSpawn = vi.hoisted(() => vi.fn())
const mockStat = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
    execFile: vi.fn(),
    spawn: mockSpawn,
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync),
}))

vi.mock('node:fs/promises', () => ({
    access: vi.fn(), // commandExists' execute check passes
    stat: mockStat,
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const { XvfbDisplayServer } = await import('../src/XvfbDisplayServer.js')

describe('XvfbDisplayServer', () => {
    trackExitListeners()

    beforeEach(() => {
        vi.clearAllMocks()
        mockStat.mockReset()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('isAvailable', () => {
        it('returns true when Xvfb is present even though xvfb-run is missing', async () => {
            // The daemon spawns Xvfb directly, so only Xvfb must be probed, not xvfb-run.
            onPath(mockStat, 'Xvfb')

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(true)
            expect(mockStat).not.toHaveBeenCalledWith(expect.stringMatching(/xvfb-run$/))
        })

        it('returns false when Xvfb is missing', async () => {
            onPath(mockStat)

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(false)
        })
    })

    describe('install', () => {
        it.each([
            ['apt', 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb'],
            ['dnf', 'dnf -y makecache && dnf -y install xorg-x11-server-Xvfb'],
            ['zypper', 'zypper --non-interactive refresh && zypper --non-interactive install -y xvfb-run'],
            ['pacman', 'pacman -Syu --noconfirm xorg-server-xvfb'],
            ['apk', 'apk add --no-cache xvfb-run'],
            ['xbps', 'xbps-install -Suy xbps && xbps-install -y xvfb-run'],
        ])('uses the correct install command for %s', async (pm, expectedCmd) => {
            onPath(mockStat, PM_NAME_TO_CMD[pm])
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })
            runAsRoot()
            const server = new XvfbDisplayServer()

            const result = await server.install({ mode: 'root' })

            expect(result).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith(expectedCmd, { timeout: 240000 })
        })
    })

    describe('startDaemon', () => {
        it('spawns Xvfb with -displayfd on fd 3 and derives DISPLAY from the number it reports', async () => {
            arrangeDisplayFdSpawn(mockSpawn, 107)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon({ width: 800, height: 600, depth: 16 })

            expect(mockSpawn).toHaveBeenCalledWith(
                'Xvfb',
                ['-displayfd', '3', '-screen', '0', '800x600x16', '-nolisten', 'tcp'],
                { stdio: ['ignore', 'ignore', 'pipe', 'pipe'] }
            )
            expect(daemon.env.DISPLAY).toBe(':107')
        })

        it('publishes GDK_BACKEND, XDG_SESSION_TYPE and ELECTRON_OZONE_PLATFORM_HINT as x11 in daemon env', async () => {
            arrangeDisplayFdSpawn(mockSpawn)

            const server = new XvfbDisplayServer()
            const daemon = await server.startDaemon()

            expect(daemon.env.GDK_BACKEND).toBe('x11')
            expect(daemon.env.XDG_SESSION_TYPE).toBe('x11')
            expect(daemon.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('x11')
        })

        it('uses default 1920x1080x24 when options omitted', async () => {
            arrangeDisplayFdSpawn(mockSpawn)

            const server = new XvfbDisplayServer()
            await server.startDaemon()

            expect(mockSpawn).toHaveBeenCalledWith(
                'Xvfb',
                expect.arrayContaining(['1920x1080x24']),
                expect.anything()
            )
        })

        it('rejects when Xvfb exits before reporting a display', async () => {
            const proc = arrangeDisplayFdSpawn(mockSpawn, null)

            const server = new XvfbDisplayServer()
            const startPromise = server.startDaemon()

            await new Promise((r) => setImmediate(r))
            proc.emit('exit', 1, null)

            await expect(startPromise).rejects.toThrow(/Xvfb process exited unexpectedly/)
        })
    })
})

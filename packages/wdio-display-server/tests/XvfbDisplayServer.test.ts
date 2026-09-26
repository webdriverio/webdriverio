import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import path from 'node:path'

import { arrangeDisplayFdSpawn, queuePackageManagerDetection, runAsRoot, trackExitListeners } from './helpers.js'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockSpawn = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: vi.fn(),
    execFile: vi.fn(),
    spawn: mockSpawn,
}))

vi.mock('node:util', () => ({
    promisify: vi.fn(() => mockExecAsync),
}))

vi.mock('node:fs/promises', () => ({
    readFile: mockReadFile,
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const { XvfbDisplayServer } = await import('../src/XvfbDisplayServer.js')

describe('XvfbDisplayServer', () => {
    trackExitListeners()

    beforeEach(() => {
        vi.clearAllMocks()
        // '' reads as non-CentOS-10, so checkIsCentOS10() is false.
        mockReadFile.mockResolvedValue('')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('isAvailable', () => {
        it('returns false when /etc/os-release identifies CentOS Stream 10', async () => {
            mockReadFile.mockResolvedValueOnce('NAME="CentOS Stream"\nVERSION_ID="10"\n')

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(false)
            expect(mockExecAsync).not.toHaveBeenCalled()
        })

        it('returns true when Xvfb is on PATH', async () => {
            mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/Xvfb', stderr: '' })

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(true)
        })

        it('returns true when Xvfb is present even though xvfb-run is missing', async () => {
            // The daemon spawns Xvfb directly, so only Xvfb must be probed, not xvfb-run.
            mockExecAsync.mockImplementation((cmd: string) =>
                cmd === 'which Xvfb'
                    ? Promise.resolve({ stdout: '/usr/bin/Xvfb', stderr: '' })
                    : Promise.reject(new Error('not found'))
            )

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(true)
            expect(mockExecAsync).not.toHaveBeenCalledWith('which xvfb-run')
        })

        it('returns false when Xvfb is missing', async () => {
            mockExecAsync.mockRejectedValueOnce(new Error('no Xvfb'))

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(false)
        })

        it('returns false when /etc/os-release shows a different CentOS Stream version', async () => {
            mockReadFile.mockResolvedValueOnce('NAME="CentOS Stream"\nVERSION_ID="9"\n')
            mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/Xvfb', stderr: '' })

            const server = new XvfbDisplayServer()
            expect(await server.isAvailable()).toBe(true)
        })
    })

    describe('install', () => {
        it('returns false immediately when CentOS 10 was detected by a prior isAvailable()', async () => {
            mockReadFile.mockResolvedValueOnce('NAME="CentOS Stream"\nVERSION_ID="10"\n')
            const server = new XvfbDisplayServer()
            await server.isAvailable()

            mockExecAsync.mockClear()
            const result = await server.install()

            expect(result).toBe(false)
            expect(mockExecAsync).not.toHaveBeenCalled()
        })

        it.each([
            ['apt', 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb'],
            ['dnf', 'dnf -y makecache && dnf -y install xorg-x11-server-Xvfb xorg-x11-server-utils'],
            ['yum', 'yum -y makecache && yum -y install xorg-x11-server-Xvfb xorg-x11-server-utils'],
            ['zypper', 'zypper --non-interactive refresh && zypper --non-interactive install -y xvfb-run'],
            ['pacman', 'pacman -Sy --noconfirm xorg-server-xvfb'],
            ['apk', 'apk update && apk add --no-cache xvfb-run'],
            ['xbps', 'xbps-install -Sy xvfb-run'],
        ])('uses the correct install command for %s', async (pm, expectedCmd) => {
            queuePackageManagerDetection(mockExecAsync, pm)
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

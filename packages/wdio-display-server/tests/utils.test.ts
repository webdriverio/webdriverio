import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { constants } from 'node:fs'
import path from 'node:path'

import { onPath } from './helpers.js'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockExecFileAsync = vi.hoisted(() => vi.fn())
const mockExecFn = vi.hoisted(() => Symbol('mock-exec'))
const mockExecFileFn = vi.hoisted(() => Symbol('mock-execFile'))
const mockAccess = vi.hoisted(() => vi.fn())
const mockStat = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    exec: mockExecFn,
    execFile: mockExecFileFn,
}))

vi.mock('node:util', () => ({
    promisify: vi.fn((fn: unknown) => {
        if (fn === mockExecFn) {
            return mockExecAsync
        }
        if (fn === mockExecFileFn) {
            return mockExecFileAsync
        }
        throw new Error('promisify mock: unexpected fn')
    }),
}))

vi.mock('node:fs/promises', () => ({
    access: mockAccess,
    stat: mockStat,
}))

const { commandExists, detectPackageManager, waitForSocket, installViaPackageManager } = await import('../src/utils.js')

const makeLogger = () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
}) as never

describe('commandExists', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockStat.mockReset()
        mockAccess.mockReset()
        vi.stubEnv('PATH', ['/usr/local/bin', '/usr/bin'].join(path.delimiter))
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('finds an executable file in a PATH directory', async () => {
        onPath(mockStat, 'weston')

        expect(await commandExists('weston')).toBe(true)
    })

    it('returns false when no PATH directory has the command', async () => {
        onPath(mockStat)

        expect(await commandExists('weston')).toBe(false)
    })

    it('ignores directories and files this process cannot execute', async () => {
        mockStat
            .mockResolvedValueOnce({ isFile: () => false, mode: 0o40755 })
            .mockResolvedValueOnce({ isFile: () => true, mode: 0o100644 })
        mockAccess.mockRejectedValueOnce(Object.assign(new Error('EACCES'), { code: 'EACCES' }))

        expect(await commandExists('weston')).toBe(false)
        expect(mockStat).toHaveBeenCalledTimes(2)
        expect(mockAccess).toHaveBeenCalledExactlyOnceWith('/usr/bin/weston', constants.X_OK)
    })

    it('skips a file with an execute bit only for another user and keeps searching PATH', async () => {
        onPath(mockStat, 'weston')
        mockAccess.mockRejectedValueOnce(Object.assign(new Error('EACCES'), { code: 'EACCES' })) // e.g. root-owned 0700

        expect(await commandExists('weston')).toBe(true)
        expect(mockAccess.mock.calls).toEqual([['/usr/local/bin/weston', constants.X_OK], ['/usr/bin/weston', constants.X_OK]])
    })

    it('treats an empty PATH entry as the working directory, as spawn does', async () => {
        vi.stubEnv('PATH', ['', '/opt/bin'].join(path.delimiter))
        onPath(mockStat)

        await commandExists('weston')

        expect(mockStat.mock.calls).toEqual([['weston'], ['/opt/bin/weston']])
    })
})

describe('detectPackageManager', () => {
    const PROBE_ORDER = [['apt-get', 'apt'], ['dnf', 'dnf'], ['zypper', 'zypper'], ['pacman', 'pacman'], ['apk', 'apk'], ['xbps-install', 'xbps']]

    beforeEach(() => {
        vi.clearAllMocks()
        mockStat.mockReset()
        mockAccess.mockReset()
        vi.stubEnv('PATH', '/usr/bin')
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it.each(PROBE_ORDER.map(([, name], i) => [name, PROBE_ORDER.slice(i).map(([command]) => command)]))(
        'detects %s ahead of the managers probed after it',
        async (name, installed) => {
            onPath(mockStat, ...installed)

            expect(await detectPackageManager()).toBe(name)
        },
    )

    it('stops at the first package manager it finds', async () => {
        onPath(mockStat, ...PROBE_ORDER.map(([command]) => command))

        await detectPackageManager()

        expect(mockStat).toHaveBeenCalledTimes(1)
    })

    it('returns "unknown" when no package manager is found', async () => {
        onPath(mockStat)

        expect(await detectPackageManager()).toBe('unknown')
    })
})

describe('waitForSocket', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('resolves as soon as the socket appears', async () => {
        mockAccess.mockResolvedValueOnce(undefined)

        await waitForSocket('/tmp/sock', 1000)

        expect(mockAccess).toHaveBeenCalledWith('/tmp/sock')
        expect(mockAccess).toHaveBeenCalledTimes(1)
    })

    it('polls until the socket appears', async () => {
        mockAccess
            .mockRejectedValueOnce(new Error('ENOENT'))
            .mockRejectedValueOnce(new Error('ENOENT'))
            .mockResolvedValueOnce(undefined)

        await waitForSocket('/tmp/sock', 1000)

        expect(mockAccess).toHaveBeenCalledTimes(3)
    })

    it('throws with the supplied label when the deadline expires', async () => {
        mockAccess.mockRejectedValue(new Error('ENOENT'))

        await expect(waitForSocket('/tmp/sock', 100, 'Wayland socket'))
            .rejects.toThrow(/Timed out waiting for Wayland socket at \/tmp\/sock/)
    })

    it('defaults to generic "socket" label when none provided', async () => {
        mockAccess.mockRejectedValue(new Error('ENOENT'))

        await expect(waitForSocket('/tmp/sock', 100))
            .rejects.toThrow(/Timed out waiting for socket at/)
    })

    it('resolves without polling when the abort signal is already aborted', async () => {
        mockAccess.mockRejectedValue(new Error('ENOENT'))
        const controller = new AbortController()
        controller.abort()

        // An aborted race (e.g. the daemon crashed) must stop the loop, not poll
        // for the full timeout, and must not reject.
        await expect(
            waitForSocket('/tmp/sock', 10_000, 'socket', controller.signal)
        ).resolves.toBeUndefined()
        expect(mockAccess).not.toHaveBeenCalled()
    })
})

describe('installViaPackageManager', () => {
    const packageCommands = {
        apt: 'apt install -y foo',
        dnf: 'dnf install foo',
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockStat.mockReset()
        mockAccess.mockReset()
        vi.stubEnv('PATH', '/usr/bin')
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('runs a custom string command verbatim and short-circuits PM detection', async () => {
        mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })

        const ok = await installViaPackageManager({
            name: 'Foo',
            packageCommands,
            log: makeLogger(),
            options: { command: 'my-install' },
        })

        expect(ok).toBe(true)
        expect(mockExecAsync).toHaveBeenCalledWith('my-install', { timeout: 240000 })
        expect(mockExecAsync).toHaveBeenCalledTimes(1)
        expect(mockStat).not.toHaveBeenCalled()
    })

    it('runs an array-form custom command via execFile so each element is a true argv token', async () => {
        mockExecFileAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })

        await installViaPackageManager({
            name: 'Foo',
            packageCommands,
            log: makeLogger(),
            options: { command: ['apt', 'install', 'foo'] },
        })

        // Array form must avoid the shell: a malicious element like `'foo; rm -rf /'`
        // stays a single argv token to `apt`, never interpreted as `;`.
        expect(mockExecFileAsync).toHaveBeenCalledWith('apt', ['install', 'foo'], { timeout: 240000 })
        expect(mockExecAsync).not.toHaveBeenCalled()
    })

    it('returns false when an array-form custom command is empty', async () => {
        const ok = await installViaPackageManager({
            name: 'Foo',
            packageCommands,
            log: makeLogger(),
            options: { command: [] },
        })

        expect(ok).toBe(false)
        expect(mockExecAsync).not.toHaveBeenCalled()
        expect(mockExecFileAsync).not.toHaveBeenCalled()
    })

    it('returns false when custom command fails', async () => {
        mockExecAsync.mockRejectedValueOnce(new Error('boom'))

        const ok = await installViaPackageManager({
            name: 'Foo',
            packageCommands,
            log: makeLogger(),
            options: { command: 'bad' },
        })

        expect(ok).toBe(false)
    })

    it('returns false when no package manager is detected', async () => {
        onPath(mockStat)

        const ok = await installViaPackageManager({
            name: 'Foo',
            packageCommands,
            log: makeLogger(),
            options: { mode: 'root' },
        })

        expect(ok).toBe(false)
    })

    it('returns false when detected PM is not in the supplied table', async () => {
        // Detect apt, but our table only has dnf
        onPath(mockStat, 'apt-get')

        const ok = await installViaPackageManager({
            name: 'Foo',
            packageCommands: { dnf: 'dnf install foo' },
            log: makeLogger(),
            options: { mode: 'root' },
        })

        expect(ok).toBe(false)
    })

    describe('mode: "root"', () => {
        it('runs install command directly when root', async () => {
            ;(process as any).getuid = vi.fn().mockReturnValue(0)
            onPath(mockStat, 'apt-get')
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' }) // install

            const ok = await installViaPackageManager({
                name: 'Foo',
                packageCommands,
                log: makeLogger(),
                options: { mode: 'root' },
            })

            expect(ok).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith('apt install -y foo', { timeout: 240000 })
        })

        it('refuses to install when not root', async () => {
            ;(process as any).getuid = vi.fn().mockReturnValue(1000)
            onPath(mockStat, 'apt-get')

            const ok = await installViaPackageManager({
                name: 'Foo',
                packageCommands,
                log: makeLogger(),
                options: { mode: 'root' },
            })

            expect(ok).toBe(false)
            expect(mockExecAsync).not.toHaveBeenCalledWith('apt install -y foo', expect.anything())
        })
    })

    describe('mode: "sudo"', () => {
        it('runs `sudo -n sh -c <cmd>` via execFile when non-root and sudo is on PATH', async () => {
            ;(process as any).getuid = vi.fn().mockReturnValue(1000)
            onPath(mockStat, 'apt-get', 'sudo')
            mockExecFileAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' }) // sudo install

            const ok = await installViaPackageManager({
                name: 'Foo',
                packageCommands,
                log: makeLogger(),
                options: { mode: 'sudo' },
            })

            expect(ok).toBe(true)
            // The command string is the inner-shell payload — passed as one
            // argv element to /bin/sh, so even if the table value contained
            // shell metacharacters they'd stay inside that single token
            // instead of being interpolated into our argv.
            expect(mockExecFileAsync).toHaveBeenCalledWith(
                'sudo',
                ['-n', 'sh', '-c', 'apt install -y foo'],
                { timeout: 240000 }
            )
        })

        it('attempts install without sudo wrapping when sudo is missing', async () => {
            ;(process as any).getuid = vi.fn().mockReturnValue(1000)
            onPath(mockStat, 'apt-get')
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' }) // install (non-sudo)

            const ok = await installViaPackageManager({
                name: 'Foo',
                packageCommands,
                log: makeLogger(),
                options: { mode: 'sudo' },
            })

            expect(ok).toBe(true)
            expect(mockExecAsync).toHaveBeenCalledWith('apt install -y foo', { timeout: 240000 })
        })

        it('does not wrap with sudo when running as root', async () => {
            ;(process as any).getuid = vi.fn().mockReturnValue(0)
            onPath(mockStat, 'apt-get')
            mockExecAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' }) // install

            await installViaPackageManager({
                name: 'Foo',
                packageCommands,
                log: makeLogger(),
                options: { mode: 'sudo' },
            })

            expect(mockExecAsync).toHaveBeenCalledWith('apt install -y foo', { timeout: 240000 })
            expect(mockExecFileAsync).not.toHaveBeenCalledWith('sudo', expect.anything(), expect.anything())
        })
    })

    it('returns false when the install command itself fails', async () => {
        ;(process as any).getuid = vi.fn().mockReturnValue(0)
        onPath(mockStat, 'apt-get')
        mockExecAsync.mockRejectedValueOnce(new Error('apt failed')) // install

        const ok = await installViaPackageManager({
            name: 'Foo',
            packageCommands,
            log: makeLogger(),
            options: { mode: 'root' },
        })

        expect(ok).toBe(false)
    })
})

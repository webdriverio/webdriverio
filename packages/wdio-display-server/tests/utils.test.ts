import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const mockExecAsync = vi.hoisted(() => vi.fn())
const mockExecFileAsync = vi.hoisted(() => vi.fn())
const mockExecFn = vi.hoisted(() => Symbol('mock-exec'))
const mockExecFileFn = vi.hoisted(() => Symbol('mock-execFile'))
const mockAccess = vi.hoisted(() => vi.fn())

vi.mock('node:child_process', () => ({
    // Stand-in identities — `promisify(exec)` and `promisify(execFile)` are
    // routed to the right mock below by matching against these symbols.
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
}))

const { detectPackageManager, waitForSocket, installViaPackageManager } = await import('../src/utils.js')

const makeLogger = () => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
}) as never

describe('detectPackageManager', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns "apt" when apt-get is available', async () => {
        mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('apt')
        expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
    })

    it('returns "dnf" when apt-get is missing but dnf is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/dnf', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('dnf')
        expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
        expect(mockExecAsync).toHaveBeenCalledWith('which dnf')
    })

    it('returns "yum" when only yum is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/yum', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('yum')
    })

    it('returns "zypper" when only zypper is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/zypper', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('zypper')
    })

    it('returns "pacman" when only pacman is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/pacman', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('pacman')
    })

    it('returns "apk" when only apk is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/sbin/apk', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('apk')
    })

    it('returns "xbps" when only xbps-install is available', async () => {
        mockExecAsync
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockRejectedValueOnce(new Error('not found'))
            .mockResolvedValueOnce({ stdout: '/usr/bin/xbps-install', stderr: '' })

        const result = await detectPackageManager()

        expect(result).toBe('xbps')
        expect(mockExecAsync).toHaveBeenCalledWith('which xbps-install')
    })

    it('returns "unknown" when no package manager is found', async () => {
        mockExecAsync.mockRejectedValue(new Error('not found'))

        const result = await detectPackageManager()

        expect(result).toBe('unknown')
        // Should have probed all 7 known package managers
        expect(mockExecAsync).toHaveBeenCalledTimes(7)
    })

    it('probes package managers in priority order, stopping at first hit', async () => {
        mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })

        await detectPackageManager()

        expect(mockExecAsync).toHaveBeenCalledTimes(1)
        expect(mockExecAsync).toHaveBeenCalledWith('which apt-get')
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
})

describe('installViaPackageManager', () => {
    const packageCommands = {
        apt: 'apt install -y foo',
        dnf: 'dnf install foo',
    }

    beforeEach(() => {
        vi.clearAllMocks()
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
        expect(mockExecAsync).toHaveBeenCalledTimes(1) // no `which X` probes
    })

    it('runs an array-form custom command via execFile so each element is a true argv token', async () => {
        mockExecFileAsync.mockResolvedValueOnce({ stdout: 'ok', stderr: '' })

        await installViaPackageManager({
            name: 'Foo',
            packageCommands,
            log: makeLogger(),
            options: { command: ['apt', 'install', 'foo'] },
        })

        // Crucially this is NOT `mockExecAsync(...)` — array form must avoid
        // the shell so a malicious element like `'foo; rm -rf /'` would be
        // passed as a single argv token to `apt`, not interpreted as `;`.
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
        // 7 rejections so detectPackageManager returns 'unknown'
        for (let i = 0; i < 7; i++) {
            mockExecAsync.mockRejectedValueOnce(new Error('not found'))
        }

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
        mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })

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
            mockExecAsync
                .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })
                .mockResolvedValueOnce({ stdout: 'ok', stderr: '' })

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
            mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })

            const ok = await installViaPackageManager({
                name: 'Foo',
                packageCommands,
                log: makeLogger(),
                options: { mode: 'root' },
            })

            expect(ok).toBe(false)
            // Install command was never invoked
            expect(mockExecAsync).not.toHaveBeenCalledWith('apt install -y foo', expect.anything())
        })
    })

    describe('mode: "sudo"', () => {
        it('runs `sudo -n sh -c <cmd>` via execFile when non-root and sudo is on PATH', async () => {
            ;(process as any).getuid = vi.fn().mockReturnValue(1000)
            mockExecAsync.mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' }) // detect PM
            mockExecFileAsync
                .mockResolvedValueOnce({ stdout: '/usr/bin/sudo', stderr: '' })            // which sudo
                .mockResolvedValueOnce({ stdout: 'ok', stderr: '' })                       // sudo install

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
            mockExecAsync
                .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })   // detect PM
                .mockResolvedValueOnce({ stdout: 'ok', stderr: '' })                 // install
            mockExecFileAsync.mockRejectedValueOnce(new Error('no sudo'))            // which sudo fails

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
            mockExecAsync
                .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })
                .mockResolvedValueOnce({ stdout: 'ok', stderr: '' })

            await installViaPackageManager({
                name: 'Foo',
                packageCommands,
                log: makeLogger(),
                options: { mode: 'sudo' },
            })

            expect(mockExecAsync).toHaveBeenCalledWith('apt install -y foo', { timeout: 240000 })
            expect(mockExecFileAsync).not.toHaveBeenCalled()
        })
    })

    it('returns false when the install command itself fails', async () => {
        ;(process as any).getuid = vi.fn().mockReturnValue(0)
        mockExecAsync
            .mockResolvedValueOnce({ stdout: '/usr/bin/apt-get', stderr: '' })
            .mockRejectedValueOnce(new Error('apt failed'))

        const ok = await installViaPackageManager({
            name: 'Foo',
            packageCommands,
            log: makeLogger(),
            options: { mode: 'root' },
        })

        expect(ok).toBe(false)
    })
})

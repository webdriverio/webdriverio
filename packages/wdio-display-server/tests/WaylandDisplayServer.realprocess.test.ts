import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { spawnSync } from 'node:child_process'
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DisplayDaemon } from '../src/types.js'
import { installStubOnPath } from './realprocess-helpers.js'

/**
 * Real-process coverage for WaylandDisplayServer, the bits mocks cannot prove: the
 * startDaemon()/stop() lifecycle against a controllable `weston` stub on PATH, and the
 * dnf install command run through a real shell. POSIX-only, so skipped on Windows.
 */
vi.mock('@wdio/logger', () => ({
    default: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}))

const { WaylandDisplayServer, WESTON_INSTALL_COMMANDS } = await import('../src/WaylandDisplayServer.js')

const stubPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'wayland-daemon-stub.mjs')
const exists = (p: string) => access(p).then(() => true, () => false)

describe.skipIf(process.platform === 'win32')('WaylandDisplayServer (real process lifecycle)', () => {
    let uninstall: () => Promise<void>
    let daemon: DisplayDaemon | undefined

    beforeAll(async () => {
        uninstall = await installStubOnPath('weston', stubPath)
    })

    afterAll(() => uninstall?.())

    afterEach(() => {
        daemon?.stopSync() // ensure no stub processes are orphaned
        daemon = undefined
        delete process.env.WDIO_STUB_MODE
    })

    it('spawns the daemon, waits for its socket, exposes env, and stop() tears it down', async () => {
        process.env.WDIO_STUB_MODE = 'ready'

        daemon = await new WaylandDisplayServer().startDaemon({ width: 100, height: 100 })

        expect(daemon.env.WAYLAND_DISPLAY).toBe('wayland-0')
        expect(daemon.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')
        const runtimeDir = daemon.env.XDG_RUNTIME_DIR
        expect(await exists(path.join(runtimeDir, daemon.env.WAYLAND_DISPLAY))).toBe(true)

        await daemon.stop()
        daemon = undefined

        expect(await exists(runtimeDir)).toBe(false)
    }, 15_000)

    it('rejects with the captured stderr when the daemon crashes before the socket appears', async () => {
        process.env.WDIO_STUB_MODE = 'crash'

        await expect(new WaylandDisplayServer().startDaemon({ width: 100, height: 100 }))
            .rejects.toThrow(/Weston process exited unexpectedly[\s\S]*simulated startup failure/)
    }, 15_000)

    it('escalates to SIGKILL when the daemon ignores SIGTERM', async () => {
        process.env.WDIO_STUB_MODE = 'ignore-sigterm'

        daemon = await new WaylandDisplayServer().startDaemon({ width: 100, height: 100 })
        const runtimeDir = daemon.env.XDG_RUNTIME_DIR

        const start = Date.now()
        await daemon.stop()
        const elapsed = Date.now() - start
        daemon = undefined

        // SIGTERM is swallowed, so stop() must wait out the ~1s grace period and
        // then SIGKILL — proving the real escalation path, then clean up.
        expect(elapsed).toBeGreaterThanOrEqual(900)
        expect(await exists(runtimeDir)).toBe(false)
    }, 15_000)
})

describe.skipIf(process.platform === 'win32')('dnf install command (real shell)', () => {
    const DNF = [
        '#!/bin/sh',
        'echo "dnf $*" >> "$LOG"',
        'case "$*" in',
        '    *"install weston") [ -n "$WESTON_IN_BASE" ] || [ -f "$STATE/epel" ] ;;',
        '    *"install epel-release"*) : > "$STATE/epel" ;;',
        'esac',
    ].join('\n')
    const RPM = '#!/bin/sh\necho "$RHEL"\n'
    const CRB = '#!/bin/sh\necho "crb $*" >> "$LOG"\n'

    async function runDnfInstall(env: { RHEL: string, WESTON_IN_BASE?: string }) {
        const dir = await mkdtemp(path.join(os.tmpdir(), 'wdio-dnf-stub-'))
        try {
            for (const [name, script] of [['dnf', DNF], ['rpm', RPM], ['crb', CRB]]) {
                await writeFile(path.join(dir, name), script, { mode: 0o755 })
            }
            const log = path.join(dir, 'calls.log')
            await writeFile(log, '')
            const { status } = spawnSync('/bin/sh', ['-c', WESTON_INSTALL_COMMANDS.dnf], {
                env: { PATH: dir, LOG: log, STATE: dir, WESTON_IN_BASE: '', ...env }, // the stubs use only shell builtins, so the host's dnf never runs
                timeout: 10_000,
            })
            return { status, calls: (await readFile(log, 'utf8')).trim().split('\n') }
        } finally {
            await rm(dir, { recursive: true, force: true })
        }
    }

    it('installs Weston from the base repos when it is there', async () => {
        expect(await runDnfInstall({ RHEL: '', WESTON_IN_BASE: '1' })).toEqual({
            status: 0,
            calls: ['dnf -y makecache', 'dnf -y install weston'],
        })
    })

    it('enables EPEL and CRB on Enterprise Linux 10', async () => {
        expect(await runDnfInstall({ RHEL: '10' })).toEqual({
            status: 0,
            calls: ['dnf -y makecache', 'dnf -y install weston', 'dnf -y install epel-release dnf-plugins-core', 'crb enable', 'dnf -y install weston'],
        })
    })

    it.each([['older Enterprise Linux', '9'], ['Fedora', '']])('leaves the repos alone on %s', async (_, rhel) => {
        const { status, calls } = await runDnfInstall({ RHEL: rhel })

        expect(status).not.toBe(0)
        expect(calls).toEqual(['dnf -y makecache', 'dnf -y install weston'])
    })
})

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { mkdtemp, writeFile, chmod, access, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { DisplayDaemon } from '../src/types.js'

/**
 * Real-process lifecycle coverage for WaylandDisplayServer.startDaemon()/stop().
 *
 * Unlike WaylandDisplayServer.test.ts (which mocks `spawn`), this suite spawns a
 * real, controllable `weston` stub on PATH and drives the genuine async/process
 * lifecycle — real child process, real SIGTERM/SIGKILL delivery, real socket-file
 * polling, real stderr capture, real runtime-dir cleanup — the bits mocks cannot
 * prove. POSIX-only (signals), so skipped on Windows.
 */
vi.mock('@wdio/logger', () => ({
    default: () => ({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}))

const { WaylandDisplayServer } = await import('../src/WaylandDisplayServer.js')

const stubPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'wayland-daemon-stub.mjs')
const exists = (p: string) => access(p).then(() => true, () => false)

describe.skipIf(process.platform === 'win32')('WaylandDisplayServer (real process lifecycle)', () => {
    let binDir: string
    let originalPath: string | undefined
    let daemon: DisplayDaemon | undefined

    beforeAll(async () => {
        // A `weston` on PATH that execs the stub. `exec` replaces the shell, so
        // the resulting process IS node — signals from the parent hit it directly.
        binDir = await mkdtemp(path.join(os.tmpdir(), 'wdio-weston-stub-'))
        const shim = path.join(binDir, 'weston')
        await writeFile(shim, `#!/bin/sh\nexec node "${stubPath}" "$@"\n`)
        await chmod(shim, 0o755)
        originalPath = process.env.PATH
        process.env.PATH = `${binDir}${path.delimiter}${originalPath ?? ''}`
    })

    afterAll(async () => {
        process.env.PATH = originalPath
        await rm(binDir, { recursive: true, force: true }).catch(() => {})
    })

    afterEach(() => {
        // Best-effort: SIGKILL + rmSync any daemon a failed test left running so
        // no stub process (especially the SIGTERM-ignoring one) is orphaned.
        daemon?.stopSync()
        daemon = undefined
        delete process.env.WDIO_STUB_MODE
    })

    it('spawns the daemon, waits for its socket, exposes env, and stop() tears it down', async () => {
        process.env.WDIO_STUB_MODE = 'ready'

        daemon = await new WaylandDisplayServer().startDaemon({ width: 100, height: 100 })

        expect(daemon.env.WAYLAND_DISPLAY).toMatch(/^wayland-\d+$/)
        expect(daemon.env.ELECTRON_OZONE_PLATFORM_HINT).toBe('wayland')
        const runtimeDir = daemon.env.XDG_RUNTIME_DIR
        // The socket the parent polled for actually exists on disk.
        expect(await exists(path.join(runtimeDir, daemon.env.WAYLAND_DISPLAY))).toBe(true)

        await daemon.stop()
        daemon = undefined

        // Graceful stop removes the runtime dir.
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

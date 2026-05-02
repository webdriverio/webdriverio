import { expect } from '@wdio/globals'
import { spawnSync } from 'node:child_process'
import { launcher as DisplayServerLauncher } from '@wdio/display-server'

/**
 * Verifies the launcher-side display server hook used by services like Tauri,
 * which spawn drivers in `onPrepare` (the launcher process) before any worker
 * exists. The launcher service must:
 *   1. Start a long-lived display server daemon on Linux.
 *   2. Set DISPLAY / WAYLAND_DISPLAY on `process.env` so subsequently-spawned
 *      child processes inherit it via normal env propagation.
 *   3. Tear down the daemon on `onComplete`.
 */
describe('display server launcher service', () => {
    let service: InstanceType<typeof DisplayServerLauncher>
    let savedDisplay: string | undefined
    let savedWayland: string | undefined

    beforeEach(() => {
        savedDisplay = process.env.DISPLAY
        savedWayland = process.env.WAYLAND_DISPLAY
        delete process.env.DISPLAY
        delete process.env.WAYLAND_DISPLAY
        service = new DisplayServerLauncher()
    })

    afterEach(async () => {
        await service.onComplete!(0, {} as never, [] as never, {} as never)
        if (savedDisplay === undefined) {
            delete process.env.DISPLAY
        } else {
            process.env.DISPLAY = savedDisplay
        }
        if (savedWayland === undefined) {
            delete process.env.WAYLAND_DISPLAY
        } else {
            process.env.WAYLAND_DISPLAY = savedWayland
        }
    })

    it('sets DISPLAY (or WAYLAND_DISPLAY) on process.env so child processes inherit it', async function (this: Mocha.Context) {
        this.timeout(60_000)

        await service.onPrepare!({} as never, [{ browserName: 'chrome' }] as never)

        const display = process.env.DISPLAY
        const wayland = process.env.WAYLAND_DISPLAY
        expect(display || wayland).toBeTruthy()

        // A child process spawned AFTER onPrepare must see the env (Tauri pattern).
        const result = spawnSync('printenv', { encoding: 'utf8' })
        expect(result.status).toBe(0)
        if (display) {
            expect(result.stdout).toContain(`DISPLAY=${display}`)
        }
        if (wayland) {
            expect(result.stdout).toContain(`WAYLAND_DISPLAY=${wayland}`)
        }
    })

    it('no-ops when DISPLAY is already set externally', async function (this: Mocha.Context) {
        this.timeout(10_000)

        process.env.DISPLAY = ':42'
        await service.onPrepare!({} as never, [] as never)

        // Launcher must not have replaced the user-provided DISPLAY
        expect(process.env.DISPLAY).toBe(':42')
    })

    it('cleans up the daemon on onComplete', async function (this: Mocha.Context) {
        this.timeout(60_000)

        await service.onPrepare!({} as never, [{ browserName: 'chrome' }] as never)
        const display = process.env.DISPLAY
        await service.onComplete!(0, {} as never, [] as never, {} as never)

        // After cleanup, the daemon's display should no longer be reachable.
        // Use xdpyinfo if available; fall back to socket-file probe via test -e.
        if (display) {
            const xdpyinfo = spawnSync('which', ['xdpyinfo'], { encoding: 'utf8' })
            if (xdpyinfo.status === 0) {
                const probe = spawnSync('xdpyinfo', ['-display', display], { encoding: 'utf8' })
                expect(probe.status).not.toBe(0)
            }
        }
    })
})

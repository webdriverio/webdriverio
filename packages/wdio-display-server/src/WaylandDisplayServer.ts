import { rmSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import logger from '@wdio/logger'
import type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerInstallOptions,
} from './types.js'
import { commandExists, installViaPackageManager, resolveDaemonDimensions } from './utils.js'
import { runDaemon } from './daemonProcess.js'

// One source of truth: getChromeFlags() and DisplayServerManager's
// externally-set-WAYLAND_DISPLAY fallback both use these and must not drift.
export const WAYLAND_CHROME_FLAGS: string[] = [
    '--ozone-platform=wayland',
    '--enable-features=UseOzonePlatform',
]

export class WaylandDisplayServer implements DisplayServer {
    readonly name = 'wayland' as const
    private log = logger('@wdio/display-server:wayland')
    private static daemonCounter = 0

    async isAvailable(): Promise<boolean> {
        if (await commandExists('weston')) {
            this.log.info('Weston compositor found in PATH')
            return true
        }
        this.log.debug('Weston compositor not found')
        return false
    }

    async install(options?: DisplayServerInstallOptions): Promise<boolean> {
        return installViaPackageManager({
            name: 'Weston',
            packageCommands: {
                apt: 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y weston',
                dnf: 'dnf -y makecache && dnf -y install weston',
                yum: 'yum -y makecache && yum -y install weston',
                zypper: 'zypper --non-interactive refresh && zypper --non-interactive install -y weston',
                pacman: 'pacman -Sy --noconfirm weston',
                apk: 'apk update && apk add --no-cache weston',
                xbps: 'xbps-install -Sy weston',
            },
            log: this.log,
            options,
        })
    }

    getChromeFlags(): string[] {
        return [...WAYLAND_CHROME_FLAGS]
    }

    async startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon> {
        const { width, height } = resolveDaemonDimensions(options)

        const id = ++WaylandDisplayServer.daemonCounter
        const runtimeDir = `/tmp/wdio-wayland-${process.pid}-${id}`
        const socketName = `wayland-${id}`
        const socketPath = `${runtimeDir}/${socketName}`

        await mkdir(runtimeDir, { recursive: true, mode: 0o700 })
        this.log.info(`Starting Weston daemon on ${socketName} (${width}x${height}) in ${runtimeDir}`)

        return runDaemon({
            command: 'weston',
            // --use-pixman forces software rendering on GPU-less CI containers. Deprecated
            // for --renderer=pixman in weston 10+, but some distros in the e2e matrix ship
            // weston < 10 without --renderer, so the portable flag stays.
            args: ['--backend=headless', `--width=${width}`, `--height=${height}`, '--use-pixman', `--socket=${socketName}`],
            socketPath,
            spawnEnv: { ...process.env, XDG_RUNTIME_DIR: runtimeDir },
            label: 'Weston',
            socketLabel: 'Wayland socket',
            log: this.log,
            env: {
                WAYLAND_DISPLAY: socketName,
                XDG_RUNTIME_DIR: runtimeDir,
                // Pin GTK to our weston compositor so an inherited GDK_BACKEND
                // doesn't send GTK to a missing X11.
                GDK_BACKEND: 'wayland',
                ELECTRON_OZONE_PLATFORM_HINT: 'wayland',
            },
            cleanup: () => rm(runtimeDir, { recursive: true, force: true }).catch(() => {}),
            cleanupSync: () => {
                try {
                    rmSync(runtimeDir, { recursive: true, force: true })
                } catch { /* best-effort */ }
            },
        })
    }

}

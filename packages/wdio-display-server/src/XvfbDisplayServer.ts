import { exec } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import logger from '@wdio/logger'
import type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerInstallOptions,
} from './types.js'
import { installViaPackageManager } from './utils.js'
import { runDaemon } from './daemonProcess.js'

const execAsync = promisify(exec)
const X_SOCKET_DIR = '/tmp/.X11-unix'
// Xvfb hardcodes /tmp for its per-display lock files (`.X<n>-lock`) regardless
// of TMPDIR; we scan the same path it would write to.
const X_LOCK_DIR = '/tmp'

export class XvfbDisplayServer implements DisplayServer {
    readonly name = 'xvfb' as const
    private log = logger('@wdio/display-server: xvfb')
    private isCentOS10 = false
    private static reservedDisplays = new Set<number>()

    async isAvailable(): Promise<boolean> {
        if (await this.checkIsCentOS10()) {
            this.log.info('CentOS Stream 10 detected - Xvfb unavailable, skipping')
            this.isCentOS10 = true
            return false
        }

        try {
            // Only Xvfb is required: the daemon spawns `Xvfb` directly (not the
            // `xvfb-run` wrapper), so requiring xvfb-run would wrongly skip the
            // daemon on systems that ship Xvfb without the xvfb-run script
            // (e.g. minimal RPM installs of xorg-x11-server-Xvfb).
            await execAsync('which Xvfb')
            this.log.info('Xvfb found in PATH')
            return true
        } catch {
            this.log.debug('Xvfb not found')
            return false
        }
    }

    private async checkIsCentOS10(): Promise<boolean> {
        try {
            const content = await readFile('/etc/os-release', 'utf-8')
            return content.includes('CentOS Stream') && content.includes('VERSION_ID="10"')
        } catch {
            return false
        }
    }

    async install(options?: DisplayServerInstallOptions): Promise<boolean> {
        // Xvfb has no maintained package on CentOS Stream 10; bail before
        // probing the package manager.
        if (this.isCentOS10) {
            this.log.info('Skipping Xvfb installation on CentOS Stream 10 - not available')
            return false
        }

        return installViaPackageManager({
            name: 'Xvfb',
            packageCommands: {
                apt: 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
                dnf: 'dnf -y makecache && dnf -y install xorg-x11-server-Xvfb xorg-x11-server-utils',
                yum: 'yum -y makecache && yum -y install xorg-x11-server-Xvfb xorg-x11-server-utils',
                zypper: 'zypper --non-interactive refresh && zypper --non-interactive install -y xvfb-run',
                pacman: 'pacman -Sy --noconfirm xorg-server-xvfb',
                apk: 'apk update && apk add --no-cache xvfb-run',
                xbps: 'xbps-install -Sy xvfb-run',
            },
            log: this.log,
            options,
        })
    }

    getChromeFlags(): string[] {
        // Forces the X11 ozone backend so a Wayland-host caller using
        // `displayServer: 'xvfb'` doesn't have Chromium try the host's
        // compositor instead of our Xvfb. No-op on Wayland-less CI.
        return ['--ozone-platform=x11']
    }

    async startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon> {
        const width = options?.width ?? 1920
        const height = options?.height ?? 1080
        const depth = options?.depth ?? 24

        const displayNum = await this.findFreeDisplay()
        const display = `:${displayNum}`
        const socketPath = `${X_SOCKET_DIR}/X${displayNum}`

        this.log.info(`Starting Xvfb daemon on ${display} (${width}x${height}x${depth})`)

        // Force GTK/Electron to X11. Without these, a Wayland-host's inherited
        // `GDK_BACKEND=wayland,x11` makes them try Wayland first, fail (we're running
        // Xvfb), and surface as `session not created: Chrome instance exited`.
        return runDaemon({
            command: 'Xvfb',
            args: [display, '-screen', '0', `${width}x${height}x${depth}`, '-nolisten', 'tcp'],
            socketPath,
            label: 'Xvfb',
            socketLabel: 'Xvfb socket',
            log: this.log,
            env: {
                DISPLAY: display,
                GDK_BACKEND: 'x11',
                ELECTRON_OZONE_PLATFORM_HINT: 'x11',
            },
            // No rm of the X socket under /tmp/.X11-unix/X<n>: the X server overwrites
            // stale ones on next start, so only the display reservation is released.
            cleanup: () => { XvfbDisplayServer.reservedDisplays.delete(displayNum) },
            cleanupSync: () => { XvfbDisplayServer.reservedDisplays.delete(displayNum) },
        })
    }

    private async findFreeDisplay(): Promise<number> {
        const used = new Set<number>(XvfbDisplayServer.reservedDisplays)
        try {
            const entries = await readdir(X_SOCKET_DIR)
            for (const entry of entries) {
                const match = entry.match(/^X(\d+)$/)
                if (match) {
                    used.add(parseInt(match[1], 10))
                }
            }
        } catch {
            // socket dir may not exist yet — Xvfb will create it
        }
        // Also treat displays with leftover lock files as in-use. A crashed
        // Xvfb can leave /tmp/.X<n>-lock behind after the socket is gone; a
        // fresh Xvfb will refuse to claim that display number with
        // "Server is already active for display :<n>". Without this scan,
        // retries pick the same stale-locked number and every attempt fails.
        try {
            const entries = await readdir(X_LOCK_DIR)
            for (const entry of entries) {
                const match = entry.match(/^\.X(\d+)-lock$/)
                if (match) {
                    used.add(parseInt(match[1], 10))
                }
            }
        } catch {
            // /tmp should always exist, but guard anyway
        }
        for (let n = 99; n < 200; n++) {
            if (!used.has(n) && !XvfbDisplayServer.reservedDisplays.has(n)) {
                XvfbDisplayServer.reservedDisplays.add(n)
                return n
            }
        }
        throw new Error('No free X display number available in range :99-:199')
    }

}

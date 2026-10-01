import { rmSync } from 'node:fs'
import { mkdtemp, rm } from 'node:fs/promises'
import path from 'node:path'
import logger from '@wdio/logger'
import type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerInstallOptions,
} from './types.js'
import { commandExists, installViaPackageManager, resolveDaemonDimensions } from './utils.js'
import { runDaemon } from './daemonProcess.js'
import { sessionEnv } from './sessionEnv.js'

const WESTON_INSTALL_COMMANDS: Record<string, string> = {
    apt: 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y weston',
    // EL 10 has no Xvfb and ships Weston only in EPEL, so enable EPEL and CRB there, with the dnf-plugins-core
    // that crb needs. Older EL gets Xvfb instead, so its repos are left alone.
    dnf: 'dnf -y makecache && (dnf -y install weston || ([ "$(rpm -E "%{?rhel}")" -ge 10 ] 2>/dev/null && dnf -y install epel-release dnf-plugins-core && crb enable && dnf -y install weston))',
    zypper: 'zypper --non-interactive refresh && zypper --non-interactive install -y weston',
    pacman: 'pacman -Syu --noconfirm weston', // -Syu, not -Sy: Arch doesn't support partial upgrades, which can leave Weston needing a newer glibc
    apk: 'apk add --no-cache weston weston-backend-headless weston-shell-desktop', // Alpine splits the headless backend and the default shell into subpackages
    xbps: 'xbps-install -Suy xbps && xbps-install -y weston', // xbps refuses to install anything while xbps itself is outdated
}

export class WaylandDisplayServer implements DisplayServer {
    readonly name = 'wayland' as const
    private log = logger('@wdio/display-server:wayland')

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
            packageCommands: WESTON_INSTALL_COMMANDS,
            log: this.log,
            options,
        })
    }

    async startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon> {
        const { width, height } = resolveDaemonDimensions(options)

        const runtimeDir = await mkdtemp('/tmp/wdio-wayland-') // /tmp, not TMPDIR, keeps the socket path under the 107-byte limit
        const socketName = 'wayland-0'
        const socketPath = path.join(runtimeDir, socketName)

        this.log.info(`Starting Weston daemon on ${socketName} (${width}x${height}) in ${runtimeDir}`)

        return runDaemon({
            command: 'weston',
            args: [
                '--backend=headless-backend.so', // Weston 10 (Debian 12) needs the pre-12 name, which later versions still accept
                `--width=${width}`,
                `--height=${height}`,
                '--use-pixman', // CPU rendering, since headless renders nothing by default; pre-12 name for --renderer=pixman
                '--idle-time=0', // Weston otherwise sleeps after 300s without input
                '--no-config', // keeps a user's weston.ini out of the test compositor
                `--socket=${socketName}`,
            ],
            ready: {
                socketPath,
                socketLabel: 'Wayland socket',
                env: {
                    WAYLAND_DISPLAY: socketName,
                    XDG_RUNTIME_DIR: runtimeDir,
                    ...sessionEnv('wayland'),
                },
            },
            spawnEnv: { ...process.env, XDG_RUNTIME_DIR: runtimeDir },
            label: 'Weston',
            log: this.log,
            cleanup: () => rm(runtimeDir, { recursive: true, force: true }).catch(() => {}),
            cleanupSync: () => {
                try {
                    rmSync(runtimeDir, { recursive: true, force: true })
                } catch { /* best-effort */ }
            },
        })
    }

}

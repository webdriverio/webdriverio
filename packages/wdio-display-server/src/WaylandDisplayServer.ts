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
import { sessionEnv } from './sessionEnv.js'

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

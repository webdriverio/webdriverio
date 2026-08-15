import { exec } from 'node:child_process'
import { rmSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
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

export class WaylandDisplayServer implements DisplayServer {
    readonly name = 'wayland' as const
    private log = logger('@wdio/display-server:wayland')
    private static daemonCounter = 0

    async isAvailable(): Promise<boolean> {
        try {
            await execAsync('which weston')
            this.log.info('Weston compositor found in PATH')
            return true
        } catch {
            this.log.debug('Weston compositor not found')
            return false
        }
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
        return [
            '--ozone-platform=wayland',
            '--enable-features=UseOzonePlatform'
        ]
    }

    async startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon> {
        const width = options?.width ?? 1920
        const height = options?.height ?? 1080

        const id = ++WaylandDisplayServer.daemonCounter
        const runtimeDir = `/tmp/wdio-wayland-${process.pid}-${id}`
        const socketName = `wayland-${id}`
        const socketPath = `${runtimeDir}/${socketName}`

        await mkdir(runtimeDir, { recursive: true, mode: 0o700 })
        this.log.info(`Starting Weston daemon on ${socketName} (${width}x${height}) in ${runtimeDir}`)

        return runDaemon({
            command: 'weston',
            args: ['--backend=headless', `--width=${width}`, `--height=${height}`, '--use-pixman', `--socket=${socketName}`],
            socketPath,
            spawnEnv: { ...process.env, XDG_RUNTIME_DIR: runtimeDir },
            label: 'Weston',
            socketLabel: 'Wayland socket',
            log: this.log,
            env: {
                WAYLAND_DISPLAY: socketName,
                XDG_RUNTIME_DIR: runtimeDir,
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

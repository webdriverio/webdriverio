import { exec, spawn } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { promisify } from 'node:util'
import logger from '@wdio/logger'
import type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerInstallOptions,
} from './types.js'
import { installViaPackageManager, waitForSocket } from './utils.js'

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
        // Check if this is CentOS Stream 10 - Xvfb is not available
        if (await this.checkIsCentOS10()) {
            this.log.info('CentOS Stream 10 detected - Xvfb unavailable, skipping')
            this.isCentOS10 = true
            return false
        }

        try {
            await execAsync('which xvfb-run')
            await execAsync('which Xvfb')
            this.log.info('xvfb-run and Xvfb found in PATH')
            return true
        } catch {
            this.log.debug('xvfb-run or Xvfb not found')
            return false
        }
    }

    private async checkIsCentOS10(): Promise<boolean> {
        try {
            const { stdout } = await execAsync('cat /etc/os-release')
            return stdout.includes('CentOS Stream') && stdout.includes('VERSION_ID="10"')
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
                xbps: 'xbps-install -Sy xvfb',
            },
            log: this.log,
            options,
        })
    }

    getEnvironment(): Record<string, string> {
        // xvfb-run --auto-servernum sets DISPLAY itself before exec'ing the child
        return {}
    }

    getProcessWrapper(): string[] | null {
        // Wrap process with xvfb-run
        return ['xvfb-run', '--auto-servernum', '--']
    }

    getChromeFlags(): string[] {
        // Force the X11 ozone backend. On hosts that *also* have a Wayland
        // session running (e.g. a developer on a Wayland desktop using
        // `displayServer: 'xvfb'` to reproduce a CI failure), Chromium /
        // Electron otherwise auto-detect Wayland and try to connect to the
        // host's compositor — which we've explicitly unhooked from. Forcing
        // x11 makes the daemon authoritative.
        //
        // On clean CI runners (no Wayland session at all), the flag is a
        // harmless no-op because x11 is what Chromium would pick anyway.
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

        const proc = spawn(
            'Xvfb',
            [display, '-screen', '0', `${width}x${height}x${depth}`, '-nolisten', 'tcp'],
            { stdio: 'ignore' }
        )

        let rejectExit!: (err: Error) => void
        const exitPromise = new Promise<never>((_, reject) => { rejectExit = reject })
        const onExit = (code: number | null, signal: NodeJS.Signals | null) =>
            rejectExit(new Error(`Xvfb process exited unexpectedly (code=${code}, signal=${signal})`))
        const onError = (err: Error) =>
            rejectExit(new Error(`Xvfb process error: ${err.message}`))
        proc.once('exit', onExit)
        proc.once('error', onError)

        try {
            await Promise.race([waitForSocket(socketPath, 10_000, 'Xvfb socket'), exitPromise])
        } catch (err) {
            proc.removeListener('exit', onExit)
            proc.removeListener('error', onError)
            if (!proc.killed) {
                proc.kill('SIGTERM')
            }
            XvfbDisplayServer.reservedDisplays.delete(displayNum)
            throw err
        }
        proc.removeListener('exit', onExit)
        proc.removeListener('error', onError)

        let stopped = false
        const stop = async (): Promise<void> => {
            if (stopped) {
                return
            }
            stopped = true
            XvfbDisplayServer.reservedDisplays.delete(displayNum)
            this.log.info(`Stopping Xvfb daemon on ${display}`)
            proc.kill('SIGTERM')
            await new Promise<void>((resolve) => {
                const timer = setTimeout(() => {
                    if (proc.exitCode === null && proc.signalCode === null) {
                        proc.kill('SIGKILL')
                    }
                    resolve()
                }, 1000)
                proc.once('exit', () => {
                    clearTimeout(timer)
                    resolve()
                })
            })
        }

        // Force GDK / Electron / Chromium toolkits to the X11 backend. If the
        // caller's environment had `GDK_BACKEND=wayland,x11` (common on Wayland
        // desktops) or `ELECTRON_OZONE_PLATFORM_HINT=wayland`, GTK/Electron
        // would otherwise try Wayland first, fail to find a compositor (we're
        // running Xvfb, not Weston), and exit before producing a window — which
        // surfaces to wdio as `session not created: Chrome instance exited`.
        return {
            env: {
                DISPLAY: display,
                GDK_BACKEND: 'x11',
                ELECTRON_OZONE_PLATFORM_HINT: 'x11',
            },
            stop,
        }
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

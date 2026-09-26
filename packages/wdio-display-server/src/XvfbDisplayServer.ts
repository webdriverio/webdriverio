import logger from '@wdio/logger'
import type {
    DisplayDaemon,
    DisplayDaemonOptions,
    DisplayServer,
    DisplayServerInstallOptions,
} from './types.js'
import { commandExists, installViaPackageManager, resolveDaemonDimensions } from './utils.js'
import { DISPLAY_FD, runDaemon } from './daemonProcess.js'
import { sessionEnv } from './sessionEnv.js'

export class XvfbDisplayServer implements DisplayServer {
    readonly name = 'xvfb' as const
    private log = logger('@wdio/display-server:xvfb')

    async isAvailable(): Promise<boolean> {
        if (await commandExists('Xvfb')) {
            this.log.info('Xvfb found in PATH')
            return true
        }
        this.log.debug('Xvfb not found')
        return false
    }

    async install(options?: DisplayServerInstallOptions): Promise<boolean> {
        return installViaPackageManager({
            name: 'Xvfb',
            packageCommands: {
                apt: 'DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y xvfb',
                dnf: 'dnf -y makecache && dnf -y install xorg-x11-server-Xvfb',
                zypper: 'zypper --non-interactive refresh && zypper --non-interactive install -y xvfb-run',
                pacman: 'pacman -Syu --noconfirm xorg-server-xvfb', // -Syu, not -Sy: Arch doesn't support partial upgrades
                apk: 'apk add --no-cache xvfb-run',
                xbps: 'xbps-install -Suy xbps && xbps-install -y xvfb-run', // xbps refuses to install anything while xbps itself is outdated
            },
            log: this.log,
            options,
        })
    }

    async startDaemon(options?: DisplayDaemonOptions): Promise<DisplayDaemon> {
        const { width, height, depth } = resolveDaemonDimensions(options)

        this.log.info(`Starting Xvfb daemon (${width}x${height}x${depth})`)

        return runDaemon({
            command: 'Xvfb',
            args: [
                '-displayfd', String(DISPLAY_FD), // Xvfb claims the first free display and reports it here once listening
                '-screen', '0', `${width}x${height}x${depth}`,
                '-nolisten', 'tcp',
            ],
            ready: {
                displayFd: true,
                env: (display) => ({
                    DISPLAY: `:${display}`,
                    ...sessionEnv('x11'),
                }),
            },
            label: 'Xvfb',
            log: this.log,
        })
    }
}

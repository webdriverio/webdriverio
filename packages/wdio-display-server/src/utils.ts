import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export async function detectPackageManager(): Promise<string> {
    const packageManagers = [
        { command: 'apt-get', name: 'apt' },
        { command: 'dnf', name: 'dnf' },
        { command: 'yum', name: 'yum' },
        { command: 'zypper', name: 'zypper' },
        { command: 'pacman', name: 'pacman' },
        { command: 'apk', name: 'apk' },
        { command: 'xbps-install', name: 'xbps' },
    ]

    for (const { command, name } of packageManagers) {
        try {
            await execAsync(`which ${command}`)
            return name
        } catch {
            // Continue to next
        }
    }

    return 'unknown'
}

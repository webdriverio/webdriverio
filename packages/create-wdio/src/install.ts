import { execa } from 'execa'
import { detectPackageManager } from './utils.js'
import type { PACKAGE_MANAGER } from './constants.js'

const installCommand: Record<PACKAGE_MANAGER, string> = {
    npm: 'install',
    pnpm: 'add',
    yarn: 'add',
    bun: 'install'
}

const devFlag: Record<PACKAGE_MANAGER, string> = {
    npm: '--save-dev',
    pnpm: '--save-dev',
    yarn: '--dev',
    bun: '--dev'
}

export async function installPackages (cwd: string, packages: string[], dev: boolean) {
    const pm = detectPackageManager()
    const devParam = dev ? devFlag[pm] : ''

    console.log('\n')
    const p = execa(pm, [installCommand[pm], ...packages, devParam], {
        cwd,
        stdout: process.stdout,
        stderr: process.stderr
    })
    const { stdout, stderr, exitCode } = await p

    if (exitCode !== 0) {
        const cmd = getInstallCommand(pm, packages, dev)
        const customError = (
            '⚠️ An unknown error happened! Please retry ' +
            `installing dependencies via "${cmd}"\n\n` +
            `Error: ${stderr || stdout || 'unknown'}`
        )
        console.error(customError)
        return false
    }

    return true
}

export function getInstallCommand (pm: PACKAGE_MANAGER, packages: string[], dev: boolean) {
    const devParam = dev ? devFlag[pm] : ''
    return `${pm} ${installCommand[pm]} ${packages.join(' ')} ${devParam}`
}

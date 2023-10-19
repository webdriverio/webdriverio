import { execa } from 'execa'
import { detect, type PM } from 'detect-package-manager'

const installCommand: Record<PM, string> = {
    npm: 'install',
    pnpm: 'install',
    yarn: 'add',
    bun: 'install'
}

const devFlag: Record<PM, string> = {
    npm: '--save-dev',
    pnpm: '--dev',
    yarn: '--dev',
    bun: '--dev'
}

export async function installPackages (cwd: string, packages: string[], dev: boolean) {
    const pm = await detect({ cwd })
    const devParam = dev ? devFlag[pm] : ''
    const { stdout, stderr, exitCode } = await execa(pm, [installCommand[pm], ...packages, devParam], { cwd })
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

export function getInstallCommand (pm: PM, packages: string[], dev: boolean) {
    const devParam = dev ? devFlag[pm] : ''
    return `${pm} ${installCommand[pm]} ${packages.join(' ')} ${devParam}`
}

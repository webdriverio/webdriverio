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
    // show the output while it runs, and keep it to repeat the error after it
    const { stdout, stderr, exitCode, shortMessage } = await execa(pm, [installCommand[pm], ...packages, devParam], {
        cwd,
        reject: false,
        stdout: ['inherit', 'pipe'],
        stderr: ['inherit', 'pipe']
    })

    if (exitCode !== 0) {
        const cmd = getInstallCommand(pm, packages, dev)
        const output = String(stderr || stdout || '').split(/\r?\n/)
        // npm "npm error" / "npm ERR!", pnpm "ERR_PNPM_…", yarn and bun "error"
        const errorLines = output.filter((line) => /error|\bERR/i.test(line))
        console.error(
            `\n⚠️ Installing the packages failed${exitCode === undefined ? '' : ` (exit code ${exitCode})`}:\n\n` +
            `${(errorLines.length > 0 ? errorLines : output.slice(-20)).join('\n').trim() || shortMessage}\n\n` +
            `Fix the error above, then run the wizard again. To check the install alone, run:\n${cmd}`
        )
        return false
    }

    return true
}

export function getInstallCommand (pm: PACKAGE_MANAGER, packages: string[], dev: boolean) {
    const devParam = dev ? devFlag[pm] : ''
    return `${pm} ${installCommand[pm]} ${packages.join(' ')} ${devParam}`
}

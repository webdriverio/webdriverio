import { execa } from 'execa'
import { detectPackageManager } from './utils.js'
import { preparePnpmInstall } from './pnpm.js'
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

// codes of a passing Yarn 2+ install: information and warnings, not errors
const YARN_INFO_CODES = ['YN0000', 'YN0002', 'YN0004', 'YN0013', 'YN0085', 'YN0086']

// npm "npm error" / "npm ERR!", pnpm "ERR_PNPM_…", bun "error"; Yarn 2+ writes codes to stdout
function isErrorLine (line: string) {
    const yarnCode = line.match(/\bYN\d{4}(?=:)/)?.[0]
    return yarnCode ? !YARN_INFO_CODES.includes(yarnCode) : /error|\bERR/i.test(line)
}

export async function installPackages (cwd: string, packages: string[], dev: boolean) {
    const pm = detectPackageManager()
    const devParam = dev ? devFlag[pm] : ''
    const flags = await preparePnpmInstall(pm, cwd)

    console.log('\n')
    // show the output while it runs, and keep it to repeat the error after it
    const { stdout, stderr, exitCode, shortMessage } = await execa(pm, [installCommand[pm], ...packages, devParam, ...flags], {
        cwd,
        reject: false,
        stdout: ['inherit', 'pipe'],
        stderr: ['inherit', 'pipe']
    })

    if (exitCode !== 0) {
        const cmd = getInstallCommand(pm, packages, dev, flags)
        const output = [stderr, stdout].map((text) => String(text || '')).join('\n').split(/\r?\n/)
        const errorLines = output.filter(isErrorLine)
        console.error(
            `\n⚠️ Installing the packages failed${exitCode === undefined ? '' : ` (exit code ${exitCode})`}:\n\n` +
            `${(errorLines.length > 0 ? errorLines : output.slice(-20)).join('\n').trim() || shortMessage}\n\n` +
            `Fix the error above, then run the wizard again. To check the install alone, run:\n${cmd}`
        )
        return false
    }

    return true
}

export function getInstallCommand (pm: PACKAGE_MANAGER, packages: string[], dev: boolean, flags: string[] = []) {
    const devParam = dev ? devFlag[pm] : ''
    return [pm, installCommand[pm], ...packages, devParam, ...flags].filter(Boolean).join(' ')
}
